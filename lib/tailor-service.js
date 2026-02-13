import { OpenAI } from "openai";
import { getConfig } from "@/lib/config";
import { buildTailorPrompt } from "@/lib/prompts";
import { normalizeText } from "@/lib/text";

export async function tailorResume({ resumeText, jobText }) {
  const config = getConfig();
  if (!config.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const client = new OpenAI({
    apiKey: config.openAiApiKey,
    timeout: 120_000,
    maxRetries: 1
  });
  const prompt = buildTailorPrompt({ resumeText, jobText });

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: config.openAiModel,
      temperature: 0.3,
      max_tokens: 2500,
      messages: [
        {
          role: "system",
          content:
            "You are an expert ATS resume optimization assistant. Rewrite resumes to match job descriptions without inventing experience. Return only the final resume text."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });
  } catch (error) {
    const status = Number(error?.status || 0);
    const message = String(error?.message || "");
    if (status === 408 || /timed out|timeout/i.test(message)) {
      throw new Error("Tailoring timed out with the model. Try a shorter job posting or try again.");
    }
    throw error;
  }

  const text = normalizeText(completion.choices?.[0]?.message?.content || "");
  if (text.length < 200) {
    throw new Error("Model returned an incomplete resume. Try again.");
  }

  return text;
}
