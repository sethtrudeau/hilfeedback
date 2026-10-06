import type { ArtifactVersion } from "@/lib/types";

export function ArtifactView({ version: v }: { version: ArtifactVersion }) {
  const src = v.file_path ? `/files/${v.file_path}` : null;
  const mime = v.mime_type ?? "";

  return (
    <div className="space-y-4 text-sm">
      {src && mime.startsWith("image/") && (
        <img src={src} alt={v.file_name ?? "Artifact"} className="max-h-[480px] rounded-lg border border-stone-200" />
      )}
      {src && mime.startsWith("audio/") && <audio controls src={src} className="w-full" />}
      {src && mime.startsWith("video/") && <video controls src={src} className="max-h-[480px] w-full rounded-lg" />}
      {src && (
        <a href={src} target="_blank" className="link block">
          Open file: {v.file_name}
        </a>
      )}
      {v.link_url && (
        <p>
          Link:{" "}
          <a href={v.link_url} target="_blank" rel="noreferrer" className="link break-all">
            {v.link_url}
          </a>
        </p>
      )}
      {v.learner_note && (
        <p className="rounded-lg bg-stone-50 p-3">
          <span className="font-medium">Learner&apos;s note:</span> {v.learner_note}
        </p>
      )}
      {v.transcript && (
        <details open className="rounded-lg border border-stone-200 p-3">
          <summary className="cursor-pointer font-medium">Transcript</summary>
          <p className="mt-2 whitespace-pre-wrap text-stone-700">{v.transcript}</p>
        </details>
      )}
      {v.text_content && (
        <details open={!v.file_path} className="rounded-lg border border-stone-200 p-3">
          <summary className="cursor-pointer font-medium">Text content</summary>
          <p className="mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap text-stone-700">{v.text_content}</p>
        </details>
      )}
    </div>
  );
}
