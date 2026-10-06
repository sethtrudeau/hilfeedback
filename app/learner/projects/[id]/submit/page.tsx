import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { submitFinalProject } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getProjectFor, listArtifacts, pendingVersionIds } from "@/lib/data";
import { SubmitButton } from "@/components/SubmitButton";

export default async function SubmitProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("learner");
  const project = getProjectFor(user, Number((await params).id));
  if (!project) notFound();
  if (project.status !== "Active") redirect(`/learner/projects/${project.id}`);
  const artifacts = listArtifacts(project.id);
  const versions = artifacts.reduce((n, a) => n + a.versions.length, 0);
  const pending = pendingVersionIds(project.id).size;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="h1">Submit final project</h1>
      <div className="card space-y-4 text-sm">
        <p>
          You&apos;re about to submit <span className="font-medium">{project.title}</span> with {artifacts.length}{" "}
          artifact{artifacts.length === 1 ? "" : "s"} and {versions} version{versions === 1 ? "" : "s"} in total.
        </p>
        {pending > 0 && (
          <p className="rounded-lg bg-amber-50 p-3 text-amber-900">
            {pending} version{pending === 1 ? " is" : "s are"} still waiting for human feedback. You can submit anyway;
            your evaluator will see everything.
          </p>
        )}
        <p>
          After you submit, the project is locked. You can still view all your artifacts and feedback, but you
          can&apos;t add new artifacts or iterations. Your evaluator will be notified to complete the final evaluation.
        </p>
        <form action={submitFinalProject} className="flex gap-2">
          <input type="hidden" name="project_id" value={project.id} />
          <SubmitButton pendingText="Submitting…">Yes, submit my final project</SubmitButton>
          <Link href={`/learner/projects/${project.id}`} className="btn-secondary">
            Cancel
          </Link>
        </form>
      </div>
    </div>
  );
}
