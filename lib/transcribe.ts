import fs from "node:fs/promises";
import path from "node:path";
import { apiError, apiKey, BASE_URL } from "./llm";

// OpenRouter's OpenAI-compatible transcription endpoint: max 25 MB, and upstream
// providers time out after 60 seconds, so very long recordings can fail.
export async function transcribe(absPath: string, mime: string): Promise<string> {
  const form = new FormData();
  form.append("model", "openai/whisper-1");
  form.append("response_format", "json");
  form.append("file", new Blob([await fs.readFile(absPath)], { type: mime }), path.basename(absPath));

  const res = await fetch(`${BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.error) throw apiError("Transcription", res.status, data);
  return String(data.text ?? "").trim();
}
