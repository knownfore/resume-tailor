import { OpenAI } from "openai";
import { buildTailorPrompt } from "@/lib/prompts";
import { normalizeText } from "@/lib/text";

export const runtime = "nodejs";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function POST(req) {
  try {
    const client = new OpenAI({
      apiKey: requireEnv("OPENAI_API_KEY")
    });

    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    const body = await req.json();
    const resumeText = normalizeText(body?.resumeText || "").slice(0, 14000);
    const jobText = normalizeText(body?.jobText || "").slice(0, 14000);

    if (resumeText.length < 200 || jobText.length < 200) {
      return Response.json(
        { error: "Please provide both a resume and a job posting (minimum ~200 characters each)." },
        { status: 400 }
      );
    }

    const prompt = buildTailorPrompt({ resumeText, jobText });

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are an expert ATS resume optimization assistant. You rewrite resumes to match job descriptions. Do not fabricate experience. Return only the fully rewritten resume."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const tailoredResume = normalizeText(raw).trim();

    if (tailoredResume.length < 200) {
      return Response.json(
        { error: "Model returned an incomplete resume. Try again." },
        { status: 500 }
      );
    }

    return Response.json({ tailoredResume });
  } catch (e) {
    return Response.json(
      { error: e?.message || "Tailor error" },
      { status: 500 }
    );
  }
}
