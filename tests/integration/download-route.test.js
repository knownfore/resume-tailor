import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as downloadGet } from "@/app/api/tailor/download/route";
import { getConfig } from "@/lib/config";
import { saveTailoring } from "@/lib/repository";

let tempDir = "";

beforeAll(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-tailor-download-test-"));
  process.env.DATA_DIR = tempDir;
});

afterAll(async () => {
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

describe("download route integration", () => {
  it("returns docx and pdf attachments for stored tailoring record", async () => {
    const config = getConfig();
    const row = await saveTailoring(config, {
      userId: null,
      resumeFileName: "Original Resume.pdf",
      resumeFormat: "pdf",
      resumeOriginal: "Original",
      jobText: "Job",
      resumeTailored: "SUMMARY\nTailored content\n- Bullet"
    });

    const docxRes = await downloadGet(new Request(`http://localhost/api/tailor/download?id=${row.id}&format=docx`));
    expect(docxRes.status).toBe(200);
    expect(docxRes.headers.get("content-type")).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    const pdfRes = await downloadGet(new Request(`http://localhost/api/tailor/download?id=${row.id}&format=pdf`));
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers.get("content-type")).toContain("application/pdf");
  });
});
