import path from "node:path";
import { getConfig } from "@/lib/config";
import { buildResumeDocxBuffer, buildResumePdfBuffer } from "@/lib/export-resume";
import { jsonError } from "@/lib/http";
import { findTailoringById } from "@/lib/repository";

export const runtime = "nodejs";

function pickFormat(requested, original) {
  const value = String(requested || "").toLowerCase();
  if (value === "pdf" || value === "docx") return value;
  if (original === "pdf" || original === "docx") return original;
  return "docx";
}

function safeBaseName(fileName) {
  const parsed = path.parse(String(fileName || "tailored-resume"));
  return parsed.name.replace(/[^a-z0-9-_ ]/gi, "").trim() || "tailored-resume";
}

export async function GET(req) {
  const config = getConfig();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonError("Missing tailoring id.", 400);

  const row = await findTailoringById(config, id);
  if (!row) return jsonError("Tailoring record not found.", 404);

  const format = pickFormat(url.searchParams.get("format"), row.resumeFormat);
  const baseName = safeBaseName(row.resumeFileName);
  const downloadName = `${baseName}-tailored.${format}`;
  const tailoredText = row.resumeTailored || "";
  const sourceText = row.resumeOriginal || "";
  if (tailoredText.length < 20) return jsonError("Tailored resume content is empty.", 400);

  try {
    if (format === "pdf") {
      const pdfBuffer = await buildResumePdfBuffer(tailoredText, sourceText);
      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=\"${downloadName}\"`,
          "Cache-Control": "no-store"
        }
      });
    }

    const docxBuffer = await buildResumeDocxBuffer(tailoredText, sourceText);
    return new Response(docxBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename=\"${downloadName}\"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return jsonError(error?.message || "Failed to generate download.", 500);
  }
}
