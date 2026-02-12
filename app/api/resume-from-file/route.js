import mammoth from "mammoth";
import { normalizeText } from "@/lib/text";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file) {
      return Response.json({ error: "No file uploaded." }, { status: 400 });
    }

    const name = (file.name || "").toLowerCase();

    // TXT: keep simple
    if (name.endsWith(".txt")) {
      const text = await file.text();
      // Keep your normalizer if it doesn't collapse newlines.
      // If normalizeText collapses spacing too much, use: text.replace(/\r\n/g, "\n")
      const resumeText = normalizeText(text);
      return Response.json({ resumeText });
    }

    // DOCX: extract text with mammoth
    if (name.endsWith(".docx")) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // mammoth extracts text with line breaks; good for preserving section spacing
      const { value } = await mammoth.extractRawText({ buffer });

      const resumeText = (value || "").replace(/\r\n/g, "\n").trimEnd();

      if (resumeText.length < 200) {
        return Response.json(
          { error: "Could not extract readable text from this DOCX. Try saving it again and re-uploading." },
          { status: 400 }
        );
      }

      return Response.json({ resumeText });
    }

    return Response.json({ error: "Unsupported file type. Upload .txt or .docx" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e?.message || "Resume file parse error" }, { status: 500 });
  }
}
