import type { ArtifactType, AudioMode } from "./types";

export type FileKind = "pdf" | "docx" | "xlsx" | "pptx" | "text" | "image" | "audio" | "video" | "other";

/** Kinds we extract text from (see lib/files.ts). */
const TEXT_KINDS: FileKind[] = ["pdf", "docx", "xlsx", "pptx", "text"];

// Image formats MiniMax M3 accepts as image input.
const AI_IMAGE_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const MAX_AI_IMAGE_BYTES = 10 * 1024 * 1024;

export function fileKind(name: string, mime: string): FileKind {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf" || mime === "application/pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "xlsx") return "xlsx";
  if (ext === "pptx") return "pptx";
  if (["txt", "md", "markdown", "csv"].includes(ext) || mime.startsWith("text/")) return "text";
  if (AI_IMAGE_MIMES.includes(mime)) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "other";
}

export interface RouteInput {
  type: ArtifactType;
  audioMode: AudioMode | null;
  fileKind: FileKind | null;
  fileSize: number;
  /** Pasted text, text extracted from a document, or an audio transcript. */
  text: string | null;
}

export type RouteResult = { aiReviewable: true } | { aiReviewable: false; reason: string };

const human = (reason: string): RouteResult => ({ aiReviewable: false, reason });

/**
 * Layer 1 (rule-based) routing from PRD R11, plus a floor for inputs the AI
 * can't read at all. Everything else goes to the AI.
 */
export function routeArtifact(input: RouteInput): RouteResult {
  if (input.type === "video") return human("Video is always reviewed by a person.");
  if (input.type === "game") return human("Games are always reviewed by a person.");
  if (input.type === "audio" && input.audioMode === "listen") {
    return human("Listen-mode audio (songs, podcasts, soundscapes) is always reviewed by a person.");
  }

  if (input.text?.trim()) return { aiReviewable: true };

  if (input.type === "audio" && input.audioMode === "transcribe") {
    return human("The transcript came back empty, so the AI has nothing to review.");
  }
  if (input.fileKind === "image") {
    return input.fileSize > MAX_AI_IMAGE_BYTES
      ? human("The image is larger than 10 MB, which is too large for AI review.")
      : { aiReviewable: true };
  }
  if (input.fileKind && TEXT_KINDS.includes(input.fileKind)) {
    return human("No readable text was found in this file (it may be scanned or image-only).");
  }
  if (!input.fileKind) {
    return human("There's no file or text the AI can read. The AI can't open links.");
  }
  return human("This file format can't be read by the AI.");
}
