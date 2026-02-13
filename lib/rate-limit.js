const state = new Map();

export function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const bucketKey = String(key || "unknown");

  const existing = state.get(bucketKey);
  if (!existing || now > existing.resetAt) {
    state.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: Math.max(limit - existing.count, 0) };
}
