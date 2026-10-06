import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { aiTurns, getEvaluation, getProjectFor, humanFeedback, listArtifacts, pendingVersionIds } from "@/lib/data";
import { formatTime } from "@/lib/format";
import { ARTIFACT_TYPE_LABELS } from "@/lib/types";
import { ArtifactView } from "@/components/ArtifactView";
import { BriefPanel } from "@/components/BriefPanel";
import { EvaluationView } from "@/components/EvaluationView";
import { HumanFeedbackList } from "@/components/HumanFeedbackList";
import { Badge, Md, StatusBadge } from "@/components/ui";

export default async function LearnerProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await requireUser("learner");
  const project = getProjectFor(user, Number((await params).id));
  if (!project) notFound();
  const history = (await searchParams).view === "history";
  const artifacts = listArtifacts(project.id);
  const pending = pendingVersionIds(project.id);
  const evaluation = getEvaluation(project.id);
  const active = project.status === "Active";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/learner" className="link text-sm">
            ← My projects
          </Link>
          <h1 className="h1 mt-1 flex items-center gap-3">
            {project.title} <StatusBadge status={project.status} />
          </h1>
        </div>
        {active && (
          <div className="flex gap-2">
            <Link href={`/learner/projects/${project.id}/upload`} className="btn-primary">
              Add artifact or iteration
            </Link>
            {artifacts.length > 0 && (
              <Link href={`/learner/projects/${project.id}/submit`} className="btn-secondary">
                Submit final project
              </Link>
            )}
          </div>
        )}
      </div>

      {evaluation && <EvaluationView evaluation={evaluation} />}
      {project.status === "Submitted" && (
        <p className="card border-sky-300 bg-sky-50 text-sm">
          You submitted this project on {formatTime(project.submitted_at!)}. It&apos;s locked while your evaluator
          reviews it, and you&apos;ll get a notification when your evaluation is ready.
        </p>
      )}

      <BriefPanel project={project} />

      <div className="flex gap-1 border-b border-stone-200 text-sm">
        {[
          ["Most recent", `/learner/projects/${project.id}`, !history],
          ["Project history", `/learner/projects/${project.id}?view=history`, history],
        ].map(([label, href, current]) => (
          <Link
            key={label as string}
            href={href as string}
            className={`-mb-px border-b-2 px-4 py-2 ${current ? "border-teal-700 font-medium text-teal-800" : "border-transparent text-stone-600"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {artifacts.length === 0 && <p className="text-sm text-stone-600">No artifacts yet.</p>}

      {!history &&
        artifacts.map((a) => {
          const latest = a.versions.at(-1)!;
          const firstAi = aiTurns(latest.id).find((t) => t.role === "assistant");
          const human = humanFeedback(latest.id);
          return (
            <div key={a.id} className="card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="h2">{a.title}</h2>
                  <Badge>{ARTIFACT_TYPE_LABELS[a.type]}</Badge>
                  {pending.has(latest.id) && <Badge tone="amber">Awaiting human review</Badge>}
                </div>
                <Link href={`/versions/${latest.id}`} className="link text-sm">
                  Open version {latest.version_number} →
                </Link>
              </div>
              <p className="text-xs text-stone-500">
                Version {latest.version_number} of {a.versions.length} · submitted {formatTime(latest.submitted_at)}
              </p>
              {human.length > 0 && <HumanFeedbackList items={human} />}
              {firstAi && (
                <details className="rounded-xl bg-teal-50 p-4">
                  <summary className="cursor-pointer text-sm font-medium text-teal-900">AI feedback</summary>
                  <div className="mt-2">
                    <Md>{firstAi.content}</Md>
                  </div>
                </details>
              )}
            </div>
          );
        })}

      {history &&
        artifacts.map((a) => (
          <div key={a.id} className="card space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="h2">{a.title}</h2>
              <Badge>{ARTIFACT_TYPE_LABELS[a.type]}</Badge>
              <span className="text-xs text-stone-500">
                {a.versions.length} version{a.versions.length === 1 ? "" : "s"}
              </span>
            </div>
            {[...a.versions].reverse().map((v) => {
              const turns = aiTurns(v.id);
              const human = humanFeedback(v.id);
              return (
                <details key={v.id} className="rounded-lg border border-stone-200 p-4">
                  <summary className="cursor-pointer text-sm">
                    <span className="font-medium">Version {v.version_number}</span>{" "}
                    <span className="text-stone-500">· {formatTime(v.submitted_at)}</span>{" "}
                    {pending.has(v.id) && <Badge tone="amber">Awaiting human review</Badge>}
                  </summary>
                  <div className="mt-4 space-y-4">
                    <ArtifactView version={v} />
                    {human.length > 0 && <HumanFeedbackList items={human} />}
                    {turns.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">AI feedback log</h3>
                        {turns.map((t, i) => (
                          <div key={i} className={`rounded-lg p-3 ${t.role === "assistant" ? "bg-teal-50" : "bg-stone-100"}`}>
                            <div className="mb-1 text-xs font-medium text-stone-600">
                              {t.role === "assistant" ? "AI coach" : "You"}
                            </div>
                            <Md>{t.content}</Md>
                          </div>
                        ))}
                      </div>
                    )}
                    <Link href={`/versions/${v.id}`} className="link text-sm">
                      Open this version →
                    </Link>
                  </div>
                </details>
              );
            })}
          </div>
        ))}
    </div>
  );
}
