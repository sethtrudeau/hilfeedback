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
import { Alert, PageHead, ProjectStatusBadge, Tag } from "@/components/ui";
import { EvaluationForm } from "./EvaluationForm";
import { SummaryPanel } from "./SummaryPanel";

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
  const stats = [
    { label: "Artifacts", value: artifacts.length },
    { label: "Versions submitted", value: versionCount },
    { label: "Human feedback given", value: humanFeedbackCount(project.id) },
    { label: "Awaiting human review", value: pending.size },
  ];

  return (
    <div className="flex flex-col gap-7">
      <PageHead
        crumbs={[{ label: "Learners", href: "/evaluator" }, { label: project.title }]}
        badges={<ProjectStatusBadge status={project.status} />}
        title={project.title}
        subtitle={
          project.submitted_at
            ? `${learner.name}, final project submitted ${formatTime(project.submitted_at)}.`
            : `${learner.name}.`
        }
      />

      {project.status === "Submitted" && (
        <Alert title="Ready for evaluation">
          Review the report below, then complete the rubric at the bottom of the page.
        </Alert>
      )}
      {evaluation && <EvaluationView evaluation={evaluation} />}

      <section className="stats" aria-label="Project report">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <span className="eyebrow">{s.label}</span>
            <span className="stat-num">{s.value}</span>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="h2">Artifacts</h2>
        {artifacts.length === 0 ? (
          <p className="text-sm">No artifacts yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Artifact</th>
                  <th>Type</th>
                  <th className="num">Iterations</th>
                  <th>Versions</th>
                </tr>
              </thead>
              <tbody>
                {artifacts.map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium">{a.title}</td>
                    <td>
                      <Tag>{ARTIFACT_TYPE_LABELS[a.type]}</Tag>
                    </td>
                    <td className="num">{a.versions.length - 1}</td>
                    <td>
                      <div className="flex flex-wrap items-center gap-2">
                        {a.versions.map((v) => (
                          <Link key={v.id} href={`/versions/${v.id}`} title={formatTime(v.submitted_at)}>
                            v{v.version_number}
                            {pending.has(v.id) && <span className="sr-only">, awaiting human review</span>}
                          </Link>
                        ))}
                        {a.versions.some((v) => pending.has(v.id)) && (
                          <span className="badge badge-warning">Awaiting review</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
