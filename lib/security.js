import crypto from "node:crypto";

const KEY_LEN = 64;

function toHex(buffer) {
  return Buffer.from(buffer).toString("hex");
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const digest = crypto.scryptSync(password, salt, KEY_LEN);
  return `${toHex(salt)}:${toHex(digest)}`;
}

export function verifyPassword(password, encoded) {
  const [saltHex, hashHex] = String(encoded || "").split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const digest = crypto.scryptSync(password, salt, KEY_LEN);
  const expected = Buffer.from(hashHex, "hex");
  if (digest.length !== expected.length) return false;

  return crypto.timingSafeEqual(digest, expected);
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashSessionToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}
