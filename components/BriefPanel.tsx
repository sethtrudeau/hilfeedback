import { retryRubric } from "@/app/actions";
import { parseRubric } from "@/lib/data";
import type { Project } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";
import { RubricList } from "./ui";

export function BriefPanel({ project }: { project: Project }) {
  const rubric = parseRubric(project);
  return (
    <details className="card">
      <summary className="cursor-pointer font-medium">Flex Credit plan & rubric</summary>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-medium">Rubric</h3>
          {rubric ? (
            <RubricList rubric={rubric} />
          ) : (
            <form action={retryRubric} className="space-y-2 text-sm">
              <p className="text-stone-600">
                The rubric couldn&apos;t be extracted from the plan yet. Feedback will use the plan text directly.
              </p>
              <input type="hidden" name="project_id" value={project.id} />
              <SubmitButton className="btn-secondary" pendingText="Extracting…">
                Try extracting the rubric again
              </SubmitButton>
            </form>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium">Plan</h3>
          <p className="max-h-80 overflow-y-auto text-sm whitespace-pre-wrap text-stone-700">{project.brief_text}</p>
          {project.brief_file && (
            <a href={`/files/${project.brief_file}`} target="_blank" className="link mt-2 block text-sm">
              Open original file
            </a>
          )}
        </div>
      </div>
    </details>
  );
}
