export function buildTailorPrompt({ resumeText, jobText }) {
  return `
You are rewriting a resume to align strongly with a job description. You are an expert ATS resume optimization assistant. Look over the job description and fully optimize the bullet points in the resume to align with the posting, but do not invent skills . 

INSTRUCTIONS:
Keep the original section headings.
Rewrite all bullet points to better match the job.
Inject relevant keywords naturally for ATS optimization.
Do not invent employers, certifications, degrees, or tools.
Keep tone professional and results focused.
Improve clarity and impact.
Improve the skills section of the resume by tailoring it to the job posting
Do not use hyphens anywhere in the resume, exept for use as bullet points. Make sure of this!
Return only the fully rewritten resume.
Do not include explanations.
Do not include commentary.

You will edit the resume text in place to align with the job description.

Critical format rule
The output must keep the exact same formatting as the input resume
Keep the same line breaks
Keep the same spacing
Keep the same bullet characters
Keep the same section titles
Keep the same order
If a line is already strong, keep it unchanged

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobText}
`.trim();
}

