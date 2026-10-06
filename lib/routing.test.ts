import { describe, expect, it } from "vitest";
import { fileKind, routeArtifact, type RouteInput } from "./routing";

const base: RouteInput = { type: "document", audioMode: null, fileKind: null, fileSize: 0, text: null };

describe("fileKind", () => {
  it("classifies by extension when the browser sends no mime type", () => {
    expect(fileKind("notes.md", "")).toBe("text");
    expect(fileKind("essay.DOCX", "application/octet-stream")).toBe("docx");
    expect(fileKind("plan.pdf", "")).toBe("pdf");
  });
  it("classifies office formats by extension", () => {
    const xlsxMime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    expect(fileKind("budget.xlsx", xlsxMime)).toBe("xlsx");
    expect(fileKind("deck.PPTX", "")).toBe("pptx");
    // Windows with Excel installed reports CSV as an Excel mime type.
    expect(fileKind("survey.csv", "application/vnd.ms-excel")).toBe("text");
    expect(fileKind("old.xls", "application/vnd.ms-excel")).toBe("other");
  });
  it("classifies by mime type", () => {
    expect(fileKind("photo", "image/png")).toBe("image");
    expect(fileKind("clip.mov", "video/quicktime")).toBe("video");
    expect(fileKind("song.m4a", "audio/mp4")).toBe("audio");
    expect(fileKind("drawing.heic", "image/heic")).toBe("other");
    expect(fileKind("game.zip", "application/zip")).toBe("other");
  });
});

describe("routeArtifact", () => {
  it("always sends video, games and listen-mode audio to a human (Layer 1)", () => {
    expect(routeArtifact({ ...base, type: "video", fileKind: "video" }).aiReviewable).toBe(false);
    expect(routeArtifact({ ...base, type: "game", text: "some description" }).aiReviewable).toBe(false);
    expect(
      routeArtifact({ ...base, type: "audio", audioMode: "listen", fileKind: "audio" }).aiReviewable,
    ).toBe(false);
  });

  it("sends readable text and transcripts to the AI", () => {
    expect(routeArtifact({ ...base, fileKind: "pdf", text: "My essay" })).toEqual({ aiReviewable: true });
    expect(routeArtifact({ ...base, type: "presentation", fileKind: "pptx", text: "### Slide 1" })).toEqual({
      aiReviewable: true,
    });
    expect(routeArtifact({ ...base, type: "spreadsheet", fileKind: "xlsx", text: "## Sheet: Budget" })).toEqual({
      aiReviewable: true,
    });
    expect(
      routeArtifact({ ...base, type: "audio", audioMode: "transcribe", fileKind: "audio", text: "Hi" }),
    ).toEqual({ aiReviewable: true });
  });

  it("sends supported images under 10 MB to the AI", () => {
    expect(routeArtifact({ ...base, type: "image", fileKind: "image", fileSize: 1_000 }).aiReviewable).toBe(true);
    const big = routeArtifact({ ...base, type: "image", fileKind: "image", fileSize: 11 * 1024 * 1024 });
    expect(big.aiReviewable).toBe(false);
  });

  it("routes to a human with a specific reason when nothing is readable", () => {
    const scanned = routeArtifact({ ...base, fileKind: "pdf", text: "  " });
    expect(scanned).toMatchObject({ aiReviewable: false, reason: expect.stringMatching(/no readable text/i) });
    const imageOnlyDeck = routeArtifact({ ...base, fileKind: "pptx", text: "" });
    expect(imageOnlyDeck).toMatchObject({ aiReviewable: false, reason: expect.stringMatching(/no readable text/i) });
    const emptyTranscript = routeArtifact({ ...base, type: "audio", audioMode: "transcribe", fileKind: "audio" });
    expect(emptyTranscript).toMatchObject({ aiReviewable: false, reason: expect.stringMatching(/transcript/i) });
    const linkOnly = routeArtifact({ ...base, type: "other" });
    expect(linkOnly).toMatchObject({ aiReviewable: false, reason: expect.stringMatching(/link/i) });
    const unknown = routeArtifact({ ...base, type: "other", fileKind: "other" });
    expect(unknown).toMatchObject({ aiReviewable: false, reason: expect.stringMatching(/format/i) });
  });
});
