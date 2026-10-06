import { formatTime } from "@/lib/format";
import type { Evaluation, RubricScore } from "@/lib/types";

export function EvaluationView({ evaluation }: { evaluation: Evaluation }) {
  const scores = JSON.parse(evaluation.rubric_scores_json) as RubricScore[];
  return (
    <section className="card space-y-5">
      <div>
        <h2 className="h2">Final evaluation</h2>
        <p className="meta mt-1">Submitted {formatTime(evaluation.submitted_at)}</p>
      </div>
      {scores.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Criterion</th>
                <th>Level</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => (
                <tr key={s.criterion}>
                  <td className="font-medium">{s.criterion}</td>
                  <td>{s.level}</td>
                  <td>{s.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div>
        <h3 className="eyebrow mb-1">Comments</h3>
        <p className="text-sm whitespace-pre-wrap">{evaluation.comments}</p>
      </div>
    </section>
  );
}
