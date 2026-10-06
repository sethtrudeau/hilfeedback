import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getProjectFor, listArtifacts } from "@/lib/data";
import { PageHead } from "@/components/ui";
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
    <div className="mx-auto flex max-w-(--w-form) flex-col gap-6">
      <PageHead
        crumbs={[
          { label: "My projects", href: "/learner" },
          { label: project.title, href: `/learner/projects/${project.id}` },
          { label: "Add an artifact" },
        ]}
        title="Add an artifact"
      />
      <UploadForm
        projectId={project.id}
        artifacts={artifacts}
        defaultArtifactId={artifactParam ? Number(artifactParam) : undefined}
      />
    </div>
  );
}
