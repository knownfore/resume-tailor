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

    const name = file.name.toLowerCase();
    const ok = name.endsWith(".txt") || name.endsWith(".docx");

    if (!ok) {
      setError("Upload a .txt or .docx resume.");
      return;
    }

    try {
      const form = new FormData();
      form.append("file", file);

      const r = await fetch("/api/resume-from-file", {
        method: "POST",
        body: form
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || `File parse failed (${r.status})`);

      if (!data?.resumeText || typeof data.resumeText !== "string") {
        throw new Error("No resume text returned from file parser.");
      }

      setResumeText(data.resumeText);
    } catch (err) {
      setError(err?.message || "Could not parse resume file.");
    } finally {
      e.target.value = "";
    }
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

      if (!data?.tailoredResume || typeof data.tailoredResume !== "string") {
        throw new Error("No tailored resume returned.");
      }

      setResult({ tailoredResume: data.tailoredResume });

      // Automatically replace resume text with tailored version
      setResumeText(data.tailoredResume);
    } catch (e) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 34, margin: "0 0 8px" }}>ATS Resume Tailor</h1>
      <p style={{ marginTop: 0, color: "#444" }}>
        Upload your resume (TXT or DOCX) + paste a job posting. Get a fully rewritten ATS-friendly resume.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
        <div>
          <h3 style={{ marginBottom: 8 }}>Resume (.txt or .docx)</h3>
          <input type="file" accept=".txt,.docx" onChange={onResumeFile} />
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Or paste your resume text here"
            style={{ width: "100%", height: 260, marginTop: 10 }}
          />
        </div>

        <div>
          <h3 style={{ marginBottom: 8 }}>Job Posting</h3>
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste the job description here"
            style={{ width: "100%", height: 320 }}
          />
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <button
          type="button"
          onClick={tailor}
          disabled={loading}
          style={{
            padding: "10px 16px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Generating..." : "Tailor Resume"}
        </button>
      </div>

      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}

      {result?.tailoredResume && (
        <div style={{ marginTop: 26 }}>
          <Section title="Full Tailored Resume" content={result.tailoredResume} />
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
