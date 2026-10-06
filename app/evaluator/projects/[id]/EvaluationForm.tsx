"use client";

import { useActionState } from "react";
import { submitEvaluation } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import type { RubricCriterion } from "@/lib/types";

export function EvaluationForm({ projectId, criteria }: { projectId: number; criteria: RubricCriterion[] }) {
  const [state, action] = useActionState(submitEvaluation, undefined);
  return (
    <form action={action} className="card flex flex-col gap-5">
      <div>
        <h2 className="h2">Final evaluation</h2>
        <p className="mt-1 text-sm">
          Score each rubric criterion and leave final comments. The learner is notified when you submit.
        </p>
      </div>
      <input type="hidden" name="project_id" value={projectId} />
      {criteria.length === 0 && (
        <p className="text-sm">No structured rubric was extracted for this project. Add your comments below.</p>
      )}
      {criteria.map((c, i) => (
        <fieldset key={c.name} className="flex flex-col gap-3 rounded-surface border border-outline p-4">
          <legend className="px-1 text-[15px] font-medium">{c.name}</legend>
          <p className="text-sm">{c.description}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {(c.levels.length ? c.levels : ["Not met", "Met"]).map((level) => (
              <label key={level} className="flex items-center gap-2.5 text-sm">
                <input type="radio" name={`level_${i}`} value={level} required />
                {level}
              </label>
            ))}
          </div>
          <div>
            <label className="label" htmlFor={`comment_${i}`}>
              Comment, optional
            </label>
            <textarea id={`comment_${i}`} name={`comment_${i}`} className="input min-h-16" />
          </div>
        </fieldset>
      ))}
      <div>
        <label className="label" htmlFor="comments">
          Final comments
        </label>
        <textarea id="comments" name="comments" required className="input min-h-32" />
      </div>
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <div>
        <SubmitButton pendingText="Submitting">Submit evaluation</SubmitButton>
      </div>
    </form>
  );
}
