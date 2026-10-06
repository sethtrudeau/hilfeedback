import { ARTIFACT_TYPE_LABELS, type ArtifactType, type ChatTurn, type Rubric } from "./types";

export interface PriorVersion {
  versionNumber: number;
  learnerNote: string | null;
  aiTurns: ChatTurn[];
  humanFeedback: string[];
}

export interface FeedbackPromptInput {
  projectTitle: string;
  brief: string;
  rubric: Rubric | null;
  artifactTitle: string;
  artifactType: ArtifactType;
  fromTranscript: boolean;
  history: PriorVersion[];
}

export function formatRubric(rubric: Rubric | null): string {
  if (!rubric || rubric.criteria.length === 0) {
    return "No structured rubric was extracted. Use the rubric and goals described in the project brief.";
  }
  return rubric.criteria
    .map((c) => `- ${c.name}: ${c.description}${c.levels.length ? ` (levels: ${c.levels.join(" / ")})` : ""}`)
    .join("\n");
}

function formatHistory(history: PriorVersion[]): string {
  return history
    .map((v) => {
      const ai = v.aiTurns.map((t) => `${t.role === "assistant" ? "AI coach" : "Learner"}: ${t.content}`);
      const human = v.humanFeedback.map((h) => `Evaluator: ${h}`);
      return [
        `### Version ${v.versionNumber}`,
        v.learnerNote ? `Learner's note: ${v.learnerNote}` : null,
        ai.length ? `AI feedback conversation:\n${ai.join("\n\n")}` : "No AI feedback on this version.",
        human.length ? `Human feedback:\n${human.join("\n\n")}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

export function feedbackSystemPrompt(input: FeedbackPromptInput): string {
  const sections = [
    `You are a feedback coach for a high school learner working on a Flex Credit project: a real-world project that earns course credit. Your job is formative feedback that helps the learner improve their work while they are still making it. You are not grading.

How to give feedback:
- Ground every point in the project brief and rubric below, and name the rubric criterion you are talking about.
- Start with what is working, citing specific evidence from the artifact.
- Then name the most important gaps against the rubric criteria this artifact addresses. Not every criterion applies to every artifact; skip the ones that don't rather than stretching.
- End with 2 to 4 concrete next steps the learner can take.
- Never give a grade, score, rubric level, or credit decision.
- Only comment on what you can actually see or read in the artifact. If something is unclear, cut off or missing, say so instead of guessing.
- Write directly to the learner in plain, encouraging, honest language. Use short paragraphs or bullet points (Markdown). Keep your first response under about 350 words.
- In follow-up messages, answer the learner's questions and help them think it through. Don't do the work for them.`,
  ];

  if (input.fromTranscript) {
    sections.push(
      `This artifact was spoken and you are reading an automatic transcript. Don't critique filler words, punctuation, spelling or other transcription artifacts; focus on the ideas and how they are communicated.`,
    );
  }

  if (input.history.length) {
    sections.push(
      `This is a new iteration of an artifact the learner has submitted before. Below is the feedback on earlier versions. Point out what changed, which earlier feedback the learner addressed, and what is still open. Don't repeat earlier feedback that has been addressed.\n\n${formatHistory(input.history)}`,
    );
  }

  sections.push(
    `## Project: ${input.projectTitle}\n\n### Project brief (from the Flex Credit Guide)\n${input.brief}\n\n### Rubric\n${formatRubric(input.rubric)}`,
    `## Artifact being reviewed\nTitle: ${input.artifactTitle}\nType: ${ARTIFACT_TYPE_LABELS[input.artifactType]}`,
  );

  return sections.join("\n\n");
}

export const RUBRIC_EXTRACTION_PROMPT = `You extract the assessment rubric from a Flex Credit plan written for a high school learner's real-world project.

Return ONLY a JSON object with this shape and nothing else:
{"criteria": [{"name": string, "description": string, "levels": string[]}], "standards": string[]}

- "criteria": each rubric criterion in the plan, with a one-sentence description of what it assesses.
- "levels": the performance level labels for that criterion from lowest to highest, as written in the plan. If the plan names none, use ["Beginning", "Developing", "Proficient", "Advanced"].
- "standards": the standard codes or names the plan aligns to.
- If the plan has no explicit rubric, derive 3 to 6 criteria from its goals, milestones and standards.`;

export const SUMMARY_PROMPT = `You help an evaluator (the Reviewer) understand how a high school learner's Flex Credit project developed, so they can complete a fair final evaluation. You will receive the project rubric and the full history of the learner's artifacts, versions, AI feedback conversations and human feedback.

Write a concise Markdown summary with these sections:
## Overview
Two or three sentences on what the learner made and how actively they iterated.
## By artifact
For each artifact: how it changed across versions, the key feedback it got, what the learner addressed, and what is still open.
## Patterns across rubric criteria
Recurring strengths and gaps, organized by rubric criterion.
## Human review
What human reviewers said, and any artifacts still waiting for human review.

Be factual. Make clear whether a point came from AI feedback or a human reviewer. Do not assign grades, scores or rubric levels.`;
