import crypto from "node:crypto";
import { readDb, updateDb } from "@/lib/db";
import { hashSessionToken } from "@/lib/security";

function nowIso() {
  return new Date().toISOString();
}

export async function findUserByEmail(config, email) {
  const db = await readDb(config);
  return db.users.find((user) => user.email === email) || null;
}

export async function findUserById(config, userId) {
  const db = await readDb(config);
  return db.users.find((user) => user.id === userId) || null;
}

export async function createUser(config, { email, passwordHash }) {
  const existing = await findUserByEmail(config, email);
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const user = {
    id: crypto.randomUUID(),
    email,
    passwordHash,
    createdAt: nowIso()
  };

  await updateDb(config, (db) => ({
    ...db,
    users: [...db.users, user]
  }));

  return { ok: true, user };
}

export async function createSession(config, { userId, token, expiresAt }) {
  const tokenHash = hashSessionToken(token);
  const session = {
    id: crypto.randomUUID(),
    userId,
    tokenHash,
    createdAt: nowIso(),
    expiresAt
  };

  await updateDb(config, (db) => ({
    ...db,
    sessions: [...db.sessions.filter((item) => item.userId !== userId), session]
  }));

  return session;
}

export async function findSessionByToken(config, token) {
  const tokenHash = hashSessionToken(token);
  const now = Date.now();
  const db = await readDb(config);
  const session = db.sessions.find((row) => row.tokenHash === tokenHash);

  if (!session) return null;
  if (Date.parse(session.expiresAt) <= now) return null;
  return session;
}

export async function deleteSessionByToken(config, token) {
  const tokenHash = hashSessionToken(token);
  await updateDb(config, (db) => ({
    ...db,
    sessions: db.sessions.filter((row) => row.tokenHash !== tokenHash)
  }));
}

export async function saveTailoring(config, row) {
  const tailored = {
    id: crypto.randomUUID(),
    createdAt: nowIso(),
    ...row
  };

  await updateDb(config, (db) => ({
    ...db,
    tailorings: [tailored, ...db.tailorings].slice(0, 200)
  }));

  return tailored;
}

export async function listTailoringsByUser(config, userId) {
  const db = await readDb(config);
  return db.tailorings.filter((row) => row.userId === userId).slice(0, 20);
}

export async function findTailoringByIdForUser(config, tailoringId, userId) {
  const db = await readDb(config);
  return db.tailorings.find((row) => row.id === tailoringId && row.userId === userId) || null;
}

export async function listRecentTailorings(config) {
  const db = await readDb(config);
  return db.tailorings.slice(0, 20);
}

export async function findTailoringById(config, tailoringId) {
  const db = await readDb(config);
  return db.tailorings.find((row) => row.id === tailoringId) || null;
}
