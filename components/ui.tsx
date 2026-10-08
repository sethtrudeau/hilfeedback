import Link from "next/link";
import Markdown from "react-markdown";
import { ARTIFACT_TYPE_LABELS, type ArtifactType, type ProjectStatus, type Rubric } from "@/lib/types";

/** Phosphor icon (regular weight), loaded from the CDN in app/layout.tsx. Decorative by default. */
export function Icon({ name, size = 16, className = "" }: { name: string; size?: number; className?: string }) {
  return <i className={`ph ph-${name} ${className}`} style={{ fontSize: size }} aria-hidden="true" />;
}

/** Static category label. An optional tint fills it with one of the palette hues. */
export function Tag({ tint = "", children }: { tint?: string; children: React.ReactNode }) {
  return <span className={`tag ${tint}`}>{children}</span>;
}

// One pale hue per artifact type, so types read at a glance. Full class names so Tailwind keeps them.
const TYPE_TINTS: Record<ArtifactType, string> = {
  document: "bg-pale-sky",
  presentation: "bg-palest-pink",
  spreadsheet: "bg-olive",
  audio: "bg-pale-cyan",
  image: "bg-tan",
  video: "bg-pale-pink",
  game: "bg-chartreuse",
  other: "",
};

export function TypeTag({ type }: { type: ArtifactType }) {
  return <Tag tint={TYPE_TINTS[type]}>{ARTIFACT_TYPE_LABELS[type]}</Tag>;
}

/** Card whose pale header band names it. `tint` is a bg-* class from the palette. */
export function BandCard({
  title,
  tint,
  aside,
  children,
}: {
  title: string;
  tint: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="band-card">
      <h2 className={`band ${tint}`}>
        <span>{title}</span>
        {aside}
      </h2>
      <div className="band-body">{children}</div>
    </section>
  );
}

// The palette's palest hues, light enough that fragment text in --text2 stays readable on them.
const CARD_TINTS = ["bg-pale-sky", "bg-palest-pink", "bg-highlight-yellow", "bg-pale-cyan", "bg-pale-pink"];

/** A card fill picked from `seed`, so each item keeps a stable colour. */
export function cardTint(seed: number) {
  return `card-tinted ${CARD_TINTS[seed % CARD_TINTS.length]}`;
}

type Tone = "neutral" | "info" | "success" | "warning" | "error";

/** Row and card status: tinted, sentence case. */
export function StatusBadge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

const PROJECT_TONES: Record<ProjectStatus, Tone> = { Active: "neutral", Submitted: "info", Evaluated: "success" };

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <StatusBadge tone={PROJECT_TONES[status]}>{status}</StatusBadge>;
}

const ALERT_ICONS = { info: "info", success: "check-circle", warning: "warning", error: "warning-circle" } as const;

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: keyof typeof ALERT_ICONS;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div role="note" className={`alert alert-${tone}`}>
      <Icon name={ALERT_ICONS[tone]} className="alert-icon" size={18} />
      <div>
        {title && <div className="font-medium">{title}</div>}
        {children}
      </div>
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span className="text-ink">{item.label}</span>}
          {i < items.length - 1 && <span aria-hidden="true">/</span>}
        </span>
      ))}
    </nav>
  );
}

/** Page head: breadcrumb, then badges stacked above the title, subtitle below, actions to the right. */
export function PageHead({
  crumbs,
  badges,
  title,
  subtitle,
  actions,
}: {
  crumbs?: { label: string; href?: string }[];
  badges?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {crumbs && <Breadcrumb items={crumbs} />}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          {badges && <div className="mb-2.5 flex flex-wrap gap-2">{badges}</div>}
          <h1 className="h1">{title}</h1>
          {subtitle && <div className="mt-1.5 text-sm">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
      </div>
    </div>
  );
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
      <ul className="space-y-3">
        {rubric.criteria.map((c) => (
          <li key={c.name}>
            <div className="font-medium">{c.name}</div>
            <div>{c.description}</div>
            {c.levels.length > 0 && <div className="caption mt-0.5">Levels: {c.levels.join(", ")}</div>}
          </li>
        ))}
      </ul>
      {rubric.standards.length > 0 && <p className="caption">Standards: {rubric.standards.join(", ")}</p>}
    </div>
  );
}
