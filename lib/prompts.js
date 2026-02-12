export function buildTailorPrompt(resumeText, jobText) {
  return `
You are an expert ATS resume optimization assistant.

TASK:
Rewrite the candidate's resume to strongly align with the job description.

RULES:
- Keep the same section headings.
- Rewrite all bullet points to better match the job description.
- Naturally inject important keywords from the job description.
- Maintain professional tone.
- Do NOT add commentary.
- Do NOT use tags like [SUMMARY] or [SKILLS].
- Return ONLY the fully rewritten resume.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobText}
`;
}
