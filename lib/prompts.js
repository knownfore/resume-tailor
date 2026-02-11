export function buildTailorPrompt({ resumeText, jobText }) {
  return `
You will be given a RESUME and a JOB POSTING.

Rules:
- Do NOT invent experience, employers, dates, degrees, certifications, tools, or achievements.
- Keep the candidate truthful. Rephrase and reorganize ONLY what exists.
- Preserve the resume's section headings and overall structure as much as possible.
- Output must be ATS-friendly: simple formatting, no tables, no fancy characters.

Return EXACTLY these sections:

[SUMMARY_REPLACEMENT]
Write a tailored professional summary (3–5 lines).

[SKILLS_REPLACEMENT]
Write an ATS-friendly skills list (10–18 items). Use simple commas or bullets.

[EXPERIENCE_BULLETS_REPLACEMENT]
Write 6–10 bullets tailored to the job, using only information present in the resume.

[KEYWORD_ALIGNMENT]
- Matched keywords: ...
- Missing keywords (do not fabricate): ...
- Suggestions to incorporate truthfully: ...

[FULL_TAILORED_RESUME]
Rewrite the entire resume using the original resume as the base.
- Keep all original section headings (or closest equivalents)
- Keep company names, dates, titles exactly as provided
- Replace the summary and skills with the replacements you wrote above
- Refresh bullets where appropriate using the experience bullets you wrote
- Maintain clean, ATS-friendly formatting

RESUME:
<<<
${resumeText}
>>>

JOB POSTING:
<<<
${jobText}
>>>
`.trim();
}
