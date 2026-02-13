"use client";

import { useEffect, useRef, useState } from "react";

function prettyDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export default function Page() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobText, setJobText] = useState("");
  const [loadingTailor, setLoadingTailor] = useState(false);
  const [tailorProgress, setTailorProgress] = useState(0);
  const [tailorError, setTailorError] = useState("");
  const [tailoredResume, setTailoredResume] = useState("");
  const [latestTailoringId, setLatestTailoringId] = useState("");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const progressTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12_000);
      const res = await fetch("/api/tailor/history", { cache: "no-store", signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        setHistory([]);
        return;
      }
      const data = await res.json().catch(() => ({ history: [] }));
      setHistory(Array.isArray(data.history) ? data.history : []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function downloadTailoredResume(tailoringId, format) {
    try {
      const res = await fetch(`/api/tailor/download?id=${encodeURIComponent(tailoringId)}&format=${format}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Download failed (${res.status})`);
      }

      const disposition = res.headers.get("content-disposition") || "";
      const fileNameMatch = disposition.match(/filename=\"?([^\"]+)\"?/i);
      const fileName = fileNameMatch?.[1] || `tailored-resume.${format}`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setTailorError(error?.message || "Download failed.");
    }
  }

  async function onTailor(e) {
    e.preventDefault();
    setTailorError("");
    setTailoredResume("");
    setLoadingTailor(true);
    setTailorProgress(1);
    let completed = false;

    try {
      if (!resumeFile) throw new Error("Please upload a resume file.");
      const form = new FormData();
      form.append("resumeFile", resumeFile);
      form.append("jobText", jobText);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort("Tailor request timed out."), 90_000);

      let res;
      try {
        res = await fetch("/api/tailor", {
          method: "POST",
          body: form,
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        if (res.status === 408) throw new Error("Tailoring timed out. Please retry.");
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      setTailorProgress(100);
      completed = true;
      setTailoredResume(data?.tailoredResume || "");
      setLatestTailoringId(data?.tailoringId || "");
      await loadHistory();
    } catch (error) {
      if (error?.name === "AbortError") {
        setTailorError("Tailoring timed out. Please retry.");
      } else {
        setTailorError(error?.message || "Tailoring request failed.");
      }
    } finally {
      const delayMs = completed ? 1000 : 350;
      setTimeout(() => {
        setLoadingTailor(false);
        setTailorProgress(0);
      }, delayMs);
    }
  }

  useEffect(() => {
    if (!loadingTailor) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      return;
    }

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setTailorProgress((current) => {
        if (current >= 99) return current;
        const step = current < 35 ? 6 : current < 70 ? 3 : 1;
        return Math.min(current + step, 99);
      });
    }, 300);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [loadingTailor]);

  return (
    <main className="shell">
      <section className="panel hero">
        <div>
          <h1 className="title">MatchCV</h1>
          <p className="subtle">Turn any resume into a job-specific, ATS optimized version you can download as polished PDF or Word.</p>
        </div>
      </section>

      <section className="panel section" style={{ marginTop: 14, animation: "slide-in 420ms ease" }}>
        <form onSubmit={onTailor}>
          <div className="form-grid">
            <div>
              <div className="label">Resume Upload</div>
              <input
                ref={fileInputRef}
                className="hidden-file-input"
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                required
              />
              <div className="upload-box">
                <button className="ghost-btn" type="button" onClick={() => fileInputRef.current?.click()} style={{ minWidth: 170 }}>
                  Choose Resume File
                </button>
                <span className="file-name mono">{resumeFile?.name || "No file selected yet"}</span>
              </div>
              <p className="subtle" style={{ fontSize: 12, marginTop: 8 }}>
                Supported: `.txt`, `.pdf`, `.docx` up to 3MB
              </p>
            </div>

            <div>
              <div className="label">Job Posting</div>
              <textarea
                className="textarea mono"
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Paste the full job description."
                required
              />
            </div>
          </div>

          <div className="toolbar" style={{ marginTop: 12 }}>
            <button className="button" type="submit" disabled={loadingTailor}>
              {loadingTailor ? "Tailoring..." : "Tailor Resume"}
            </button>
          </div>
        </form>

        {loadingTailor && (
          <section className="progress-wrap">
            <div className="progress-top">
              <span className="mono">Optimizing resume for ATS</span>
              <strong>{tailorProgress}%</strong>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${tailorProgress}%` }} />
            </div>
          </section>
        )}

        {tailorError && <p className="error">{tailorError}</p>}
      </section>

      {tailoredResume && (
        <section className="panel section" style={{ marginTop: 14 }}>
          <div className="section-head">
            <h2>Tailored Resume</h2>
            {latestTailoringId && (
              <div className="tools-bar">
                <button className="ghost-btn" type="button" onClick={() => downloadTailoredResume(latestTailoringId, "pdf")}>
                  Download PDF
                </button>
                <button className="ghost-btn" type="button" onClick={() => downloadTailoredResume(latestTailoringId, "docx")}>
                  Download Word
                </button>
              </div>
            )}
          </div>
          <div className="result-box">{tailoredResume}</div>
        </section>
      )}

      <section className="panel section" style={{ marginTop: 14 }}>
        <div className="section-head">
          <h2>Recent History</h2>
          {!loadingHistory && history.length > 0 && (
            <span className="pill mono">{history.length} entries</span>
          )}
        </div>
        {loadingHistory && <p className="subtle">Loading history...</p>}
        {!loadingHistory && history.length === 0 && <p className="subtle">No tailoring history yet.</p>}
        <div className="history-list">
          {history.map((item) => (
            <article key={item.id} className="history-item">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div className="history-meta">
                  {item.resumeFileName} ({item.resumeFormat}) at {prettyDate(item.createdAt)}
                </div>
                <div className="tools-bar">
                  <button className="ghost-btn" type="button" onClick={() => downloadTailoredResume(item.id, "pdf")}>
                    PDF
                  </button>
                  <button className="ghost-btn" type="button" onClick={() => downloadTailoredResume(item.id, "docx")}>
                    Word
                  </button>
                </div>
              </div>
              <div className="history-preview">{item.resumeTailored}</div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
