import { Document, Packer, Paragraph } from "docx";

function splitLines(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");
}

function looksLikeBullet(line) {
  const value = line.trim();
  return value.startsWith("- ") || value.startsWith("* ") || value.startsWith("• ") || value.startsWith("● ");
}

function looksLikeSectionHeading(line) {
  const value = String(line || "").trim();
  if (!value || value.length > 70) return false;
  if (looksLikeBullet(value)) return false;
  return /^[A-Z0-9/&(),.\-'\s]+$/.test(value) && value === value.toUpperCase();
}

function parseSections(text) {
  const lines = splitLines(text);
  const nonEmpty = lines.map((l) => l.trim()).filter(Boolean);
  let pointer = 0;
  const headerLines = [];
  while (pointer < nonEmpty.length) {
    const line = nonEmpty[pointer];
    if (looksLikeSectionHeading(line) && headerLines.length > 0) break;
    headerLines.push(line);
    pointer += 1;
    if (headerLines.length >= 3) break;
  }

  const name = headerLines[0] || "Candidate Name";
  const contact = headerLines[1] || "";
  const title = headerLines[2] || "";

  const sections = [];
  let current = null;
  for (const value of nonEmpty.slice(pointer)) {
    if (looksLikeSectionHeading(value)) {
      current = { heading: value, lines: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      current = { heading: "SUMMARY", lines: [] };
      sections.push(current);
    }
    current.lines.push(value);
  }

  return { name, contact, title, sections, nonEmpty };
}

function buildStyleProfile(sourceText) {
  const parsed = parseSections(sourceText);
  const firstBullet = parsed.nonEmpty.find((line) => looksLikeBullet(line));
  let bulletPrefix = "• ";
  if (firstBullet) {
    const trimmed = firstBullet.trim();
    if (trimmed.startsWith("● ")) bulletPrefix = "● ";
    else if (trimmed.startsWith("- ")) bulletPrefix = "- ";
    else if (trimmed.startsWith("* ")) bulletPrefix = "* ";
  }

  return {
    name: parsed.name,
    contact: parsed.contact,
    title: parsed.title,
    bulletPrefix
  };
}

export async function buildResumeDocxBuffer(tailoredText, sourceText = "") {
  const sourceProfile = buildStyleProfile(sourceText || tailoredText);
  const tpl = parseSections(tailoredText);
  const children = [];

  children.push(
    new Paragraph({
      text: sourceProfile.name || tpl.name,
      heading: "Heading1",
      spacing: { after: 80 }
    })
  );

  if (sourceProfile.contact || tpl.contact) {
    children.push(
      new Paragraph({
        text: sourceProfile.contact || tpl.contact,
        spacing: { after: 180 }
      })
    );
  }

  if (sourceProfile.title || tpl.title) {
    children.push(
      new Paragraph({
        text: (sourceProfile.title || tpl.title).toUpperCase(),
        spacing: { after: 220 }
      })
    );
  }

  for (const section of tpl.sections) {
    children.push(
      new Paragraph({
        text: section.heading.toUpperCase(),
        heading: "Heading2",
        spacing: { before: 200, after: 120 }
      })
    );

    for (const line of section.lines) {
      if (looksLikeBullet(line)) {
        children.push(
          new Paragraph({
            text: line.replace(/^[*•●-]\s*/, ""),
            bullet: { level: 0 },
            spacing: { after: 80 }
          })
        );
      } else {
        children.push(
          new Paragraph({
            text: line,
            spacing: { after: 80 }
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [{ children }]
  });

  return Packer.toBuffer(doc);
}

function wrapByLength(line, maxChars) {
  const words = String(line || "").split(/\s+/).filter(Boolean);
  if (!words.length) return [""];

  const rows = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const next = `${current} ${words[i]}`;
    if (next.length <= maxChars) current = next;
    else {
      rows.push(current);
      current = words[i];
    }
  }
  rows.push(current);
  return rows;
}

function toPdfText(value) {
  const normalized = String(value || "")
    .replace(/â€”|—/g, "-")
    .replace(/â€“|–/g, "-")
    .replace(/â€¢|•|â—|●/g, "*")
    .replace(/Ê¼|’|‘/g, "'")
    .replace(/“|”/g, "\"")
    .replace(/…/g, "...")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

  return normalized
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildPdfBufferFromStreams(pageStreams) {
  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const fontRegularId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBoldId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pagesId = addObject("<< /Type /Pages /Kids [] /Count 0 >>");

  const pageIds = [];
  for (const stream of pageStreams) {
    const len = Buffer.byteLength(stream, "utf8");
    const contentId = addObject(`<< /Length ${len} >>\nstream\n${stream}\nendstream`);
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  }

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    const off = String(offsets[i]).padStart(10, "0");
    pdf += `${off} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

export async function buildResumePdfBuffer(tailoredText, sourceText = "") {
  const sourceProfile = buildStyleProfile(sourceText || tailoredText);
  const tpl = parseSections(tailoredText);

  const margin = 56;
  const top = 792 - margin;
  const bottom = margin;
  const lineHeight = 15;
  const titleLineHeight = 22;

  let y = top;
  let currentPage = [];
  const pages = [currentPage];

  const pushLine = (line, opts = {}) => {
    const x = margin + (opts.indent || 0);
    const font = opts.bold ? "F2" : "F1";
    const size = opts.size || 10.5;
    const statement = `BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${toPdfText(line)}) Tj ET`;
    currentPage.push(statement);
    y -= opts.lineHeight || lineHeight;
    if (y < bottom + titleLineHeight) {
      y = top;
      currentPage = [];
      pages.push(currentPage);
    }
  };

  pushLine(sourceProfile.name || tpl.name, { bold: true, size: 22, lineHeight: 24 });
  if (sourceProfile.contact || tpl.contact) pushLine(sourceProfile.contact || tpl.contact, { size: 10.5 });
  if (sourceProfile.title || tpl.title) {
    y -= 4;
    pushLine((sourceProfile.title || tpl.title).toUpperCase(), { bold: true, size: 12, lineHeight: 18 });
  }
  y -= 8;

  for (const section of tpl.sections) {
    pushLine(section.heading.toUpperCase(), { bold: true, size: 11.5 });
    y -= 2;

    for (const line of section.lines) {
      if (looksLikeBullet(line)) {
        const bullet = `${sourceProfile.bulletPrefix}${line.replace(/^[*•●-]\s*/, "")}`;
        const wrapped = wrapByLength(bullet, 96);
        for (const row of wrapped) pushLine(row, { indent: 10 });
      } else {
        const wrapped = wrapByLength(line, 106);
        for (const row of wrapped) pushLine(row);
      }
      y -= 2;
    }
    y -= 4;
  }

  return buildPdfBufferFromStreams(pages.map((rows) => rows.join("\n")));
}
