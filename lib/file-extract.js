import { normalizeText } from "@/lib/text";

function toBuffer(file) {
  return file.arrayBuffer().then((ab) => Buffer.from(ab));
}

export async function extractResumeText(file, metadata) {
  if (metadata.lowerName.endsWith(".txt")) {
    const text = await file.text();
    return normalizeText(text);
  }

  if (metadata.lowerName.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const buffer = await toBuffer(file);
    const result = await mammoth.extractRawText({ buffer });
    return normalizeText(result.value || "");
  }

  if (metadata.lowerName.endsWith(".pdf")) {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const buffer = await toBuffer(file);
    const result = await pdfParse(buffer);
    return normalizeText(result.text || "");
  }

  return "";
}
