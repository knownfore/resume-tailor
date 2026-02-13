import { normalizeText } from "@/lib/text";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(value)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (value.length > 254) {
    return { ok: false, error: "Email is too long." };
  }
  return { ok: true, value };
}

export function validatePassword(password) {
  const value = String(password || "");
  if (value.length < 10) {
    return { ok: false, error: "Password must be at least 10 characters." };
  }
  if (value.length > 128) {
    return { ok: false, error: "Password is too long." };
  }
  return { ok: true, value };
}

export function validateTailorText(text, name) {
  const value = normalizeText(text || "");
  if (value.length < 200) {
    return { ok: false, error: `${name} must be at least 200 characters.` };
  }
  if (value.length > 14000) {
    return { ok: false, error: `${name} is too long (max 14,000 chars).` };
  }
  return { ok: true, value };
}

export function validateUpload(file, maxUploadBytes) {
  if (!file) {
    return { ok: false, error: "Please upload a file." };
  }

  const fileName = String(file.name || "");
  const lowerName = fileName.toLowerCase();
  const bytes = Number(file.size || 0);

  if (!lowerName.endsWith(".txt") && !lowerName.endsWith(".pdf") && !lowerName.endsWith(".docx")) {
    return { ok: false, error: "Unsupported file type. Upload .txt, .pdf, or .docx." };
  }

  if (!bytes || bytes > maxUploadBytes) {
    return { ok: false, error: `File exceeds max size of ${Math.floor(maxUploadBytes / (1024 * 1024))}MB.` };
  }

  return { ok: true, value: { fileName, lowerName, bytes } };
}
