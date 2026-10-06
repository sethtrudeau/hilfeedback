import { formatTime } from "@/lib/format";
import type { HumanFeedback } from "@/lib/data";

export function HumanFeedbackList({ items }: { items: HumanFeedback[] }) {
  return (
    <div className="space-y-3">
      {items.map((h) => (
        <div key={h.id} className="rounded-surface border border-outline bg-surface2 p-4 text-sm">
          <div className="eyebrow mb-1">
            {h.author_name}, {formatTime(h.created_at)}
          </div>
          {h.text && <p className="whitespace-pre-wrap">{h.text}</p>}
          {h.audio_file && <audio controls src={`/files/${h.audio_file}`} className="mt-2 w-full" />}
          {h.transcript && (
            <details className="accordion accordion-quiet mt-3">
              <summary>Audio transcript</summary>
              <p className="accordion-body whitespace-pre-wrap">{h.transcript}</p>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}
