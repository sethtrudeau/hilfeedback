import { formatTime } from "@/lib/format";
import type { HumanFeedback } from "@/lib/data";

export function HumanFeedbackList({ items }: { items: HumanFeedback[] }) {
  return (
    <div className="space-y-3">
      {items.map((h) => (
        <div key={h.id} className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm">
          <div className="mb-1 text-xs font-medium text-sky-900">
            {h.author_name} (evaluator) · {formatTime(h.created_at)}
          </div>
          {h.text && <p className="whitespace-pre-wrap">{h.text}</p>}
          {h.audio_file && <audio controls src={`/files/${h.audio_file}`} className="mt-2 w-full" />}
          {h.transcript && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-sky-900">Audio transcript</summary>
              <p className="mt-1 whitespace-pre-wrap text-stone-700">{h.transcript}</p>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}
