import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  getEvaluation,
  getProjectFor,
  getUser,
  humanFeedbackCount,
  lastActivity,
  listArtifacts,
  parseRubric,
  pendingVersionIds,
} from "@/lib/data";
import { formatTime } from "@/lib/format";
import { ARTIFACT_TYPE_LABELS } from "@/lib/types";
import { BriefPanel } from "@/components/BriefPanel";
import { EvaluationView } from "@/components/EvaluationView";
import { Badge, StatusBadge } from "@/components/ui";
import { EvaluationForm } from "./EvaluationForm";
import { SummaryPanel } from "./SummaryPanel";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card py-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-stone-500">{label}</div>
    </div>
  );
}

export default async function EvaluatorProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("evaluator");
  const project = getProjectFor(user, Number((await params).id));
  if (!project) notFound();

  const learner = getUser(project.learner_id)!;
  const artifacts = listArtifacts(project.id);
  const pending = pendingVersionIds(project.id);
  const versionCount = artifacts.reduce((n, a) => n + a.versions.length, 0);
  const evaluation = getEvaluation(project.id);
  const activity = lastActivity(project.id);
  const stale = Boolean(project.summary_updated_at && activity && activity > project.summary_updated_at);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/evaluator" className="link text-sm">
          ← Learners
        </Link>
        <h1 className="h1 mt-1 flex items-center gap-3">
          {project.title} <StatusBadge status={project.status} />
        </h1>
        <p className="text-sm text-stone-600">
          {learner.name}
          {project.submitted_at && ` · final project submitted ${formatTime(project.submitted_at)}`}
        </p>
      </div>

      {project.status === "Submitted" && (
        <p className="card border-sky-300 bg-sky-50 text-sm">
          This final project is ready for evaluation. Review the report below, then complete the rubric at the bottom
          of the page.
        </p>
      )}
      {evaluation && <EvaluationView evaluation={evaluation} />}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Artifacts" value={artifacts.length} />
        <Stat label="Versions submitted" value={versionCount} />
        <Stat label="Human feedback given" value={humanFeedbackCount(project.id)} />
        <Stat label="Awaiting human review" value={pending.size} />
      </div>

      <section className="card">
        <h2 className="h2">Artifacts</h2>
        {artifacts.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">No artifacts yet.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-xs text-stone-500">
              <tr>
                <th className="py-1 font-medium">Artifact</th>
                <th className="py-1 font-medium">Type</th>
                <th className="py-1 font-medium">Iterations</th>
                <th className="py-1 font-medium">Versions</th>
              </tr>
            </thead>
            <tbody>
              {artifacts.map((a) => (
                <tr key={a.id} className="border-t border-stone-100 align-top">
                  <td className="py-2 font-medium">{a.title}</td>
                  <td className="py-2">
                    <Badge>{ARTIFACT_TYPE_LABELS[a.type]}</Badge>
                  </td>
                  <td className="py-2">{a.versions.length - 1}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      {a.versions.map((v) => (
                        <Link
                          key={v.id}
                          href={`/versions/${v.id}`}
                          className={`rounded px-2 py-0.5 ${pending.has(v.id) ? "bg-amber-100 text-amber-900" : "bg-stone-100 hover:bg-stone-200"}`}
                          title={pending.has(v.id) ? "Awaiting human review" : formatTime(v.submitted_at)}
                        >
                          v{v.version_number}
                        </Link>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <SummaryPanel
        projectId={project.id}
        summary={project.feedback_summary}
        updatedAt={project.summary_updated_at ? formatTime(project.summary_updated_at) : null}
        stale={stale}
      />

      <BriefPanel project={project} />

      {project.status === "Submitted" && (
        <EvaluationForm projectId={project.id} criteria={parseRubric(project)?.criteria ?? []} />
      )}
    </div>
  );
}
