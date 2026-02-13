import path from "node:path";

function readNumber(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

export function getConfig() {
  return {
    openAiApiKey: process.env.OPENAI_API_KEY || "",
    openAiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    sessionCookieName: process.env.SESSION_COOKIE_NAME || "rt_session",
    sessionTtlHours: readNumber("SESSION_TTL_HOURS", 24 * 7),
    maxUploadBytes: readNumber("MAX_UPLOAD_BYTES", 3 * 1024 * 1024),
    dataDir: process.env.DATA_DIR
      ? path.resolve(process.cwd(), process.env.DATA_DIR)
      : path.join(process.cwd(), "data")
  };
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}
