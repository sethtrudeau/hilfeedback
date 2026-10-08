import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { pendingQueue, submittedProjects, type PendingItem } from "@/lib/data";
import { formatTime } from "@/lib/format";
import { BandCard, PageHead, Tag, TypeTag } from "@/components/ui";

function Item({ item }: { item: PendingItem }) {
  return (
    <li className="row flex-col items-stretch gap-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <TypeTag type={item.artifact_type} />
            {item.audio_mode === "listen" && <Tag>Listen</Tag>}
          </div>
          <div className="text-base font-medium">
            {item.artifact_title}, v{item.version_number}
          </div>
          <div className="meta">
            {item.learner_name}, {item.project_title}
          </div>
        </div>
        <Link href={`/versions/${item.artifact_version_id}`} className="btn-secondary btn-sm">
          Review
        </Link>
      </div>
      <div>
        <p className="text-sm">{item.reason}</p>
        <p className="caption">{formatTime(item.created_at)}</p>
      </div>
      {item.audio_mode === "listen" && item.file_path && (
        <audio controls src={`/files/${item.file_path}`} className="w-full" />
      )}
    </li>
  );
}

function Section({
  title,
  description,
  count,
  tint = "bg-mist",
  children,
}: {
  title: string;
  description: string;
  count: number;
  tint?: string;
  children: React.ReactNode;
}) {
  return (
    <BandCard title={title} tint={tint} aside={<span className="count">{count}</span>}>
      <p className="text-sm">{description}</p>
      {count === 0 ? <p className="meta mt-3">Nothing waiting.</p> : <ul className="mt-2">{children}</ul>}
    </BandCard>
  );
}

export default async function PendingPage() {
  const user = await requireUser("evaluator");
  const queue = pendingQueue(user.id);
  const finals = submittedProjects(user.id);
  const groups: [string, string, PendingItem[]][] = [
    [
      "Always human",
      "Video, games and Listen-mode audio, plus anything the AI can’t read.",
      queue.filter((q) => q.layer === "rule"),
    ],
    [
      "Requested by learner",
      "The learner asked for a person to look at this.",
      queue.filter((q) => q.layer === "manual" && q.requested_by_role === "learner"),
    ],
    [
      "Flagged by you",
      "Artifacts you added to your own queue.",
      queue.filter((q) => q.layer === "manual" && q.requested_by_role === "evaluator"),
    ],
  ];

  return (
    <div className="flex flex-col gap-7">
      <PageHead
        title="Pending"
        subtitle={`${queue.length} artifact${queue.length === 1 ? "" : "s"} waiting for feedback, ${finals.length} final project${finals.length === 1 ? "" : "s"} to evaluate.`}
      />

      <Section
        title="Final projects to evaluate"
        description="Submitted projects are locked and ready for the rubric."
        count={finals.length}
        tint="bg-highlight-yellow"
      >
        {finals.map((p) => (
          <li key={p.id} className="row justify-between">
            <div className="min-w-0">
              <div className="text-base font-medium">{p.title}</div>
              <div className="meta">
                {p.learner_name}, submitted {formatTime(p.submitted_at!)}
              </div>
            </div>
            <Link href={`/evaluator/projects/${p.id}`} className="btn-primary btn-sm">
              Evaluate
            </Link>
          </li>
        ))}
      </Section>

      {groups.map(([title, description, items]) => (
        <Section key={title} title={title} description={description} count={items.length}>
          {items.map((item) => (
            <Item key={item.id} item={item} />
          ))}
        </Section>
      ))}
    </div>
  );
}
