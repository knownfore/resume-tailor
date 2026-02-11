"use client";

import { useState } from "react";

export default function Page() {
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onResumeFile(e) {
    setError("");
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // For v1: accept .txt only (fast, no OCR/PDF parsing headaches)
    const name = file.name.toLowerCase();
    if (!name.endsWith(".txt")) {
      setError("For now, upload a .txt resume. (PDF/DOCX support can be added next.)");
      return;
    }

    const text = await file.text();
    setResumeText(text);
  }

  async function tailor() {
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const r = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobText })
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || `Request failed (${r.status})`);

      setResult(data);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 34, margin: "0 0 8px" }}>ATS Resume Tailor</h1>
      <p style={{ marginTop: 0, color: "#444" }}>
        Upload your resume (TXT for now) + paste a job posting. Get ATS-friendly replacement sections.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
        <div>
          <h3 style={{ marginBottom: 8 }}>Resume (.txt)</h3>
          <input type="file" accept=".txt" onChange={onResumeFile} />
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="...or paste your resume text here"
            style={{ width: "100%", height: 260, marginTop: 10 }}
          />
        </div>

        <div>
          <h3 style={{ marginBottom: 8 }}>Job Posting</h3>
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste the job description here..."
            style={{ width: "100%", height: 320 }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={tailor}
        disabled={loading}
        style={{
          marginTop: 18,
          padding: "10px 16px",
          background: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer"
        }}
      >
        {loading ? "Generating..." : "Tailor Resume"}
      </button>

      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 26 }}>
          <Section title="Summary Replacement" content={result.summary || ""} />
          <Section title="Skills Replacement" content={result.skills || ""} />
          <Section title="Experience Bullets Replacement" content={result.experienceBullets || ""} />
          <Section title="Keyword Alignment" content={result.keywordAlignment || ""} />

          {result.tailoredResume && (
            <Section title="Full Tailored Resume (Optional)" content={result.tailoredResume} />
          )}
        </div>
      )}
    </main>
  );
}

function Section({ title, content }) {
  return (
    <div style={{ marginTop: 18 }}>
      <h3 style={{ margin: "0 0 8px" }}>{title}</h3>
      <div style={{ whiteSpace: "pre-wrap", border: "1px solid #ddd", padding: 12, borderRadius: 10 }}>
        {content || "(No content returned)"}
      </div>
    </div>
  );
}
