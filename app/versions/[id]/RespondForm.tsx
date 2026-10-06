"use client";

import { useActionState } from "react";
import { respondToVersion } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function RespondForm({ versionId }: { versionId: number }) {
  const [state, action] = useActionState(respondToVersion, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="version_id" value={versionId} />
      <textarea name="text" className="input min-h-28" placeholder="Write feedback for the learner…" />
      <div>
        <label className="label" htmlFor="audio">
          Or attach audio feedback
        </label>
        <input id="audio" name="audio" type="file" accept="audio/*" className="input" />
        <p className="hint">Audio is transcribed and the transcript is saved alongside it.</p>
      </div>
      {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
      {state && !state.error && <p className="text-sm text-emerald-700">Sent. The learner has been notified.</p>}
      <SubmitButton pendingText="Sending…">Send feedback</SubmitButton>
    </form>
  );
}
