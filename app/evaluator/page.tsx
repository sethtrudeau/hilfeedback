import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listEvaluatorLearners } from "@/lib/data";
import { formatTime } from "@/lib/format";
import { Icon, PageHead, ProjectStatusBadge } from "@/components/ui";

export default async function EvaluatorHome() {
  const user = await requireUser("evaluator");
  const learners = listEvaluatorLearners(user.id);
  const projectCount = learners.reduce((n, l) => n + l.projects.length, 0);

  return (
    <div className="flex flex-col gap-7">
      <PageHead
        title="Learners"
        subtitle={`${learners.length} learner${learners.length === 1 ? "" : "s"}, ${projectCount} project${projectCount === 1 ? "" : "s"}.`}
        actions={
          <Link href="/evaluator/projects/new" className="btn-primary btn-sm">
            <Icon name="plus" />
            New project
          </Link>
        }
      />
      {learners.map((l) => (
        <section key={l.id} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="h2">{l.name}</h2>
              <p className="meta">{l.email}</p>
            </div>
            <Link href={`/evaluator/projects/new?learner=${l.id}`} className="btn-ghost btn-sm">
              <Icon name="plus" />
              New project for {l.name.split(" ")[0]}
            </Link>
          </div>
          {l.projects.length === 0 ? (
            <p className="text-sm">No projects yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Status</th>
                    <th className="num">Artifacts</th>
                    <th className="num">Awaiting review</th>
                    <th>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {l.projects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/evaluator/projects/${p.id}`}>{p.title}</Link>
                      </td>
                      <td>
                        <ProjectStatusBadge status={p.status} />
                      </td>
                      <td className="num">{p.artifact_count}</td>
                      <td className="num">{p.pending_count}</td>
                      <td className="meta">{formatTime(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
