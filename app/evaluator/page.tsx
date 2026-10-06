import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listEvaluatorLearners } from "@/lib/data";
import { formatTime } from "@/lib/format";
import { Badge, StatusBadge } from "@/components/ui";

export default async function EvaluatorHome() {
  const user = await requireUser("evaluator");
  const learners = listEvaluatorLearners(user.id);

  return (
    <div className="space-y-6">
      <h1 className="h1">Learners</h1>
      {learners.map((l) => (
        <div key={l.id} className="card">
          <div className="flex items-baseline justify-between">
            <h2 className="h2">{l.name}</h2>
            <span className="text-xs text-stone-500">{l.email}</span>
          </div>
          {l.projects.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">No projects yet.</p>
          ) : (
            <table className="mt-3 w-full text-left text-sm">
              <thead className="text-xs text-stone-500">
                <tr>
                  <th className="py-1 font-medium">Project</th>
                  <th className="py-1 font-medium">Status</th>
                  <th className="py-1 font-medium">Artifacts</th>
                  <th className="py-1 font-medium">Started</th>
                </tr>
              </thead>
              <tbody>
                {l.projects.map((p) => (
                  <tr key={p.id} className="border-t border-stone-100">
                    <td className="py-2">
                      <Link href={`/evaluator/projects/${p.id}`} className="link font-medium">
                        {p.title}
                      </Link>{" "}
                      {p.pending_count > 0 && <Badge tone="amber">{p.pending_count} pending</Badge>}
                    </td>
                    <td className="py-2">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-2">{p.artifact_count}</td>
                    <td className="py-2 text-stone-500">{formatTime(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
