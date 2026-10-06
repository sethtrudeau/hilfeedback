import path from "node:path";
import ExcelJS from "exceljs";
import JSZip from "jszip";

// Keeps a huge workbook from crowding out the brief and rubric in the prompt.
const MAX_CHARS = 100_000;

/** One line per row, e.g. "A2: Concrete | B2: 3000 | C2: 21000 (=B2*7)", grouped by sheet. */
export async function xlsxToText(data: Buffer): Promise<string> {
  const wb = new ExcelJS.Workbook();
  // exceljs's typings predate Node's generic Buffer type; a Buffer is what it expects at runtime.
  await wb.xlsx.load(data as unknown as ArrayBuffer);
  const lines: string[] = [];
  for (const ws of wb.worksheets) {
    lines.push(`## Sheet: ${ws.name}`);
    ws.eachRow((row) => {
      const cells: string[] = [];
      row.eachCell((cell) => {
        cells.push(`${cell.address}: ${cell.text}${cell.formula ? ` (=${cell.formula})` : ""}`);
      });
      lines.push(cells.join(" | "));
    });
  }
  const text = lines.join("\n");
  return text.length > MAX_CHARS
    ? `${text.slice(0, MAX_CHARS)}\n\n[Spreadsheet truncated: only the first ${MAX_CHARS.toLocaleString()} characters are shown.]`
    : text;
}

function decodeXml(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Text of each <a:p> paragraph in a DrawingML part, skipping fields like slide numbers. */
function paragraphs(xml: string): string[] {
  return [...xml.replace(/<a:fld[\s\S]*?<\/a:fld>/g, "").matchAll(/<a:p[ >][\s\S]*?<\/a:p>/g)]
    .map((p) => [...p[0].matchAll(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g)].map((t) => decodeXml(t[1])).join(""))
    .filter((t) => t.trim());
}

/** Maps relationship ids to zip paths for a part's .rels file. */
async function relationships(zip: JSZip, partPath: string): Promise<{ id: string; type: string; target: string }[]> {
  const relsPath = path.posix.join(path.posix.dirname(partPath), "_rels", `${path.posix.basename(partPath)}.rels`);
  const xml = await zip.file(relsPath)?.async("string");
  if (!xml) return [];
  return [...xml.matchAll(/<Relationship\s[^>]*>/g)].map((m) => {
    const attr = (name: string) => m[0].match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? "";
    return {
      id: attr("Id"),
      type: attr("Type"),
      target: path.posix.normalize(path.posix.join(path.posix.dirname(partPath), attr("Target"))),
    };
  });
}

/** Slide paths in presentation order; falls back to file-number order if presentation.xml is missing. */
async function slideOrder(zip: JSZip): Promise<string[]> {
  const presentation = await zip.file("ppt/presentation.xml")?.async("string");
  if (presentation) {
    const rels = await relationships(zip, "ppt/presentation.xml");
    const ordered = [...presentation.matchAll(/<p:sldId\s[^>]*r:id="([^"]+)"/g)]
      .map((m) => rels.find((r) => r.id === m[1])?.target)
      .filter((t): t is string => Boolean(t && zip.file(t)));
    if (ordered.length) return ordered;
  }
  const num = (p: string) => Number(p.match(/slide(\d+)\.xml$/)?.[1]);
  return Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => num(a) - num(b));
}

/** Slide-by-slide text with speaker notes. Images, charts and diagrams are not included. */
export async function pptxToText(data: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(data);
  const slides: string[] = [];
  for (const [i, slidePath] of (await slideOrder(zip)).entries()) {
    const lines = paragraphs(await zip.file(slidePath)!.async("string"));
    const notesPath = (await relationships(zip, slidePath)).find((r) => r.type.endsWith("/notesSlide"))?.target;
    const notesXml = notesPath && (await zip.file(notesPath)?.async("string"));
    const notes = notesXml ? paragraphs(notesXml) : [];
    slides.push(
      [`### Slide ${i + 1}`, lines.join("\n") || "(no text on this slide)", notes.length ? `Speaker notes: ${notes.join(" ")}` : null]
        .filter(Boolean)
        .join("\n"),
    );
  }
  return slides.join("\n\n");
}
