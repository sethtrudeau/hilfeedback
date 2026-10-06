"use client";

import { useActionState, useState } from "react";
import { submitArtifact } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import { ARTIFACT_TYPE_LABELS, type ArtifactType, type AudioMode } from "@/lib/types";

interface ArtifactOption {
  id: number;
  title: string;
  type: ArtifactType;
  versions: number;
}

const ACCEPT: Record<ArtifactType, string> = {
  document: ".pdf,.docx,.txt,.md",
  presentation: ".pptx,.pdf",
  spreadsheet: ".xlsx,.csv",
  audio: "audio/*",
  image: "image/*,.pdf",
  video: "video/*",
  game: "",
  other: "",
};

const FILE_HINTS: Partial<Record<ArtifactType, string>> = {
  document: "PDF, Word (.docx) or a text file. In Google Docs, choose File, then Download, then Word or PDF.",
  presentation:
    "PowerPoint (.pptx) or PDF. In Google Slides, choose File, then Download, then PowerPoint. The AI reads slide text and speaker notes, not images or charts.",
  spreadsheet:
    "Excel (.xlsx) or CSV. In Google Sheets, choose File, then Download, then Excel. The AI reads cell values and formulas, not charts.",
};

export function UploadForm({
  projectId,
  artifacts,
  defaultArtifactId,
}: {
  projectId: number;
  artifacts: ArtifactOption[];
  defaultArtifactId?: number;
}) {
  const [state, action] = useActionState(submitArtifact, undefined);
  const [mode, setMode] = useState<"new" | "iteration">(defaultArtifactId ? "iteration" : "new");
  const [newType, setNewType] = useState<ArtifactType>("document");
  const [artifactId, setArtifactId] = useState(defaultArtifactId ?? artifacts[0]?.id);
  const [audioMode, setAudioMode] = useState<AudioMode | null>(null);

  const type = mode === "iteration" ? (artifacts.find((a) => a.id === artifactId)?.type ?? "other") : newType;
  const alwaysHuman = type === "video" || type === "game" || (type === "audio" && audioMode === "listen");

  return (
    <form action={action} className="card flex flex-col gap-5">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="mode" value={mode} />

      <fieldset className="flex flex-col gap-3">
        <legend className="label">Is this new, or a new version of something you already submitted?</legend>
        <label className="flex items-center gap-2.5 text-sm">
          <input type="radio" checked={mode === "new"} onChange={() => setMode("new")} />
          New artifact
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="radio"
            checked={mode === "iteration"}
            disabled={artifacts.length === 0}
            onChange={() => setMode("iteration")}
          />
          Iteration of an earlier artifact
        </label>
      </fieldset>

      {mode === "new" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="title">
              Title
            </label>
            <input id="title" name="title" required className="input" placeholder="Site plan" />
          </div>
          <div>
            <label className="label" htmlFor="type">
              Type
            </label>
            <select
              id="type"
              name="type"
              className="input"
              value={newType}
              onChange={(e) => setNewType(e.target.value as ArtifactType)}
            >
              {Object.entries(ARTIFACT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="artifact_id">
            Which artifact is this a new version of?
          </label>
          <select
            id="artifact_id"
            name="artifact_id"
            className="input"
            value={artifactId}
            onChange={(e) => setArtifactId(Number(e.target.value))}
          >
            {artifacts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}, {ARTIFACT_TYPE_LABELS[a.type].toLowerCase()}, {a.versions} version
                {a.versions === 1 ? "" : "s"} so far
              </option>
            ))}
          </select>
          <p className="hint">The AI reads the feedback on earlier versions and looks at what you changed.</p>
        </div>
      )}

      {type === "audio" && (
        <fieldset className="flex flex-col gap-3 rounded-surface border border-outline p-4">
          <legend className="label px-1">What kind of audio is this?</legend>
          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="radio"
              name="audio_mode"
              value="transcribe"
              required
              checked={audioMode === "transcribe"}
              onChange={() => setAudioMode("transcribe")}
              className="mt-0.5"
            />
            <span>
              <span className="block font-medium">Transcribe, because the words are what matter</span>
              <span className="block">
                An oral reflection, an interview, a spoken presentation. We turn it into text, and the AI gives
                feedback on what you said.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="radio"
              name="audio_mode"
              value="listen"
              checked={audioMode === "listen"}
              onChange={() => setAudioMode("listen")}
              className="mt-0.5"
            />
            <span>
              <span className="block font-medium">Listen, because the sound itself is the work</span>
              <span className="block">
                A song, a podcast, a soundscape. It goes straight to your evaluator to listen to. There&apos;s no
                transcript.
              </span>
            </span>
          </label>
        </fieldset>
      )}

      <div>
        <label className="label" htmlFor="file">
          File
        </label>
        <input id="file" name="file" type="file" accept={ACCEPT[type] || undefined} className="input" />
        {FILE_HINTS[type] && <p className="hint">{FILE_HINTS[type]}</p>}
      </div>

      {(type === "document" || type === "other") && (
        <div>
          <label className="label" htmlFor="text">
            Or paste your text
          </label>
          <textarea id="text" name="text" className="input min-h-32" />
        </div>
      )}

      {(type === "video" || type === "game" || type === "other") && (
        <div>
          <label className="label" htmlFor="link_url">
            Link, optional
          </label>
          <input id="link_url" name="link_url" type="url" className="input" placeholder="https://" />
          <p className="hint">A playable game, a video or a shared folder.</p>
        </div>
      )}

      <div>
        <label className="label" htmlFor="learner_note">
          Note about this {mode === "iteration" ? "version" : "artifact"}, optional
        </label>
        <textarea
          id="learner_note"
          name="learner_note"
          className="input min-h-20"
          placeholder={
            mode === "iteration" ? "What did you change since the last version?" : "What is this, and what should a reviewer look at?"
          }
        />
      </div>

      {alwaysHuman && (
        <Alert>This kind of work is reviewed by your evaluator, not the AI. You&apos;ll be notified when they respond.</Alert>
      )}

      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <div>
        <SubmitButton pendingText={type === "audio" && audioMode === "transcribe" ? "Uploading and transcribing" : "Uploading"}>
          Submit
        </SubmitButton>
      </div>
    </form>
  );
}
