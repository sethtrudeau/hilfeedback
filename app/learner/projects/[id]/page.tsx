import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { aiTurns, getEvaluation, getProjectFor, humanFeedback, listArtifacts, pendingVersionIds } from "@/lib/data";
import { formatTime } from "@/lib/format";
import { ArtifactView } from "@/components/ArtifactView";
import { BriefPanel } from "@/components/BriefPanel";
import { EvaluationView } from "@/components/EvaluationView";
import { HumanFeedbackList } from "@/components/HumanFeedbackList";
import { Alert, Icon, Md, PageHead, ProjectStatusBadge, StatusBadge, TypeTag } from "@/components/ui";

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
  const base = `/learner/projects/${project.id}`;

  return (
    <div className="flex flex-col gap-7">
      <PageHead
        crumbs={[{ label: "My projects", href: "/learner" }, { label: project.title }]}
        badges={<ProjectStatusBadge status={project.status} />}
        title={project.title}
        subtitle={`${artifacts.length} artifact${artifacts.length === 1 ? "" : "s"}${pending.size ? `, ${pending.size} awaiting human review` : ""}.`}
        actions={
          active && (
            <>
              {artifacts.length > 0 && (
                <Link href={`${base}/submit`} className="btn-secondary btn-sm">
                  Submit final project
                </Link>
              )}
              <Link href={`${base}/upload`} className="btn-primary btn-sm">
                <Icon name="plus" />
                Add artifact or iteration
              </Link>
            </>
          )
        }
      />

      {evaluation && <EvaluationView evaluation={evaluation} />}
      {project.status === "Submitted" && (
        <Alert title={`Submitted ${formatTime(project.submitted_at!)}.`}>
          It&apos;s locked while your evaluator reviews it. You&apos;ll get a notification when your evaluation is
          ready.
        </Alert>
      )}

      <BriefPanel project={project} />

      <nav className="tabs" aria-label="Project views">
        <Link href={base} className="tab" aria-current={history ? undefined : "page"}>
          Most recent
        </Link>
        <Link href={`${base}?view=history`} className="tab" aria-current={history ? "page" : undefined}>
          Project history
        </Link>
      </nav>

      {artifacts.length === 0 && (
        <p className="text-sm">No artifacts yet. Add the first one when you have something to share.</p>
      )}

      {!history &&
        artifacts.map((a) => {
          const latest = a.versions.at(-1)!;
          const firstAi = aiTurns(latest.id).find((t) => t.role === "assistant");
          const human = humanFeedback(latest.id);
          return (
            <section key={a.id} className="card flex flex-col gap-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <TypeTag type={a.type} />
                    {pending.has(latest.id) && <StatusBadge tone="warning">Awaiting human review</StatusBadge>}
                  </div>
                  <h2 className="h2">{a.title}</h2>
                  <p className="meta mt-1">
                    v{latest.version_number} of {a.versions.length}, submitted {formatTime(latest.submitted_at)}
                  </p>
                </div>
                <Link href={`/versions/${latest.id}`} className="btn-secondary btn-sm">
                  Open v{latest.version_number}
                </Link>
              </div>
              {human.length > 0 && <HumanFeedbackList items={human} />}
              {firstAi && (
                <details className="accordion">
                  <summary>AI feedback</summary>
                  <div className="accordion-body">
                    <Md>{firstAi.content}</Md>
                  </div>
                </details>
              )}
            </section>
          );
        })}

      {history &&
        artifacts.map((a) => (
          <section key={a.id} className="card flex flex-col gap-4">
            <div>
              <div className="mb-2">
                <TypeTag type={a.type} />
              </div>
              <h2 className="h2">{a.title}</h2>
              <p className="meta mt-1">
                {a.versions.length} version{a.versions.length === 1 ? "" : "s"}
              </p>
            </div>
            {[...a.versions].reverse().map((v) => {
              const turns = aiTurns(v.id);
              const human = humanFeedback(v.id);
              return (
                <details key={v.id} className="accordion">
                  <summary>
                    <span className="flex flex-wrap items-center gap-3">
                      <span className="flex flex-col">
                        <span>Version {v.version_number}</span>
                        <span className="caption font-normal">{formatTime(v.submitted_at)}</span>
                      </span>
                      {pending.has(v.id) && <StatusBadge tone="warning">Awaiting human review</StatusBadge>}
                    </span>
                  </summary>
                  <div className="accordion-body flex flex-col gap-4">
                    <ArtifactView version={v} />
                    {human.length > 0 && <HumanFeedbackList items={human} />}
                    {turns.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <h3 className="eyebrow">AI feedback log</h3>
                        {turns.map((t, i) => (
                          <div
                            key={i}
                            className={
                              t.role === "assistant" ? "panel" : "rounded-surface border border-outline bg-surface2 p-4"
                            }
                          >
                            <div className="eyebrow mb-1">{t.role === "assistant" ? "AI coach" : "You"}</div>
                            <Md>{t.content}</Md>
                          </div>
                        ))}
                      </div>
                    )}
                    <Link href={`/versions/${v.id}`} className="text-sm">
                      Open this version
                    </Link>
                  </div>
                </details>
              );
            })}
          </section>
        ))}
    </div>
  );
}
