import { Document, Packer, Paragraph } from "docx";

export const runtime = "nodejs";

function buildDocxFromText(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");

  const children = lines.map((line) => {
    // Preserve spacing
    if (line.trim().length === 0) {
      return new Paragraph({ text: "" });
    }

    // Convert "• " bullets into real Word bullets
    if (line.startsWith("• ")) {
      return new Paragraph({
        text: line.slice(2),
        bullet: { level: 0 }
      });
    }

    // Normal line
    return new Paragraph({ text: line });
  });

  return new Document({
    sections: [{ properties: {}, children }]
  });
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const tailoredResume = body?.tailoredResume;

    if (!tailoredResume || typeof tailoredResume !== "string" || tailoredResume.trim().length < 50) {
      return Response.json({ error: "No tailored resume provided." }, { status: 400 });
    }

    const doc = buildDocxFromText(tailoredResume);
    const buffer = await Packer.toBuffer(doc);

    const filename = "Tailored_Resume.docx";

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (e) {
    return Response.json({ error: e?.message || "DOCX export error" }, { status: 500 });
  }
}
