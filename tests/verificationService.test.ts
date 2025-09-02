import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/db/client";

describe("verificationService", () => {
  const email = `test_verification_${Date.now()}@example.com`;

  beforeAll(async () => {
    // Ensure user exists without verified email
    await prisma.user.upsert({
      where: { email },
      update: { emailVerified: null },
      create: { email },
    });
  });

  afterAll(async () => {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  });

  it("creates a token and verifies the user successfully", async () => {
    const { verificationService } = await import("../src/services/verificationService");
    const created = await verificationService.createToken(email, { ttlMinutes: 60 });
    expect(created.token).toBeTruthy();
    expect(created.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const consumed = await verificationService.consumeToken(email, created.token);
    expect(consumed).toBe(true);

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.emailVerified).toBeTruthy();
  });

  it("does not allow reuse (single-use)", async () => {
    const { verificationService } = await import("../src/services/verificationService");
    const created = await verificationService.createToken(email, { ttlMinutes: 60 });
    const first = await verificationService.consumeToken(email, created.token);
    expect(first).toBe(true);
    const second = await verificationService.consumeToken(email, created.token);
    expect(second).toBe(false);
  });

  it("rejects expired tokens", async () => {
    const { verificationService } = await import("../src/services/verificationService");
    const created = await verificationService.createToken(email, { ttlMinutes: 0 });
    // Force expiry: subtract a minute
    await prisma.verificationToken.updateMany({
      where: { identifier: email },
      data: { expires: new Date(Date.now() - 60_000) },
    });
    const ok = await verificationService.consumeToken(email, created.token);
    expect(ok).toBe(false);
  });
});


