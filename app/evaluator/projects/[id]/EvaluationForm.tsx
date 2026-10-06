"use client";

import { useActionState } from "react";
import { submitEvaluation } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { RubricCriterion } from "@/lib/types";

export function EvaluationForm({ projectId, criteria }: { projectId: number; criteria: RubricCriterion[] }) {
  const [state, action] = useActionState(submitEvaluation, undefined);
  return (
    <form action={action} className="card space-y-5 border-teal-300">
      <div>
        <h2 className="h2">Final evaluation</h2>
        <p className="text-sm text-stone-600">
          Score each rubric criterion and leave final comments. The learner is notified when you submit.
        </p>
      </div>
      <input type="hidden" name="project_id" value={projectId} />
      {criteria.length === 0 && (
        <p className="text-sm text-stone-500">No structured rubric was extracted for this project; add your comments below.</p>
      )}
      {criteria.map((c, i) => (
        <fieldset key={c.name} className="space-y-2 rounded-lg border border-stone-200 p-4">
          <legend className="px-1 text-sm font-medium">{c.name}</legend>
          <p className="text-xs text-stone-500">{c.description}</p>
          <div className="flex flex-wrap gap-3">
            {(c.levels.length ? c.levels : ["Not met", "Met"]).map((level) => (
              <label key={level} className="flex items-center gap-1.5 text-sm">
                <input type="radio" name={`level_${i}`} value={level} required /> {level}
              </label>
            ))}
          </div>
          <textarea name={`comment_${i}`} className="input min-h-16" placeholder="Comment (optional)" />
        </fieldset>
      ))}
      <div>
        <label className="label" htmlFor="comments">
          Final comments
        </label>
        <textarea id="comments" name="comments" required className="input min-h-32" />
      </div>
      {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
      <SubmitButton pendingText="Submitting…">Submit evaluation</SubmitButton>
    </form>
  );
}
