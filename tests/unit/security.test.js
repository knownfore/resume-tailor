import { describe, expect, it } from "vitest";
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "@/lib/security";

describe("security helpers", () => {
  it("hashes and verifies passwords", () => {
    const hash = hashPassword("super-secure-password");
    expect(hash).toContain(":");
    expect(verifyPassword("super-secure-password", hash)).toBe(true);
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("creates and hashes session tokens", () => {
    const tokenA = createSessionToken();
    const tokenB = createSessionToken();
    expect(tokenA).not.toBe(tokenB);
    expect(hashSessionToken(tokenA)).not.toBe(hashSessionToken(tokenB));
  });
});
