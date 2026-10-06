import type { ArtifactVersion } from "@/lib/types";

export function ArtifactView({ version: v }: { version: ArtifactVersion }) {
  const src = v.file_path ? `/files/${v.file_path}` : null;
  const mime = v.mime_type ?? "";

  return (
    <div className="space-y-4 text-sm">
      {src && mime.startsWith("image/") && (
        <img src={src} alt={v.file_name ?? "Artifact"} className="max-h-[480px] rounded-surface border border-outline" />
      )}
      {src && mime.startsWith("audio/") && <audio controls src={src} className="w-full" />}
      {src && mime.startsWith("video/") && (
        <video controls src={src} className="max-h-[480px] w-full rounded-surface border border-outline" />
      )}
      {src && (
        <a href={src} target="_blank" className="block">
          Open {v.file_name}
        </a>
      )}
      {v.link_url && (
        <div>
          <div className="eyebrow">Link</div>
          <a href={v.link_url} target="_blank" rel="noreferrer" className="break-all">
            {v.link_url}
          </a>
        </div>
      )}
      {v.learner_note && (
        <div className="panel">
          <div className="eyebrow mb-1">Learner&apos;s note</div>
          <p>{v.learner_note}</p>
        </div>
      )}
      {v.transcript && (
        <details open className="accordion">
          <summary>Transcript</summary>
          <p className="accordion-body whitespace-pre-wrap">{v.transcript}</p>
        </details>
      )}
      {v.text_content && (
        <details open={!v.file_path} className="accordion">
          <summary>Text content</summary>
          <p className="accordion-body max-h-96 overflow-y-auto whitespace-pre-wrap">{v.text_content}</p>
        </details>
      )}
    </div>
  );
}
