import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getProjectFor, listArtifacts } from "@/lib/data";
import { UploadForm } from "./UploadForm";

export default async function UploadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ artifact?: string }>;
}) {
  const user = await requireUser("learner");
  const project = getProjectFor(user, Number((await params).id));
  if (!project) notFound();
  if (project.status !== "Active") redirect(`/learner/projects/${project.id}`);
  const artifacts = listArtifacts(project.id).map((a) => ({
    id: a.id,
    title: a.title,
    type: a.type,
    versions: a.versions.length,
  }));
  const artifactParam = (await searchParams).artifact;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/learner/projects/${project.id}`} className="link text-sm">
          ← {project.title}
        </Link>
        <h1 className="h1 mt-1">Add an artifact</h1>
      </div>
      <UploadForm
        projectId={project.id}
        artifacts={artifacts}
        defaultArtifactId={artifactParam ? Number(artifactParam) : undefined}
      />
    </div>
  );
}
