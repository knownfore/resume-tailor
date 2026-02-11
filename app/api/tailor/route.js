import { OpenAI } from "openai";
import { buildTailorPrompt } from "@/lib/prompts";
import { normalizeText } from "@/lib/text";

export const runtime = "nodejs";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function parseTagged(text, tag) {
  const start = text.indexOf(`[${tag}]`);
  if (start === -1) return "";
  const rest = text.slice(start + tag.length + 2);
  const next = rest.search(/\n\[[A-Z_]+\]\n/);
  return normalizeText((next === -1 ? rest : rest.slice(0, next)).trim());
}

export async function POST(req) {
  try {
    const client = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    const body = await req.json();
    const resumeText = normalizeText(body?.resumeText || "").slice(0, 14000);
    const jobText = normalizeText(body?.jobText || "").slice(0, 14000);

    if (resumeText.length < 200 || jobText.length < 200) {
      return Response.json(
        { error: "Please provide both a resume and a job posting (at least ~200 characters each)." },
        { status: 400 }
      );
    }

    const prompt = buildTailorPrompt({ resumeText, jobText });

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.3,
      messages: [
        { role: "system", content: "You produce ATS-friendly resume edits. Do not fabricate." },
        { role: "user", content: prompt }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const text = normalizeText(raw);

    const summary = parseTagged(text, "SUMMARY_REPLACEMENT");
    const skills = parseTagged(text, "SKILLS_REPLACEMENT");
    const experienceBullets = parseTagged(text, "EXPERIENCE_BULLETS_REPLACEMENT");
    const keywordAlignment = parseTagged(text, "KEYWORD_ALIGNMENT");

    const tailoredResume =
      parseTagged(text, "TAILORED_RESUME") ||
      parseTagged(text, "FULL_TAILORED_RESUME");

    // ✅ NEW GUARD — force model to return a full rewritten resume
    if (!tailoredResume) {
      return Response.json(
        { error: "Model did not return a [TAILORED_RESUME] section. Try again." },
        { status: 500 }
      );
    }

    return Response.json({
      summary,
      skills,
      experienceBullets,
      keywordAlignment,
      tailoredResume
    });
  } catch (e) {
    return Response.json(
      { error: e?.message || "Tailor error" },
      { status: 500 }
    );
  }
}

