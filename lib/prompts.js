export function buildTailorPrompt({ resumeText, jobText }) {
  return `
You will be given a RESUME and a JOB POSTING.

Goal:
- Produce ATS-friendly replacement content tailored to the job posting.
- Do NOT invent experience, employers, dates, tools, certifications, degrees, or achievements.
- You may rephrase and reorder existing content and emphasize relevant parts.
- Keep it concise and realistic.

Output format MUST be exactly these tagged sections:

[SUMMARY_REPLACEMENT]
(3-5 lines, tailored, no fluff)

[SKILLS_REPLACEMENT]
(10-18 bullet skills, comma-separated or bullets)

[EXPERIENCE_BULLETS_REPLACEMENT]
(6-10 bullets that the user can paste into their most relevant role. Use strong verbs. No fabrication.)

[KEYWORD_ALIGNMENT]
- Matched keywords: ...
- Missing keywords (do not fabricate): ...
- Suggestions (how to incorporate truthfully): ...

Optional:
After the above, you MAY include:
[TAILORED_RESUME]
A full revised resume draft using the user’s existing headings.

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
