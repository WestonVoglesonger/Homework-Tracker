import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/db/client";
import { compare } from "bcryptjs";

describe("passwordResetService", () => {
  const email = `test_reset_${Date.now()}@example.com`;

  beforeAll(async () => {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: undefined },
    });
  });

  it("generates reset token and resets password", async () => {
    const { passwordResetService } = await import("../src/services/passwordResetService");
    const { token } = await passwordResetService.createToken(email, { ttlMinutes: 30 });
    const newPassword = "NewStrongP4ss!";
    const ok = await passwordResetService.consumeTokenAndResetPassword(email, token, newPassword);
    expect(ok).toBe(true);
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.passwordHash).toBeTruthy();
    const match = await compare(newPassword, user?.passwordHash || "");
    expect(match).toBe(true);
  });

  it("prevents reuse and rejects invalid tokens", async () => {
    const { passwordResetService } = await import("../src/services/passwordResetService");
    const { token } = await passwordResetService.createToken(email, { ttlMinutes: 30 });
    const ok1 = await passwordResetService.consumeTokenAndResetPassword(email, token, "AnotherStrongP4ss!");
    expect(ok1).toBe(true);
    const ok2 = await passwordResetService.consumeTokenAndResetPassword(email, token, "AnotherStrongP4ss!");
    expect(ok2).toBe(false);
  });

  it("rejects expired tokens", async () => {
    const { passwordResetService } = await import("../src/services/passwordResetService");
    const { token } = await passwordResetService.createToken(email, { ttlMinutes: 0 });
    await prisma.passwordResetToken.updateMany({
      where: { email },
      data: { expires: new Date(Date.now() - 60_000) },
    });
    const ok = await passwordResetService.consumeTokenAndResetPassword(email, token, "NewerStrongP4ss!");
    expect(ok).toBe(false);
  });
});


