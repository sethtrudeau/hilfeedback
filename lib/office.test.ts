import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { pptxToText, xlsxToText } from "./office";

async function budgetWorkbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Budget");
  ws.addRow(["Item", "Sq ft", "Cost"]);
  ws.addRow(["Concrete", 3000, { formula: "B2*7", result: 21000 }]);
  ws.addRow(["Total", null, { formula: "SUM(C2:C2)", result: 21000 }]);
  wb.addWorksheet("Survey").addRow(["Feature", "Votes"]);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

const slideXml = (texts: string[]) =>
  `<?xml version="1.0"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree>${texts
    .map((t) => `<p:sp><p:txBody><a:p><a:r><a:t>${t}</a:t></a:r></a:p></p:txBody></p:sp>`)
    .join("")}</p:spTree></p:cSld></p:sld>`;

async function deck(): Promise<Buffer> {
  const zip = new JSZip();
  // Slide 10 before slide 2 in the archive to check numeric ordering.
  zip.file("ppt/slides/slide10.xml", slideXml(["Thank you"]));
  zip.file("ppt/slides/slide2.xml", slideXml(["Budget", "Total: $43,450 &amp; permits"]));
  zip.file("ppt/slides/slide1.xml", slideXml(["Elm St Skatepark"]));
  // Notes file numbering deliberately differs from the slide it belongs to.
  zip.file("ppt/notesSlides/notesSlide7.xml", slideXml(["Mention the survey here"]));
  zip.file(
    "ppt/slides/_rels/slide2.xml.rels",
    `<Relationships><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide7.xml"/></Relationships>`,
  );
  return zip.generateAsync({ type: "nodebuffer" });
}

async function reorderedDeck(): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("ppt/slides/slide1.xml", slideXml(["Shown second"]));
  zip.file("ppt/slides/slide2.xml", slideXml(["Shown first"]));
  zip.file(
    "ppt/presentation.xml",
    `<p:presentation xmlns:p="p" xmlns:r="r"><p:sldIdLst><p:sldId id="256" r:id="rId3"/><p:sldId id="257" r:id="rId2"/></p:sldIdLst></p:presentation>`,
  );
  zip.file(
    "ppt/_rels/presentation.xml.rels",
    `<Relationships><Relationship Id="rId2" Type="x/slide" Target="slides/slide1.xml"/><Relationship Id="rId3" Type="x/slide" Target="slides/slide2.xml"/></Relationships>`,
  );
  return zip.generateAsync({ type: "nodebuffer" });
}

describe("xlsxToText", () => {
  it("includes every sheet, cell values and formulas", async () => {
    const text = await xlsxToText(await budgetWorkbook());
    expect(text).toContain("## Sheet: Budget");
    expect(text).toContain("## Sheet: Survey");
    expect(text).toContain("A2: Concrete | B2: 3000 | C2: 21000 (=B2*7)");
    expect(text).toContain("C3: 21000 (=SUM(C2:C2))");
  });

  it("truncates very large workbooks", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Big");
    for (let i = 0; i < 6000; i++) ws.addRow([`row ${i}`, "x".repeat(20)]);
    const text = await xlsxToText(Buffer.from(await wb.xlsx.writeBuffer()));
    expect(text.length).toBeLessThan(110_000);
    expect(text).toMatch(/truncated/i);
  });
});

describe("pptxToText", () => {
  it("extracts slide text in slide order with speaker notes", async () => {
    const text = await pptxToText(await deck());
    expect(text.indexOf("Elm St Skatepark")).toBeLessThan(text.indexOf("Budget"));
    expect(text.indexOf("Budget")).toBeLessThan(text.indexOf("Thank you"));
    expect(text).toMatch(/### Slide 3\nThank you/);
    expect(text).toContain("Total: $43,450 & permits");
    expect(text).toContain("Speaker notes: Mention the survey here");
  });

  it("follows the presentation's slide order, not file names", async () => {
    const text = await pptxToText(await reorderedDeck());
    expect(text.indexOf("Shown first")).toBeLessThan(text.indexOf("Shown second"));
    expect(text).toMatch(/Slide 1\n+Shown first/);
  });
});
