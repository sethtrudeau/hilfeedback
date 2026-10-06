import Markdown from "react-markdown";
import type { ProjectStatus, Rubric } from "@/lib/types";

const TONES = {
  gray: "bg-stone-100 text-stone-700",
  teal: "bg-teal-100 text-teal-800",
  amber: "bg-amber-100 text-amber-900",
  blue: "bg-sky-100 text-sky-800",
  green: "bg-emerald-100 text-emerald-800",
} as const;

export function Badge({ tone = "gray", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const tone = status === "Active" ? "teal" : status === "Submitted" ? "blue" : "green";
  return <Badge tone={tone}>{status}</Badge>;
}

export function Md({ children }: { children: string }) {
  return (
    <div className="md text-sm leading-relaxed">
      <Markdown>{children}</Markdown>
    </div>
  );
}

export function RubricList({ rubric }: { rubric: Rubric }) {
  return (
    <div className="space-y-3 text-sm">
      <ul className="space-y-2">
        {rubric.criteria.map((c) => (
          <li key={c.name}>
            <span className="font-medium">{c.name}</span>: {c.description}
            {c.levels.length > 0 && <div className="text-xs text-stone-500">Levels: {c.levels.join(" → ")}</div>}
          </li>
        ))}
      </ul>
      {rubric.standards.length > 0 && (
        <p className="text-xs text-stone-500">Standards: {rubric.standards.join(", ")}</p>
      )}
    </div>
  );
}
