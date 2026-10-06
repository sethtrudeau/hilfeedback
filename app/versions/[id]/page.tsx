import Link from "next/link";
import { notFound } from "next/navigation";
import { requestHumanReview } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { aiTurns, getProjectFor, getUser, getVersion, humanFeedback, listVersions, routingDecisions } from "@/lib/data";
import { formatTime } from "@/lib/format";
import { ARTIFACT_TYPE_LABELS } from "@/lib/types";
import { ArtifactView } from "@/components/ArtifactView";
import { FeedbackChat } from "@/components/FeedbackChat";
import { HumanFeedbackList } from "@/components/HumanFeedbackList";
import { SubmitButton } from "@/components/SubmitButton";
import { Badge, StatusBadge } from "@/components/ui";
import { RespondForm } from "./RespondForm";

export default async function VersionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const version = getVersion(Number((await params).id));
  const project = version && getProjectFor(user, version.project_id);
  if (!version || !project) notFound();

  const isLearner = user.role === "learner";
  const versions = listVersions(version.artifact_id);
  const decisions = routingDecisions(version.id);
  const pending = decisions.filter((d) => d.status === "pending");
  const ruleDecision = decisions.find((d) => d.layer === "rule");
  const human = humanFeedback(version.id);
  const turns = aiTurns(version.id);
  const evaluator = getUser(project.evaluator_id)!;
  const projectHref = isLearner ? `/learner/projects/${project.id}` : `/evaluator/projects/${project.id}`;
  const canRequest = project.status !== "Evaluated" && !pending.some((d) => d.layer === "manual");

  return (
    <div className="space-y-6">
      <div>
        <Link href={projectHref} className="link text-sm">
          ← {project.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="h1">{version.artifact_title}</h1>
          <Badge>{ARTIFACT_TYPE_LABELS[version.artifact_type]}</Badge>
          {version.audio_mode && <Badge>{version.audio_mode === "listen" ? "Listen" : "Transcribe"}</Badge>}
          <StatusBadge status={project.status} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-stone-500">Submitted {formatTime(version.submitted_at)} · Versions:</span>
          {versions.map((v) => (
            <Link
              key={v.id}
              href={`/versions/${v.id}`}
              className={`rounded px-2 py-0.5 ${v.id === version.id ? "bg-teal-700 text-white" : "bg-stone-100 hover:bg-stone-200"}`}
            >
              v{v.version_number}
            </Link>
          ))}
          {isLearner && project.status === "Active" && (
            <Link href={`/learner/projects/${project.id}/upload?artifact=${version.artifact_id}`} className="link ml-2">
              + Upload a new iteration
            </Link>
          )}
        </div>
      </div>

      {pending.length > 0 && (
        <div className="card border-amber-300 bg-amber-50 text-sm">
          <h2 className="font-medium text-amber-900">Waiting for human review</h2>
          <ul className="mt-1 list-disc pl-5 text-amber-900">
            {pending.map((d) => (
              <li key={d.id}>{d.reason}</li>
            ))}
          </ul>
          {isLearner && (
            <p className="mt-2 text-amber-900">
              {evaluator.name} will review this. You can keep working in the meantime, and you&apos;ll get a notification
              when they respond.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-3">
          <h2 className="h2">Artifact</h2>
          <ArtifactView version={version} />
        </section>

        <section className="space-y-6">
          {human.length > 0 && (
            <div className="card space-y-3">
              <h2 className="h2">Feedback from {isLearner ? "your evaluator" : "evaluators"}</h2>
              <HumanFeedbackList items={human} />
            </div>
          )}

          <div className="card space-y-3">
            <h2 className="h2">AI feedback</h2>
            {version.ai_reviewable ? (
              <FeedbackChat
                versionId={version.id}
                initialTurns={turns}
                canChat={isLearner && project.status === "Active"}
                autoStart={isLearner}
              />
            ) : (
              <p className="text-sm text-stone-600">
                No AI feedback for this artifact. {ruleDecision?.reason ?? ""}
              </p>
            )}
          </div>

          {!isLearner && (
            <div className={`card space-y-3 ${pending.length ? "border-amber-300" : ""}`}>
              <h2 className="h2">Respond to the learner</h2>
              <RespondForm versionId={version.id} />
            </div>
          )}

          {canRequest && (
            <details className="card">
              <summary className="cursor-pointer text-sm font-medium">
                {isLearner ? "Ask a person to review this" : "Add this to your pending queue"}
              </summary>
              <form action={requestHumanReview} className="mt-3 space-y-3">
                <input type="hidden" name="version_id" value={version.id} />
                <textarea
                  name="note"
                  className="input min-h-20"
                  placeholder={isLearner ? "What would you like a person to look at? (optional)" : "Note to self (optional)"}
                />
                <SubmitButton className="btn-secondary" pendingText="Requesting…">
                  Request human review
                </SubmitButton>
              </form>
            </details>
          )}
        </section>
      </div>
    </div>
  );
}
