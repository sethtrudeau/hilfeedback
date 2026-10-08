"use client";

import { useActionState } from "react";
import { createProjectForLearner } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

export function CreateForLearnerForm({
  learners,
  defaultLearnerId,
}: {
  learners: { id: number; name: string }[];
  defaultLearnerId?: number;
}) {
  const [state, action] = useActionState(createProjectForLearner, undefined);
  return (
    <form action={action} className="card flex flex-col gap-5">
      <h2 className="h2">Create the project</h2>
      <div>
        <label className="label" htmlFor="learner_id">
          Learner
        </label>
        <select id="learner_id" name="learner_id" required className="input" defaultValue={defaultLearnerId ?? ""}>
          <option value="" disabled>
            Choose a learner
          </option>
          {learners.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="title">
          Project title
        </label>
        <input id="title" name="title" required className="input" placeholder="Community Skatepark Design" />
      </div>
      <div>
        <label className="label" htmlFor="brief_text">
          Paste the plan
        </label>
        <textarea id="brief_text" name="brief_text" className="input min-h-48" />
      </div>
      <div>
        <label className="label" htmlFor="brief_file">
          Or attach the plan as a file
        </label>
        <input id="brief_file" name="brief_file" type="file" accept=".pdf,.docx,.txt,.md" className="input" />
        <p className="hint">PDF, Word (.docx) or a text file.</p>
      </div>
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <div>
        <SubmitButton pendingText="Reading the plan and finding the rubric">Create project</SubmitButton>
      </div>
    </form>
  );
}
