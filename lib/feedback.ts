import { db } from "./db";
import {
  aiTurns,
  getAiLog,
  getProject,
  getVersion,
  humanFeedback,
  listArtifacts,
  listVersions,
  parseRubric,
  pendingVersionIds,
  routingDecisions,
  type VersionDetail,
} from "./data";
import { toDataUrl } from "./files";
import { chat, extractJson, LlmError, type ContentPart, type LlmMessage } from "./llm";
import {
  feedbackSystemPrompt,
  formatRubric,
  RUBRIC_EXTRACTION_PROMPT,
  SUMMARY_PROMPT,
  type PriorVersion,
} from "./prompts";
import { ARTIFACT_TYPE_LABELS, type ChatTurn, type Rubric } from "./types";

async function artifactContent(v: VersionDetail): Promise<ContentPart[]> {
  const lines = [`Here is version ${v.version_number} of my artifact "${v.artifact_title}". Please give me feedback.`];
  if (v.learner_note) lines.push(`My note about this version: ${v.learner_note}`);
  if (v.link_url) lines.push(`I also included a link (you can't open it): ${v.link_url}`);
  if (v.transcript) lines.push(`Transcript of my recording:\n\n${v.transcript}`);
  if (v.text_content) lines.push(`Text of my artifact${v.file_name ? ` (${v.file_name})` : ""}:\n\n${v.text_content}`);

  const parts: ContentPart[] = [{ type: "text", text: lines.join("\n\n") }];
  if (v.file_path && v.mime_type?.startsWith("image/")) {
    parts.push({ type: "image_url", image_url: { url: await toDataUrl(v.file_path, v.mime_type) } });
  }
  return parts;
}

function priorVersions(v: VersionDetail): PriorVersion[] {
  return listVersions(v.artifact_id)
    .filter((p) => p.version_number < v.version_number)
    .map((p) => ({
      versionNumber: p.version_number,
      learnerNote: p.learner_note,
      aiTurns: aiTurns(p.id),
      humanFeedback: humanFeedback(p.id).map((h) => h.text || h.transcript || "(audio feedback)"),
    }));
}

function saveAiTurns(versionId: number, turns: ChatTurn[]) {
  const json = JSON.stringify(turns);
  const existing = getAiLog(versionId);
  if (existing) {
    db().prepare("UPDATE feedback_logs SET messages_json = ?, updated_at = datetime('now') WHERE id = ?").run(
      json,
      existing.id,
    );
  } else {
    db().prepare("INSERT INTO feedback_logs (artifact_version_id, source, messages_json) VALUES (?, 'ai', ?)").run(
      versionId,
      json,
    );
  }
}

async function generate(versionId: number, turns: ChatTurn[]): Promise<ChatTurn[]> {
  const v = getVersion(versionId)!;
  const project = getProject(v.project_id)!;
  const messages: LlmMessage[] = [
    {
      role: "system",
      content: feedbackSystemPrompt({
        projectTitle: project.title,
        brief: project.brief_text,
        rubric: parseRubric(project),
        artifactTitle: v.artifact_title,
        artifactType: v.artifact_type,
        fromTranscript: Boolean(v.transcript),
        history: priorVersions(v),
      }),
    },
    { role: "user", content: await artifactContent(v) },
    ...turns,
  ];
  const updated: ChatTurn[] = [...turns, { role: "assistant", content: await chat(messages) }];
  saveAiTurns(versionId, updated);
  return updated;
}

// Dedupes concurrent requests for the same version's initial feedback.
const inflight = new Map<number, Promise<ChatTurn[]>>();

export async function ensureInitialFeedback(versionId: number): Promise<ChatTurn[]> {
  const turns = aiTurns(versionId);
  if (turns.length) return turns;
  let pending = inflight.get(versionId);
  if (!pending) {
    pending = generate(versionId, []).finally(() => inflight.delete(versionId));
    inflight.set(versionId, pending);
  }
  return pending;
}

export async function continueFeedback(versionId: number, message: string): Promise<ChatTurn[]> {
  return generate(versionId, [...aiTurns(versionId), { role: "user", content: message }]);
}

export async function extractRubric(brief: string): Promise<Rubric> {
  const reply = await chat([
    { role: "system", content: RUBRIC_EXTRACTION_PROMPT },
    { role: "user", content: brief },
  ]);
  const parsed = extractJson(reply) as { criteria?: unknown; standards?: unknown };
  if (!Array.isArray(parsed.criteria)) throw new LlmError("Rubric extraction returned an unexpected shape.");
  return {
    criteria: parsed.criteria.map((c: Record<string, unknown>) => ({
      name: String(c.name ?? "Criterion"),
      description: String(c.description ?? ""),
      levels: Array.isArray(c.levels) ? c.levels.map(String) : [],
    })),
    standards: Array.isArray(parsed.standards) ? parsed.standards.map(String) : [],
  };
}

export async function generateProjectSummary(projectId: number): Promise<string> {
  const project = getProject(projectId)!;
  const pending = pendingVersionIds(projectId);
  const artifacts = listArtifacts(projectId).map((a) => {
    const versions = a.versions.map((v) => {
      const routes = routingDecisions(v.id).map(
        (r) => `- Human review (${r.layer === "rule" ? "always-human rule" : "requested"}): ${r.reason}`,
      );
      const ai = aiTurns(v.id).map((t) => `${t.role === "assistant" ? "AI coach" : "Learner"}: ${t.content}`);
      const human = humanFeedback(v.id).map((h) => `${h.author_name} (evaluator): ${h.text || h.transcript || "(audio)"}`);
      return [
        `### Version ${v.version_number} (submitted ${v.submitted_at})${pending.has(v.id) ? " [awaiting human review]" : ""}`,
        v.learner_note ? `Learner's note: ${v.learner_note}` : null,
        ...routes,
        ai.length ? `AI feedback conversation:\n${ai.join("\n\n")}` : "No AI feedback.",
        human.length ? `Human feedback:\n${human.join("\n\n")}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    });
    return `## Artifact: ${a.title} (${ARTIFACT_TYPE_LABELS[a.type]}), ${a.versions.length} version(s)\n\n${versions.join("\n\n")}`;
  });

  const summary = await chat(
    [
      { role: "system", content: SUMMARY_PROMPT },
      {
        role: "user",
        content: `# Project: ${project.title}\n\n## Rubric\n${formatRubric(parseRubric(project))}\n\n${
          artifacts.length ? artifacts.join("\n\n") : "The learner has not submitted any artifacts yet."
        }`,
      },
    ],
    6000,
  );
  db().prepare("UPDATE projects SET feedback_summary = ?, summary_updated_at = datetime('now') WHERE id = ?").run(
    summary,
    projectId,
  );
  return summary;
}
