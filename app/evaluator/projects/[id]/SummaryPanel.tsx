"use client";

import { useActionState } from "react";
import { generateSummary } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert, Md } from "@/components/ui";

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
    <section className="card flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="h2">AI summary of feedback</h2>
          {updatedAt && (
            <p className="meta mt-1">
              Generated {updatedAt}.{stale && " There’s new feedback since then."}
            </p>
          )}
        </div>
        <form action={action}>
          <input type="hidden" name="project_id" value={projectId} />
          <SubmitButton className="btn-secondary btn-sm" pendingText="Summarizing, up to a minute">
            {summary ? "Regenerate" : "Generate summary"}
          </SubmitButton>
        </form>
      </div>
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {summary ? (
        <Md>{summary}</Md>
      ) : (
        <p className="text-sm">
          Summarizes every artifact, version, AI conversation and human response so you can see how the work developed.
        </p>
      )}
    </section>
  );
}
