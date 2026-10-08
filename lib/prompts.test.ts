import { describe, expect, it } from "vitest";
import { feedbackSystemPrompt, formatRubric } from "./prompts";
import { SEED_RUBRIC } from "./seed-data";

const base = {
  learnerFirstName: "Priya",
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

  it("organizes feedback around the rubric's exact criterion names", () => {
    const prompt = feedbackSystemPrompt(base);
    expect(prompt).toMatch(/exact name/i);
    expect(prompt).toMatch(/heading/i);
    expect(prompt).toMatch(/rubric's own (wording|language)/i);
    expect(prompt).toMatch(/next step.*criterion/i);
    expect(prompt).toMatch(/doesn't address/i);
  });

  it("tells the model the learner's first name so it doesn't invent one", () => {
    expect(feedbackSystemPrompt(base)).toMatch(/learner's first name is Priya/);
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

  it("numbers criteria and keeps their descriptions and levels", () => {
    const text = formatRubric(SEED_RUBRIC);
    expect(text).toMatch(/^1\. Geometric modeling/m);
    expect(text).toMatch(/^2\. Research and use of evidence/m);
    expect(text).toContain(SEED_RUBRIC.criteria[0].description);
    expect(text).toContain("Beginning, Developing, Proficient, Advanced");
  });
});
