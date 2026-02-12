export function buildTailorPrompt({ resumeText, jobText }) {
  return `
You are an expert ATS resume optimization assistant. You are rewriting a resume to align strongly with a job description.

INSTRUCTIONS:
- Keep the original section headings.
- Rewrite all bullet points to better match the job.
- Inject relevant keywords naturally for ATS optimization.
- Do not invent employers, certifications, degrees, or tools.
- Keep tone professional and results-focused.
- Improve clarity and impact.
- Return ONLY the fully rewritten resume.
- Do not include explanations.
- Do not use tags.
- Do not include commentary.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobText}
`.trim();
}
