import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as meGet } from "@/app/api/auth/me/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { POST as registerPost } from "@/app/api/auth/register/route";

let tempDir = "";

function jsonRequest(url, method, payload, cookie) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers.cookie = cookie;

  return new Request(url, {
    method,
    headers,
    body: payload ? JSON.stringify(payload) : undefined
  });
}

beforeAll(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-tailor-test-"));
  process.env.DATA_DIR = tempDir;
});

afterAll(async () => {
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

describe("auth integration smoke", () => {
  it("registers, authenticates, logs out, and blocks unauthenticated requests", async () => {
    const email = "smoke@example.com";
    const password = "my-secure-pass-123";

    const registerRes = await registerPost(jsonRequest("http://localhost/api/auth/register", "POST", { email, password }));
    expect(registerRes.status).toBe(201);

    const cookie = registerRes.headers.get("set-cookie");
    expect(cookie).toBeTruthy();
    expect(cookie).toContain("HttpOnly");

    const meRes = await meGet(new Request("http://localhost/api/auth/me", { headers: { cookie } }));
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.user.email).toBe(email);

    const logoutRes = await logoutPost(new Request("http://localhost/api/auth/logout", { method: "POST", headers: { cookie } }));
    expect(logoutRes.status).toBe(200);

    const postLogoutMeRes = await meGet(new Request("http://localhost/api/auth/me", { headers: { cookie } }));
    expect(postLogoutMeRes.status).toBe(401);

    const loginRes = await loginPost(jsonRequest("http://localhost/api/auth/login", "POST", { email, password }));
    expect(loginRes.status).toBe(200);
  });
});
