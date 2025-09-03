import { createHash, randomBytes } from "crypto";
import { prisma } from "../db/client";
import { hash } from "bcryptjs";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export interface CreateResetTokenOptions {
  ttlMinutes?: number;
}

export const passwordResetService = {
  async createToken(email: string, options?: CreateResetTokenOptions): Promise<{ token: string; expiresAt: Date }> {
    const ttlMinutes = options?.ttlMinutes ?? 60; // default 60m
    const token = randomBytes(32).toString("hex");
    const tokenHash = sha256Hex(token);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
    const normalizedEmail = email.toLowerCase().trim();

    // Ensure user exists
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      // For privacy, still behave as if success
      return { token, expiresAt };
    }

    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        tokenHash,
        expires: expiresAt,
      },
    });

    return { token, expiresAt };
  },

  async consumeTokenAndResetPassword(email: string, token: string, newPassword: string): Promise<boolean> {
    const now = new Date();
    const tokenHash = sha256Hex(token);
    const normalizedEmail = email.toLowerCase().trim();

    return await prisma.$transaction(async tx => {
      const record = await tx.passwordResetToken.findFirst({ where: { email: normalizedEmail, tokenHash } });
      if (!record) return false;
      if (record.expires <= now || record.usedAt) {
        await tx.passwordResetToken.deleteMany({ where: { email: normalizedEmail, tokenHash } });
        return false;
      }

      const user = await tx.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        await tx.passwordResetToken.deleteMany({ where: { email, tokenHash } });
        return false;
      }

      const passwordHash = await hash(newPassword, 12);
      await tx.user.update({ where: { id: user.id }, data: { passwordHash } });

      await tx.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: now } });
      // Optionally revoke all other outstanding tokens for this email
      await tx.passwordResetToken.deleteMany({ where: { email, expires: { gt: now } } });

      return true;
    });
  },
};

export default passwordResetService;


