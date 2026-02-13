import { getConfig } from "@/lib/config";
import { createSessionToken } from "@/lib/security";
import { createSession, deleteSessionByToken, findSessionByToken, findUserById } from "@/lib/repository";

function parseCookie(header) {
  const parts = String(header || "").split(";").map((item) => item.trim());
  const out = {};
  for (const part of parts) {
    if (!part) continue;
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

export function buildSessionCookie(token, maxAgeSeconds) {
  const config = getConfig();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${config.sessionCookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export function buildLogoutCookie() {
  const config = getConfig();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${config.sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export async function beginUserSession(userId) {
  const config = getConfig();
  const token = createSessionToken();
  const expiresAtMs = Date.now() + config.sessionTtlHours * 60 * 60 * 1000;

  await createSession(config, {
    userId,
    token,
    expiresAt: new Date(expiresAtMs).toISOString()
  });

  return {
    token,
    maxAgeSeconds: Math.floor((expiresAtMs - Date.now()) / 1000)
  };
}

export async function requireUserFromRequest(req) {
  const config = getConfig();
  const cookieHeader = req.headers.get("cookie");
  const cookies = parseCookie(cookieHeader);
  const token = cookies[config.sessionCookieName];
  if (!token) return null;

  const session = await findSessionByToken(config, token);
  if (!session) return null;

  const user = await findUserById(config, session.userId);
  if (!user) return null;

  return { user, token };
}

export async function endUserSession(token) {
  const config = getConfig();
  await deleteSessionByToken(config, token);
}
