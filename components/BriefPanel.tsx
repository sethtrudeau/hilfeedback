import { retryRubric } from "@/app/actions";
import { parseRubric } from "@/lib/data";
import type { Project } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";
import { RubricList } from "./ui";

export function BriefPanel({ project }: { project: Project }) {
  const rubric = parseRubric(project);
  return (
    <details className="accordion">
      <summary>Flex Credit plan and rubric</summary>
      <div className="accordion-body grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="eyebrow mb-2">Rubric</h3>
          {rubric ? (
            <RubricList rubric={rubric} />
          ) : (
            <form action={retryRubric} className="space-y-3 text-sm">
              <p>The rubric couldn&apos;t be extracted from the plan yet. Feedback will use the plan text directly.</p>
              <input type="hidden" name="project_id" value={project.id} />
              <SubmitButton className="btn-secondary btn-sm" pendingText="Extracting…">
                Try extracting the rubric again
              </SubmitButton>
            </form>
          )}
        </div>
        <div>
          <h3 className="eyebrow mb-2">Plan</h3>
          <p className="max-h-80 overflow-y-auto text-sm whitespace-pre-wrap">{project.brief_text}</p>
          {project.brief_file && (
            <a href={`/files/${project.brief_file}`} target="_blank" className="mt-2 block text-sm">
              Open the original file
            </a>
          )}
        </div>
      </div>
    </details>
  );
}
