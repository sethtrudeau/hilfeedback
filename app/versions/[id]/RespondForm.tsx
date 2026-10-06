"use client";

import { useActionState } from "react";
import { respondToVersion } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

export function RespondForm({ versionId }: { versionId: number }) {
  const [state, action] = useActionState(respondToVersion, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="version_id" value={versionId} />
      <div>
        <label className="label" htmlFor="respond-text">
          Written feedback
        </label>
        <textarea id="respond-text" name="text" className="input min-h-28" />
      </div>
      <div>
        <label className="label" htmlFor="audio">
          Or attach audio feedback
        </label>
        <input id="audio" name="audio" type="file" accept="audio/*" className="input" />
        <p className="hint">Audio is transcribed and the transcript is saved alongside it.</p>
      </div>
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {state && !state.error && <Alert tone="success">Sent. The learner has been notified.</Alert>}
      <div>
        <SubmitButton pendingText="Sending">Send feedback</SubmitButton>
      </div>
    </form>
  );
}
