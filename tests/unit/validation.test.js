import { describe, expect, it } from "vitest";
import { validateEmail, validatePassword, validateTailorText, validateUpload } from "@/lib/validation";

describe("validation helpers", () => {
  it("validates emails", () => {
    expect(validateEmail("person@example.com").ok).toBe(true);
    expect(validateEmail("bad-email").ok).toBe(false);
  });

  it("validates passwords", () => {
    expect(validatePassword("1234567890").ok).toBe(true);
    expect(validatePassword("short").ok).toBe(false);
  });

  it("validates tailoring text length", () => {
    const validText = "A".repeat(250);
    const shortText = "A".repeat(50);
    expect(validateTailorText(validText, "Resume").ok).toBe(true);
    expect(validateTailorText(shortText, "Resume").ok).toBe(false);
  });

  it("validates upload extension and size", () => {
    const fakeTxt = { name: "resume.txt", size: 1000 };
    const fakeExe = { name: "run.exe", size: 1000 };
    const bigPdf = { name: "resume.pdf", size: 20 * 1024 * 1024 };

    expect(validateUpload(fakeTxt, 3 * 1024 * 1024).ok).toBe(true);
    expect(validateUpload(fakeExe, 3 * 1024 * 1024).ok).toBe(false);
    expect(validateUpload(bigPdf, 3 * 1024 * 1024).ok).toBe(false);
  });
});
