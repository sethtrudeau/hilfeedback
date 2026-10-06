"use client";

import { useEffect, useRef, useState } from "react";
import { Md } from "./ui";
import type { ChatTurn } from "@/lib/types";

export function FeedbackChat({
  versionId,
  initialTurns,
  canChat,
  autoStart,
}: {
  versionId: number;
  initialTurns: ChatTurn[];
  canChat: boolean;
  /** Request the initial AI feedback on mount (learner viewing a fresh version). */
  autoStart: boolean;
}) {
  const [turns, setTurns] = useState(initialTurns);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function send(message?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/versions/${versionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message ? { message } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setTurns(data.turns);
      if (message) setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoStart && !started.current && initialTurns.length === 0) {
      started.current = true;
      send();
    }
  }, []);

  return (
    <div className="space-y-4">
      {turns.length === 0 && !loading && !error && (
        <p className="text-sm text-stone-500">No AI feedback yet.</p>
      )}
      {turns.map((t, i) =>
        t.role === "assistant" ? (
          <div key={i} className="rounded-xl bg-teal-50 p-4">
            <div className="mb-1 text-xs font-medium text-teal-800">AI coach</div>
            <Md>{t.content}</Md>
          </div>
        ) : (
          <div key={i} className="ml-auto max-w-[85%] rounded-xl bg-stone-100 p-4 text-sm whitespace-pre-wrap">
            <div className="mb-1 text-xs font-medium text-stone-600">Learner</div>
            {t.content}
          </div>
        ),
      )}
      {loading && (
        <p className="animate-pulse text-sm text-teal-800">
          {turns.length === 0 ? "Reading your work and writing feedback. This can take up to a minute…" : "Thinking…"}
        </p>
      )}
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
          {error}{" "}
          <button className="link font-medium" onClick={() => send(turns.length ? input.trim() || undefined : undefined)}>
            Try again
          </button>
        </div>
      )}
      {canChat && turns.length > 0 && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) send(input.trim());
          }}
        >
          <textarea
            className="input min-h-20"
            placeholder="Ask a question about the feedback, or talk through your next steps…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (input.trim() && !loading) send(input.trim());
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="hint">⌘/Ctrl + Enter to send</span>
            <button className="btn-primary" disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
