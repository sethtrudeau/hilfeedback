import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listLearnerProjects } from "@/lib/data";
import { formatTime } from "@/lib/format";
import { Icon, PageHead, ProjectStatusBadge, StatusBadge } from "@/components/ui";

export default async function LearnerHome() {
  const user = await requireUser("learner");
  const projects = listLearnerProjects(user.id);
  const awaiting = projects.reduce((n, p) => n + p.pending_count, 0);

  return (
    <div className="flex flex-col gap-7">
      <PageHead
        title="My projects"
        subtitle={
          projects.length
            ? `${projects.length} project${projects.length === 1 ? "" : "s"}${awaiting ? `, ${awaiting} artifact${awaiting === 1 ? "" : "s"} awaiting human review` : ""}.`
            : undefined
        }
        actions={
          <Link href="/learner/projects/new" className="btn-primary btn-sm">
            <Icon name="plus" />
            New project
          </Link>
        }
      />
      {projects.length === 0 ? (
        <div className="mx-auto flex max-w-(--w-prose) flex-col items-center gap-4 py-16 text-center">
          <h2 className="h2">No projects yet.</h2>
          <p>Start one with the plan you made in the Flex Credit Guide.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/learner/projects/${p.id}`} className="card flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <ProjectStatusBadge status={p.status} />
                {p.pending_count > 0 && <StatusBadge tone="warning">{p.pending_count} awaiting human review</StatusBadge>}
              </div>
              <h2 className="text-base font-medium">{p.title}</h2>
              <p className="meta">
                {p.artifact_count} artifact{p.artifact_count === 1 ? "" : "s"}, started {formatTime(p.created_at)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
