export function buildTailorPrompt({ resumeText, jobText }) {
  return `
You will be given a RESUME and a JOB POSTING.

Hard rules:
- Do NOT invent employers, titles, dates, degrees, certifications, tools, or achievements.
- You may rephrase and reorder ONLY what already exists in the resume.
- ATS-friendly output: plain text, no tables, no fancy symbols, no markdown.
- Keep section headings the same as the original resume whenever possible.

You MUST output EXACTLY these sections, in this order:

[SUMMARY_REPLACEMENT]
Write a tailored professional summary (3–5 lines). Use keywords from the job posting, but ONLY if supported by the resume.

[SKILLS_REPLACEMENT]
Rewrite the skills section tightly aligned to the job posting.
Rules:
- Prioritize and reorder skills based on the job posting.
- Remove low-relevance items if needed.
- Do NOT add skills that are not supported by the resume.
- Output as a clean comma-separated list or simple bullets.

[EXPERIENCE_BULLETS_REPLACEMENT]
Write 6–10 ATS-friendly bullets the candidate can paste into their most relevant role.
Rules:
- Use strong verbs and measurable language ONLY if supported by the resume.
- Do NOT fabricate metrics.

[KEYWORD_ALIGNMENT]
- Matched keywords: ...
- Missing keywords (do not fabricate): ...
- Suggestions to incorporate truthfully: ...

[TAILORED_RESUME]
Rewrite the FULL resume as clean ATS text.

CRITICAL REQUIREMENTS FOR [TAILORED_RESUME]:
1) You MUST replace the resume's Summary/Professional Summary section with the EXACT text from [SUMMARY_REPLACEMENT] (verbatim).
2) You MUST replace the resume's Skills section with the EXACT text from [SKILLS_REPLACEMENT] (verbatim).
3) You MUST incorporate the ideas from [EXPERIENCE_BULLETS_REPLACEMENT] into the most relevant job role bullets WITHOUT inventing new facts.
4) Preserve the original heading structure and ordering as much as possible (e.g., EDUCATION, PROFESSIONAL EXPERIENCE).
5) Keep names, company names, dates, titles exactly as provided in the resume.
6) Output should be ready to paste as a complete resume.

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
