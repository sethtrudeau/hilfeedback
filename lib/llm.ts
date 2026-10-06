// Minimal client for OpenRouter's OpenAI-compatible Chat Completions API (MiniMax M3 by default).

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export class LlmError extends Error {}

export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) throw new LlmError("Model response did not contain JSON.");
  return JSON.parse(candidate.slice(start, end + 1));
}

export function apiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new LlmError("OPENROUTER_API_KEY is not set. Add it to .env.local and restart the server.");
  return key;
}

export const BASE_URL = "https://openrouter.ai/api/v1";

/** Builds an error from an OpenRouter response, which reports failures as { error: { message, code } }. */
export function apiError(label: string, status: number, data: unknown): LlmError {
  const err = (data as { error?: { message?: string } } | null)?.error;
  return new LlmError(`${label} failed (${status}): ${err?.message ?? JSON.stringify(data)?.slice(0, 500)}`);
}

export async function chat(messages: LlmMessage[], maxTokens = 4096): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? "minimax/minimax-m3",
      messages,
      max_tokens: maxTokens,
      // Reasoning counts toward max_tokens; keep it out of the response since we only show the answer.
      reasoning: { effort: "medium", exclude: true },
    }),
  });
  const data = await res.json().catch(() => null);
  // OpenRouter can also return an error object with HTTP 200.
  if (!res.ok || !data || data.error) throw apiError("AI request", res.status, data);
  const content: string | undefined = data.choices?.[0]?.message?.content;
  if (!content) throw new LlmError("The AI returned an empty response.");
  return stripThinking(content);
}
