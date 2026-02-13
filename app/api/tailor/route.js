import { withTimeout } from "@/lib/async";
import { getConfig } from "@/lib/config";
import { extractResumeText } from "@/lib/file-extract";
import { jsonError } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { saveTailoring } from "@/lib/repository";
import { tailorResume } from "@/lib/tailor-service";
import { validateTailorText, validateUpload } from "@/lib/validation";

export const runtime = "nodejs";

function getIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req) {
  const ip = getIp(req);
  const limited = checkRateLimit(`tailor:${ip}`, 12, 60_000);
  if (!limited.ok) {
    return jsonError("Rate limit exceeded. Please retry in a minute.", 429);
  }

  try {
    const config = getConfig();
    const form = await req.formData();
    const file = form.get("resumeFile");
    const jobTextRaw = form.get("jobText");

    if (!(file instanceof File)) {
      return jsonError("Please upload a resume file.", 400);
    }

    const uploadCheck = validateUpload(file, config.maxUploadBytes);
    if (!uploadCheck.ok) return jsonError(uploadCheck.error, 400);

    const jobCheck = validateTailorText(String(jobTextRaw || ""), "Job description");
    if (!jobCheck.ok) return jsonError(jobCheck.error, 400);

    const extractedResume = await withTimeout(
      extractResumeText(file, uploadCheck.value),
      20_000,
      "Resume parsing timed out. Please try a smaller or text based resume."
    );
    const resumeCheck = validateTailorText(extractedResume, "Resume text");
    if (!resumeCheck.ok) return jsonError(`${resumeCheck.error} Check file formatting and try again.`, 400);

    const resumeText = resumeCheck.value.slice(0, 8000);
    const jobText = jobCheck.value.slice(0, 8000);

    const tailoredResume = await withTimeout(
      tailorResume({
        resumeText,
        jobText
      }),
      75_000,
      "Tailoring timed out. Please retry with a shorter job description."
    );

    const row = await saveTailoring(config, {
      userId: null,
      resumeFileName: uploadCheck.value.fileName,
      resumeFormat: uploadCheck.value.lowerName.split(".").pop(),
      resumeOriginal: resumeCheck.value,
      jobText: jobCheck.value,
      resumeTailored: tailoredResume
    });

    return Response.json(
      {
        tailoredResume,
        tailoringId: row.id,
        createdAt: row.createdAt,
        resumeFormat: row.resumeFormat
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return jsonError(error?.message || "Tailoring failed.", 500);
  }
}
