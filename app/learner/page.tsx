import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listLearnerProjects } from "@/lib/data";
import { formatTime } from "@/lib/format";
import { Badge, StatusBadge } from "@/components/ui";

export default async function LearnerHome() {
  const user = await requireUser("learner");
  const projects = listLearnerProjects(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">My projects</h1>
        <Link href="/learner/projects/new" className="btn-primary">
          New project
        </Link>
      </div>
      {projects.length === 0 && (
        <p className="card text-sm text-stone-600">
          No projects yet. Start one by attaching the plan from the Flex Credit Guide.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <Link key={p.id} href={`/learner/projects/${p.id}`} className="card block hover:border-teal-400">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold">{p.title}</h2>
              <StatusBadge status={p.status} />
            </div>
            <p className="mt-2 text-sm text-stone-600">
              {p.artifact_count} artifact{p.artifact_count === 1 ? "" : "s"} · started {formatTime(p.created_at)}
            </p>
            {p.pending_count > 0 && (
              <div className="mt-2">
                <Badge tone="amber">{p.pending_count} awaiting human review</Badge>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
