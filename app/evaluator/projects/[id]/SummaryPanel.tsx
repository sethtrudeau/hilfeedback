"use client";

import { useActionState } from "react";
import { generateSummary } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Md } from "@/components/ui";

export function SummaryPanel({
  projectId,
  summary,
  updatedAt,
  stale,
}: {
  projectId: number;
  summary: string | null;
  updatedAt: string | null;
  stale: boolean;
}) {
  const [state, action] = useActionState(generateSummary, undefined);
  return (
    <section className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="h2">AI summary of feedback</h2>
          {updatedAt && (
            <p className="text-xs text-stone-500">
              Generated {updatedAt}
              {stale && <span className="text-amber-700"> · new feedback since then</span>}
            </p>
          )}
        </div>
        <form action={action}>
          <input type="hidden" name="project_id" value={projectId} />
          <SubmitButton className="btn-secondary" pendingText="Summarizing… (up to a minute)">
            {summary ? "Regenerate" : "Generate summary"}
          </SubmitButton>
        </form>
      </div>
      {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
      {summary ? (
        <Md>{summary}</Md>
      ) : (
        <p className="text-sm text-stone-500">
          Summarizes every artifact, version, AI conversation and human response so you can see how the work developed.
        </p>
      )}
    </section>
  );
}
