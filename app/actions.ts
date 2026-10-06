"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, SESSION_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProjectFor, getVersion, listVersions, parseRubric } from "@/lib/data";
import { extractRubric, generateProjectSummary } from "@/lib/feedback";
import { extractText, isFile, saveUpload, uploadPath } from "@/lib/files";
import { notify } from "@/lib/notify";
import { fileKind, routeArtifact } from "@/lib/routing";
import { transcribe } from "@/lib/transcribe";
import type { Artifact, ArtifactType, AudioMode, RubricScore, User } from "@/lib/types";

export type FormState = { error?: string } | undefined;

const ARTIFACT_TYPES: ArtifactType[] = ["written", "audio", "image", "video", "game", "other"];

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ---------- Session ----------

export async function login(formData: FormData) {
  const user = db().prepare("SELECT * FROM users WHERE email = ?").get(str(formData, "email").toLowerCase()) as
    | User
    | undefined;
  if (!user) redirect("/login?error=1");
  (await cookies()).set(SESSION_COOKIE, String(user.id), { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

// ---------- Projects (learner) ----------

export async function createProject(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("learner");
  const title = str(formData, "title");
  if (!title) return { error: "Give your project a title." };
  if (!user.evaluator_id) return { error: "Your account has no evaluator assigned." };

  const parts = [str(formData, "brief_text")];
  let briefFile: string | null = null;
  const file = formData.get("brief_file");
  if (isFile(file)) {
    const saved = await saveUpload(file);
    const kind = fileKind(saved.originalName, saved.mime);
    if (!["pdf", "docx", "text"].includes(kind)) return { error: "The brief must be a PDF, Word (.docx) or text file." };
    try {
      parts.push((await extractText(saved.storedName, kind))?.trim() ?? "");
    } catch (err) {
      return { error: `Couldn't read the brief file: ${message(err)}` };
    }
    briefFile = saved.storedName;
  }
  const brief = parts.filter(Boolean).join("\n\n");
  if (!brief) return { error: "Attach your Flex Credit brief or paste its text (R4)." };

  let rubricJson: string | null = null;
  try {
    rubricJson = JSON.stringify(await extractRubric(brief));
  } catch (err) {
    console.error("Rubric extraction failed:", err);
  }

  const { lastInsertRowid } = db()
    .prepare(
      "INSERT INTO projects (learner_id, evaluator_id, title, brief_text, brief_file, rubric_json) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(user.id, user.evaluator_id, title, brief, briefFile, rubricJson);
  redirect(`/learner/projects/${lastInsertRowid}`);
}

export async function retryRubric(formData: FormData) {
  const user = await requireUser();
  const project = getProjectFor(user, Number(formData.get("project_id")));
  if (!project) return;
  try {
    db().prepare("UPDATE projects SET rubric_json = ? WHERE id = ?").run(
      JSON.stringify(await extractRubric(project.brief_text)),
      project.id,
    );
  } catch (err) {
    console.error("Rubric extraction failed:", err);
  }
  revalidatePath("/", "layout");
}

export async function submitFinalProject(formData: FormData) {
  const user = await requireUser("learner");
  const project = getProjectFor(user, Number(formData.get("project_id")));
  if (!project || project.status !== "Active") redirect("/learner");
  db().prepare("UPDATE projects SET status = 'Submitted', submitted_at = datetime('now') WHERE id = ?").run(project.id);
  notify(
    project.evaluator_id,
    "final_submitted",
    `${user.name} submitted the final project "${project.title}" for evaluation.`,
    `/evaluator/projects/${project.id}`,
    "high",
  );
  revalidatePath("/", "layout");
  redirect(`/learner/projects/${project.id}`);
}

// ---------- Artifacts (learner) ----------

export async function submitArtifact(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("learner");
  const project = getProjectFor(user, Number(formData.get("project_id")));
  if (!project) return { error: "Project not found." };
  if (project.status !== "Active") return { error: "This project has been submitted and is locked." };

  let artifact: Artifact | undefined;
  let title = str(formData, "title");
  let type = str(formData, "type") as ArtifactType;
  if (formData.get("mode") === "iteration") {
    artifact = db()
      .prepare("SELECT * FROM artifacts WHERE id = ? AND project_id = ?")
      .get(Number(formData.get("artifact_id")), project.id) as Artifact | undefined;
    if (!artifact) return { error: "Pick the artifact this is an iteration of." };
    title = artifact.title;
    type = artifact.type;
  } else {
    if (!title) return { error: "Give your artifact a title." };
    if (!ARTIFACT_TYPES.includes(type)) return { error: "Pick an artifact type." };
  }

  const audioMode = type === "audio" ? (str(formData, "audio_mode") as AudioMode) : null;
  if (type === "audio" && audioMode !== "transcribe" && audioMode !== "listen") {
    return { error: "Choose whether your audio should be transcribed or listened to." };
  }

  const file = formData.get("file");
  const pasted = str(formData, "text");
  const link = str(formData, "link_url");
  const note = str(formData, "learner_note");
  if (!isFile(file) && !pasted && !link) return { error: "Add a file, some text, or a link." };
  if (link && !/^https?:\/\//i.test(link)) return { error: "Links must start with http:// or https://." };

  const saved = isFile(file) ? await saveUpload(file) : null;
  const kind = saved ? fileKind(saved.originalName, saved.mime) : null;

  let transcript: string | null = null;
  if (audioMode === "transcribe") {
    if (!saved || kind !== "audio") return { error: "Transcribe mode needs an audio file." };
    try {
      transcript = await transcribe(uploadPath(saved.storedName), saved.mime);
    } catch (err) {
      return { error: `Transcription failed: ${message(err)}` };
    }
  }

  let extracted: string | null = null;
  if (saved && kind) {
    try {
      extracted = await extractText(saved.storedName, kind);
    } catch (err) {
      console.error("Text extraction failed:", err);
    }
  }
  const text = [pasted, extracted?.trim()].filter(Boolean).join("\n\n") || null;

  const route = routeArtifact({
    type,
    audioMode,
    fileKind: kind,
    fileSize: saved?.size ?? 0,
    text: transcript ?? text,
  });

  const versionId = db().transaction(() => {
    const artifactId =
      artifact?.id ??
      Number(
        db().prepare("INSERT INTO artifacts (project_id, title, type) VALUES (?, ?, ?)").run(project.id, title, type)
          .lastInsertRowid,
      );
    const previous = listVersions(artifactId).at(-1);
    const id = Number(
      db()
        .prepare(
          `INSERT INTO artifact_versions (artifact_id, parent_version_id, version_number, file_path, file_name,
             mime_type, text_content, link_url, learner_note, audio_mode, transcript, ai_reviewable)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          artifactId,
          previous?.id ?? null,
          (previous?.version_number ?? 0) + 1,
          saved?.storedName ?? null,
          saved?.originalName ?? null,
          saved?.mime ?? null,
          text,
          link || null,
          note || null,
          audioMode,
          transcript,
          route.aiReviewable ? 1 : 0,
        ).lastInsertRowid,
    );
    if (!route.aiReviewable) {
      db().prepare("INSERT INTO routing_decisions (artifact_version_id, layer, reason) VALUES (?, 'rule', ?)").run(
        id,
        route.reason,
      );
      notify(
        project.evaluator_id,
        "always_human",
        `${user.name} submitted "${title}" (v${(previous?.version_number ?? 0) + 1}) and it needs your review.`,
        `/versions/${id}`,
      );
    }
    return id;
  })();

  revalidatePath("/", "layout");
  redirect(`/versions/${versionId}`);
}

// ---------- Human review (learner or evaluator) ----------

export async function requestHumanReview(formData: FormData) {
  const user = await requireUser();
  const version = getVersion(Number(formData.get("version_id")));
  const project = version && getProjectFor(user, version.project_id);
  if (!version || !project || project.status === "Evaluated") return;

  const note = str(formData, "note");
  const who = user.role === "learner" ? "Learner" : "Evaluator";
  db().prepare(
    "INSERT INTO routing_decisions (artifact_version_id, layer, reason, requested_by) VALUES (?, 'manual', ?, ?)",
  ).run(version.id, note ? `${who} note: ${note}` : `${who} requested human review.`, user.id);
  if (user.role === "learner") {
    notify(
      project.evaluator_id,
      "review_requested",
      `${user.name} asked for your review of "${version.artifact_title}" (v${version.version_number}).`,
      `/versions/${version.id}`,
    );
  }
  revalidatePath("/", "layout");
}

export async function respondToVersion(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("evaluator");
  const version = getVersion(Number(formData.get("version_id")));
  const project = version && getProjectFor(user, version.project_id);
  if (!version || !project) return { error: "Artifact not found." };

  const text = str(formData, "text");
  const audio = formData.get("audio");
  if (!text && !isFile(audio)) return { error: "Write feedback or attach an audio file." };

  let audioFile: string | null = null;
  let transcript: string | null = null;
  if (isFile(audio)) {
    const saved = await saveUpload(audio);
    if (fileKind(saved.originalName, saved.mime) !== "audio") return { error: "The attachment must be an audio file." };
    audioFile = saved.storedName;
    try {
      transcript = await transcribe(uploadPath(saved.storedName), saved.mime);
    } catch (err) {
      // Keep the audio even if transcription fails; the learner can still listen.
      console.error("Evaluator audio transcription failed:", err);
    }
  }

  db().transaction(() => {
    db().prepare(
      `INSERT INTO feedback_logs (artifact_version_id, source, author_id, messages_json, audio_file, transcript)
       VALUES (?, 'human', ?, ?, ?, ?)`,
    ).run(
      version.id,
      user.id,
      JSON.stringify(text ? [{ role: "assistant", content: text }] : []),
      audioFile,
      transcript,
    );
    db().prepare(
      "UPDATE routing_decisions SET status = 'resolved', resolved_at = datetime('now') WHERE artifact_version_id = ? AND status = 'pending'",
    ).run(version.id);
  })();

  notify(
    project.learner_id,
    "evaluator_feedback",
    `${user.name} left feedback on "${version.artifact_title}" (v${version.version_number}).`,
    `/versions/${version.id}`,
  );
  revalidatePath("/", "layout");
  return {};
}

// ---------- Evaluation (evaluator) ----------

export async function generateSummary(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("evaluator");
  const project = getProjectFor(user, Number(formData.get("project_id")));
  if (!project) return { error: "Project not found." };
  try {
    await generateProjectSummary(project.id);
  } catch (err) {
    return { error: message(err) };
  }
  revalidatePath("/", "layout");
  return {};
}

export async function submitEvaluation(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("evaluator");
  const project = getProjectFor(user, Number(formData.get("project_id")));
  if (!project) return { error: "Project not found." };
  if (project.status !== "Submitted") return { error: "Only submitted projects can be evaluated." };

  const criteria = parseRubric(project)?.criteria ?? [];
  const scores: RubricScore[] = criteria.map((c, i) => ({
    criterion: c.name,
    level: str(formData, `level_${i}`),
    comment: str(formData, `comment_${i}`),
  }));
  if (scores.some((s) => !s.level)) return { error: "Choose a level for every rubric criterion." };
  const comments = str(formData, "comments");
  if (!comments) return { error: "Add final comments for the learner." };

  db().transaction(() => {
    db().prepare(
      "INSERT INTO evaluations (project_id, evaluator_id, rubric_scores_json, comments) VALUES (?, ?, ?, ?)",
    ).run(project.id, user.id, JSON.stringify(scores), comments);
    db().prepare("UPDATE projects SET status = 'Evaluated' WHERE id = ?").run(project.id);
  })();
  notify(
    project.learner_id,
    "evaluation_submitted",
    `Your final evaluation for "${project.title}" is ready.`,
    `/learner/projects/${project.id}`,
    "high",
  );
  revalidatePath("/", "layout");
  return {};
}

// ---------- Notifications ----------

export async function markAllRead() {
  const user = await requireUser();
  db().prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(user.id);
  revalidatePath("/", "layout");
}
