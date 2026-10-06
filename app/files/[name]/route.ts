import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { currentUser } from "@/lib/auth";
import { getProjectFor } from "@/lib/data";
import { db } from "@/lib/db";
import { uploadPath } from "@/lib/files";

function projectIdForFile(name: string): number | undefined {
  const row = db()
    .prepare(
      `SELECT a.project_id AS id FROM artifact_versions v JOIN artifacts a ON a.id = v.artifact_id WHERE v.file_path = @name
       UNION SELECT a.project_id FROM feedback_logs f JOIN artifact_versions v ON v.id = f.artifact_version_id
         JOIN artifacts a ON a.id = v.artifact_id WHERE f.audio_file = @name
       UNION SELECT id FROM projects WHERE brief_file = @name`,
    )
    .get({ name }) as { id: number } | undefined;
  return row?.id;
}

function mimeFor(name: string): string {
  const row = db().prepare("SELECT mime_type FROM artifact_versions WHERE file_path = ?").get(name) as
    | { mime_type: string | null }
    | undefined;
  if (row?.mime_type) return row.mime_type;
  const ext = path.extname(name).toLowerCase();
  const byExt: Record<string, string> = {
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".webm": "audio/webm",
    ".pdf": "application/pdf",
  };
  return byExt[ext] ?? "application/octet-stream";
}

// Serves uploads to users who can access the owning project. Supports Range requests
// because Safari requires them for audio and video playback.
export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const name = path.basename((await params).name);
  const projectId = projectIdForFile(name);
  if (!projectId || !getProjectFor(user, projectId)) return new Response("Not found", { status: 404 });

  const abs = uploadPath(name);
  if (!fs.existsSync(abs)) return new Response("Not found", { status: 404 });
  const size = fs.statSync(abs).size;
  const headers: Record<string, string> = { "Content-Type": mimeFor(name), "Accept-Ranges": "bytes" };

  const range = request.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : size - Number(range[2]);
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const stream = Readable.toWeb(fs.createReadStream(abs, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const stream = Readable.toWeb(fs.createReadStream(abs)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "Content-Length": String(size) } });
}
