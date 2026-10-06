import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { pendingQueue, submittedProjects, type PendingItem } from "@/lib/data";
import { formatTime } from "@/lib/format";
import { ARTIFACT_TYPE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui";

function Item({ item }: { item: PendingItem }) {
  return (
    <li className="space-y-2 border-t border-stone-100 py-3 first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{item.learner_name}</span>
          <span className="text-stone-400">·</span>
          <span>{item.project_title}</span>
          <span className="text-stone-400">·</span>
          <span>
            {item.artifact_title} v{item.version_number}
          </span>
          <Badge>{ARTIFACT_TYPE_LABELS[item.artifact_type]}</Badge>
          {item.audio_mode === "listen" && <Badge>Listen</Badge>}
        </div>
        <Link href={`/versions/${item.artifact_version_id}`} className="btn-secondary">
          Review
        </Link>
      </div>
      <p className="text-sm text-stone-600">
        {item.reason} <span className="text-xs text-stone-400">({formatTime(item.created_at)})</span>
      </p>
      {item.audio_mode === "listen" && item.file_path && (
        <audio controls src={`/files/${item.file_path}`} className="w-full" />
      )}
    </li>
  );
}

export default async function PendingPage() {
  const user = await requireUser("evaluator");
  const queue = pendingQueue(user.id);
  const finals = submittedProjects(user.id);
  const groups: [string, string, PendingItem[]][] = [
    ["Always human", "Video, games and Listen-mode audio, plus anything the AI can't read.", queue.filter((q) => q.layer === "rule")],
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
    <div className="space-y-6">
      <h1 className="h1">Pending</h1>

      <section className="card">
        <h2 className="h2">Final projects to evaluate ({finals.length})</h2>
        {finals.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Nothing waiting.</p>
        ) : (
          <ul className="mt-2">
            {finals.map((p) => (
              <li key={p.id} className="flex items-center justify-between border-t border-stone-100 py-3 first:border-t-0">
                <span className="text-sm">
                  <span className="font-medium">{p.learner_name}</span> · {p.title}{" "}
                  <span className="text-xs text-stone-400">(submitted {formatTime(p.submitted_at!)})</span>
                </span>
                <Link href={`/evaluator/projects/${p.id}`} className="btn-primary">
                  Evaluate
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {groups.map(([title, description, items]) => (
        <section key={title} className="card">
          <h2 className="h2">
            {title} ({items.length})
          </h2>
          <p className="text-xs text-stone-500">{description}</p>
          {items.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">Nothing waiting.</p>
          ) : (
            <ul className="mt-2">
              {items.map((item) => (
                <Item key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
