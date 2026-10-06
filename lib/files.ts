import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { UPLOAD_DIR } from "./db";
import type { FileKind } from "./routing";

export interface SavedFile {
  /** Stored file name inside UPLOAD_DIR; served at /files/<storedName>. */
  storedName: string;
  originalName: string;
  mime: string;
  size: number;
}

export function uploadPath(storedName: string): string {
  return path.join(UPLOAD_DIR, path.basename(storedName));
}

export function isFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function saveUpload(file: File): Promise<SavedFile> {
  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const storedName = `${randomUUID()}${ext}`;
  await fs.writeFile(uploadPath(storedName), Buffer.from(await file.arrayBuffer()));
  return { storedName, originalName: file.name, mime: file.type || "application/octet-stream", size: file.size };
}

/** Returns extracted text for document kinds, or null for kinds that have no text layer. */
export async function extractText(storedName: string, kind: FileKind): Promise<string | null> {
  const abs = uploadPath(storedName);
  if (kind === "text") return fs.readFile(abs, "utf8");
  if (kind === "docx") {
    const mammoth = await import("mammoth");
    return (await mammoth.extractRawText({ path: abs })).value;
  }
  if (kind === "xlsx" || kind === "pptx") {
    const { xlsxToText, pptxToText } = await import("./office");
    const data = await fs.readFile(abs);
    return kind === "xlsx" ? xlsxToText(data) : pptxToText(data);
  }
  if (kind === "pdf") {
    const { extractText: pdfText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(await fs.readFile(abs)));
    return (await pdfText(pdf, { mergePages: true })).text;
  }
  return null;
}

export async function toDataUrl(storedName: string, mime: string): Promise<string> {
  const data = await fs.readFile(uploadPath(storedName));
  return `data:${mime};base64,${data.toString("base64")}`;
}
