import { describe, expect, it } from "vitest";
import { feedbackSystemPrompt, formatRubric } from "./prompts";
import { SEED_RUBRIC } from "./seed-data";

const base = {
  projectTitle: "Skatepark",
  brief: "BRIEF TEXT",
  rubric: SEED_RUBRIC,
  artifactTitle: "Site plan",
  artifactType: "image" as const,
  fromTranscript: false,
  history: [],
};

describe("feedbackSystemPrompt", () => {
  it("includes the brief and every rubric criterion", () => {
    const prompt = feedbackSystemPrompt(base);
    expect(prompt).toContain("BRIEF TEXT");
    for (const c of SEED_RUBRIC.criteria) expect(prompt).toContain(c.name);
  });

  it("tells the model not to critique transcription artifacts for spoken work", () => {
    expect(feedbackSystemPrompt(base)).not.toMatch(/filler words/);
    expect(feedbackSystemPrompt({ ...base, fromTranscript: true })).toMatch(/filler words/);
  });

  it("includes earlier versions' feedback for iterations (R9)", () => {
    const prompt = feedbackSystemPrompt({
      ...base,
      history: [
        {
          versionNumber: 1,
          learnerNote: "first draft",
          aiTurns: [{ role: "assistant", content: "Add a scale bar." }],
          humanFeedback: ["Measure the lot again."],
        },
      ],
    });
    expect(prompt).toContain("Version 1");
    expect(prompt).toContain("Add a scale bar.");
    expect(prompt).toContain("Measure the lot again.");
    expect(prompt).toMatch(/what changed/i);
  });
});

describe("formatRubric", () => {
  it("falls back to the brief when no rubric was extracted", () => {
    expect(formatRubric(null)).toMatch(/brief/i);
  });
});
