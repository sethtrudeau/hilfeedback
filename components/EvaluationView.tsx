import { formatTime } from "@/lib/format";
import type { Evaluation, RubricScore } from "@/lib/types";

export function EvaluationView({ evaluation }: { evaluation: Evaluation }) {
  const scores = JSON.parse(evaluation.rubric_scores_json) as RubricScore[];
  return (
    <div className="card space-y-4 border-emerald-300">
      <div>
        <h2 className="h2">Final evaluation</h2>
        <p className="text-xs text-stone-500">Submitted {formatTime(evaluation.submitted_at)}</p>
      </div>
      {scores.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-stone-500">
            <tr>
              <th className="py-1 pr-4 font-medium">Criterion</th>
              <th className="py-1 pr-4 font-medium">Level</th>
              <th className="py-1 font-medium">Comment</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s) => (
              <tr key={s.criterion} className="border-t border-stone-100 align-top">
                <td className="py-2 pr-4 font-medium">{s.criterion}</td>
                <td className="py-2 pr-4">{s.level}</td>
                <td className="py-2 text-stone-700">{s.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div>
        <h3 className="text-sm font-medium">Comments</h3>
        <p className="mt-1 text-sm whitespace-pre-wrap">{evaluation.comments}</p>
      </div>
    </div>
  );
}
