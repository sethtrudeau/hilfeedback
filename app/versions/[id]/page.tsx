import Link from "next/link";
import { notFound } from "next/navigation";
import { requestHumanReview } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { aiTurns, getProjectFor, getUser, getVersion, humanFeedback, listVersions, routingDecisions } from "@/lib/data";
import { formatTime } from "@/lib/format";
import { ArtifactView } from "@/components/ArtifactView";
import { FeedbackChat } from "@/components/FeedbackChat";
import { HumanFeedbackList } from "@/components/HumanFeedbackList";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert, BandCard, Icon, PageHead, ProjectStatusBadge, StatusBadge, Tag, TypeTag } from "@/components/ui";
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
    <div className="flex flex-col gap-7">
      <PageHead
        crumbs={[
          isLearner ? { label: "My projects", href: "/learner" } : { label: "Learners", href: "/evaluator" },
          { label: project.title, href: projectHref },
          { label: version.artifact_title },
        ]}
        badges={
          <>
            <TypeTag type={version.artifact_type} />
            {version.audio_mode && <Tag>{version.audio_mode === "listen" ? "Listen" : "Transcribe"}</Tag>}
            {pending.length > 0 ? (
              <StatusBadge tone="warning">Awaiting human review</StatusBadge>
            ) : (
              <ProjectStatusBadge status={project.status} />
            )}
          </>
        }
        title={version.artifact_title}
        subtitle={`v${version.version_number} of ${versions.length}, submitted ${formatTime(version.submitted_at)}.`}
        actions={
          isLearner &&
          project.status === "Active" && (
            <Link
              href={`/learner/projects/${project.id}/upload?artifact=${version.artifact_id}`}
              className="btn-secondary btn-sm"
            >
              <Icon name="plus" />
              Upload a new iteration
            </Link>
          )
        }
      />

      {versions.length > 1 && (
        <nav aria-label="Versions" className="flex flex-wrap items-center gap-2">
          {versions.map((v) => (
            <Link
              key={v.id}
              href={`/versions/${v.id}`}
              className="chip"
              aria-current={v.id === version.id ? "page" : undefined}
            >
              v{v.version_number}
            </Link>
          ))}
        </nav>
      )}

      {pending.length > 0 && (
        <Alert tone="warning" title="Waiting for human review">
          <ul className="mt-1 list-disc pl-5">
            {pending.map((d) => (
              <li key={d.id}>{d.reason}</li>
            ))}
          </ul>
          {isLearner && (
            <p className="mt-2">
              {evaluator.name} will review this. You can keep working in the meantime. You&apos;ll get a notification
              when they respond.
            </p>
          )}
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="card flex flex-col gap-4">
          <h2 className="h2">Artifact</h2>
          <ArtifactView version={version} />
        </section>

        <div className="flex flex-col gap-6">
          {human.length > 0 && (
            <BandCard title={`Feedback from ${isLearner ? "your evaluator" : "evaluators"}`} tint="bg-highlight-yellow">
              <HumanFeedbackList items={human} />
            </BandCard>
          )}

          <BandCard title="AI feedback" tint="bg-pale-sky">
            {version.ai_reviewable ? (
              <FeedbackChat
                versionId={version.id}
                initialTurns={turns}
                canChat={isLearner && project.status === "Active"}
                autoStart={isLearner}
              />
            ) : (
              <p className="text-sm">No AI feedback for this artifact. {ruleDecision?.reason ?? ""}</p>
            )}
          </BandCard>

          {!isLearner && (
            <section className="card flex flex-col gap-4">
              <h2 className="h2">Respond to the learner</h2>
              <RespondForm versionId={version.id} />
            </section>
          )}

          {canRequest && (
            <details className="accordion">
              <summary>{isLearner ? "Ask a person to review this" : "Add this to your pending queue"}</summary>
              <form action={requestHumanReview} className="accordion-body flex flex-col gap-3">
                <input type="hidden" name="version_id" value={version.id} />
                <label className="label" htmlFor="review-note">
                  {isLearner ? "What would you like a person to look at? Optional." : "Note to self, optional"}
                </label>
                <textarea id="review-note" name="note" className="input min-h-20" />
                <div>
                  <SubmitButton className="btn-secondary btn-sm" pendingText="Requesting">
                    Request human review
                  </SubmitButton>
                </div>
              </form>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
