import { requireUser } from "@/lib/auth";
import { listEvaluatorLearners } from "@/lib/data";
import { Icon, PageHead } from "@/components/ui";
import { CreateForLearnerForm } from "./CreateForLearnerForm";

// Playlab's embeddable view of the Flex Credit Guide. The embed can't hand its output back to
// this app, so the evaluator copies the finished plan into the form beside it.
const FLEX_CREDIT_GUIDE_EMBED_URL = "https://www.playlab.ai/embedded/cmux1wmrz0eeuph0wyg85bb94";

export default async function EvaluatorNewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ learner?: string }>;
}) {
  const user = await requireUser("evaluator");
  const learners = listEvaluatorLearners(user.id).map((l) => ({ id: l.id, name: l.name }));
  const learnerParam = (await searchParams).learner;

  return (
    <div className="flex flex-col gap-7">
      <PageHead
        crumbs={[{ label: "Learners", href: "/evaluator" }, { label: "New project" }]}
        title="New project"
        subtitle="Brainstorm a plan with the Flex Credit Guide, then set the project up for a learner."
      />
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <section className="card flex flex-col gap-3 p-0 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
            <h2 className="text-[15px] font-medium">Flex Credit Guide</h2>
            <a href={FLEX_CREDIT_GUIDE_EMBED_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm">
              Open in a new tab
              <Icon name="arrow-square-out" />
            </a>
          </div>
          <iframe
            src={FLEX_CREDIT_GUIDE_EMBED_URL}
            title="Flex Credit Guide"
            allow="clipboard-write; microphone"
            className="h-[760px] w-full rounded-b-surface border-0 border-t border-outline"
          />
        </section>
        <div className="flex flex-col gap-6 lg:col-span-5">
          <ol className="flex flex-col gap-4 text-sm">
            {[
              "Work through the plan with the Guide. It asks about the learner, the project and the standards it should meet.",
              "When the plan is finished, copy it, or download its Google Doc as a PDF or Word file.",
              "Choose the learner and create the project. The rubric is pulled from the plan, and the learner is notified.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="num-badge" aria-hidden="true">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <CreateForLearnerForm learners={learners} defaultLearnerId={learnerParam ? Number(learnerParam) : undefined} />
        </div>
      </div>
    </div>
  );
}
