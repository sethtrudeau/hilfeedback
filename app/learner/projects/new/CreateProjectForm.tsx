"use client";

import { useActionState } from "react";
import { createProject } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function CreateProjectForm() {
  const [state, action] = useActionState(createProject, undefined);
  return (
    <form action={action} className="card space-y-5">
      <div>
        <label className="label" htmlFor="title">
          Project title
        </label>
        <input id="title" name="title" required className="input" placeholder="e.g. Community Skatepark Design" />
      </div>
      <div>
        <label className="label" htmlFor="brief_file">
          Flex Credit plan
        </label>
        <input id="brief_file" name="brief_file" type="file" accept=".pdf,.docx,.txt,.md" className="input" />
        <p className="hint">
          Download your plan from Google Docs as a PDF or Word file, or paste its text below. Your feedback is
          grounded in this plan and its rubric.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="brief_text">
          Or paste the plan
        </label>
        <textarea id="brief_text" name="brief_text" className="input min-h-40" />
      </div>
      {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
      <SubmitButton pendingText="Reading your plan and finding the rubric…">Create project</SubmitButton>
    </form>
  );
}
