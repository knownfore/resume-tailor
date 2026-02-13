import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_DB = Object.freeze({
  users: [],
  sessions: [],
  tailorings: []
});

let writeChain = Promise.resolve();

function cloneDefaultDb() {
  return {
    users: [],
    sessions: [],
    tailorings: []
  };
}

function getDbFile(config) {
  return path.join(config.dataDir, "db.json");
}

async function ensureDb(config) {
  const dbFile = getDbFile(config);
  await fs.mkdir(config.dataDir, { recursive: true });

  try {
    await fs.access(dbFile);
  } catch {
    await fs.writeFile(dbFile, `${JSON.stringify(DEFAULT_DB, null, 2)}\n`, "utf8");
  }
}

export async function readDb(config) {
  await ensureDb(config);
  const dbFile = getDbFile(config);
  const raw = await fs.readFile(dbFile, "utf8");
  const parsed = JSON.parse(raw);
  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    tailorings: Array.isArray(parsed.tailorings) ? parsed.tailorings : []
  };
}

export async function writeDb(config, nextDb) {
  await ensureDb(config);
  const dbFile = getDbFile(config);
  const tempFile = `${dbFile}.tmp`;
  const payload = `${JSON.stringify(nextDb, null, 2)}\n`;

  await fs.writeFile(tempFile, payload, "utf8");
  await fs.rename(tempFile, dbFile);
}

export async function updateDb(config, updater) {
  writeChain = writeChain.then(async () => {
    const current = await readDb(config);
    const next = updater(current) || cloneDefaultDb();
    await writeDb(config, next);
    return next;
  });

  return writeChain;
}
