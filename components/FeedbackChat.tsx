"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Md } from "./ui";
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
      {turns.length === 0 && !loading && !error && <p className="text-sm">No AI feedback yet.</p>}
      {turns.map((t, i) =>
        t.role === "assistant" ? (
          <div key={i} className="panel">
            <div className="eyebrow mb-1">AI coach</div>
            <Md>{t.content}</Md>
          </div>
        ) : (
          <div
            key={i}
            className="ml-auto max-w-[85%] rounded-surface border border-outline bg-surface2 p-4 text-sm whitespace-pre-wrap"
          >
            <div className="eyebrow mb-1">Learner</div>
            {t.content}
          </div>
        ),
      )}
      {loading && (
        <p className="flex items-center gap-2 text-sm">
          <span className="spinner" aria-hidden="true" />
          {turns.length === 0 ? "Reading your work and writing feedback. This can take up to a minute." : "Thinking…"}
        </p>
      )}
      {error && (
        <Alert tone="error" title="The AI couldn't respond.">
          <p>{error}</p>
          <button
            className="btn-secondary btn-sm mt-3"
            onClick={() => send(turns.length ? input.trim() || undefined : undefined)}
          >
            Try again
          </button>
        </Alert>
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
            className="input min-h-24"
            aria-label="Message the AI coach"
            placeholder="Ask about the feedback, or talk through your next steps"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (input.trim() && !loading) send(input.trim());
              }
            }}
          />
          <div className="flex items-center justify-between gap-4">
            <span className="caption">Cmd or Ctrl and Enter sends.</span>
            <button className="btn-primary btn-sm" disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
