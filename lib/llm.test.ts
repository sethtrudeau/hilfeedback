import { describe, expect, it } from "vitest";
import { apiError, extractJson, stripThinking } from "./llm";

describe("apiError", () => {
  it("surfaces OpenRouter's error message", () => {
    const err = apiError("AI request", 402, { error: { message: "Insufficient credits", code: 402 } });
    expect(err.message).toBe("AI request failed (402): Insufficient credits");
  });
  it("falls back to the raw body", () => {
    expect(apiError("Transcription", 500, null).message).toBe("Transcription failed (500): null");
  });
});

describe("stripThinking", () => {
  it("removes <think> blocks", () => {
    expect(stripThinking("<think>hmm\nok</think>\n\nGreat work!")).toBe("Great work!");
  });
  it("leaves plain text alone", () => {
    expect(stripThinking("  Hello  ")).toBe("Hello");
  });
});

describe("extractJson", () => {
  it("parses fenced JSON", () => {
    expect(extractJson('Here:\n```json\n{"a": 1}\n```')).toEqual({ a: 1 });
  });
  it("parses JSON surrounded by prose", () => {
    expect(extractJson('Sure! {"criteria": []} Hope that helps.')).toEqual({ criteria: [] });
  });
  it("throws when there is no JSON object", () => {
    expect(() => extractJson("no json here")).toThrow();
  });
});
