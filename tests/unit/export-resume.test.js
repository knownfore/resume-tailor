import { describe, expect, it } from "vitest";
import { buildResumeDocxBuffer, buildResumePdfBuffer } from "@/lib/export-resume";

const SAMPLE = `SUMMARY
Experienced engineer

EXPERIENCE
- Built APIs
- Improved reliability`;

describe("resume export", () => {
  it("builds docx buffer", async () => {
    const buffer = await buildResumeDocxBuffer(SAMPLE);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(200);
  });

  it("builds pdf buffer", async () => {
    const buffer = await buildResumePdfBuffer(SAMPLE);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(200);
  });
});
