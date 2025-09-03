import { createHash, randomBytes } from "crypto";
import { prisma } from "../db/client";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export interface CreateVerificationTokenOptions {
  ttlMinutes?: number;
}

export const verificationService = {
  async createToken(email: string, options?: CreateVerificationTokenOptions): Promise<{ token: string; expiresAt: Date }> {
    const ttlMinutes = options?.ttlMinutes ?? 60 * 24; // default 24h
    const token = randomBytes(32).toString("hex");
    const tokenHash = sha256Hex(token);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
    const normalizedEmail = email.toLowerCase().trim();

    // Store hashed token in VerificationToken table
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: tokenHash,
        expires: expiresAt,
      },
    });

    return { token, expiresAt };
  },

  async consumeToken(email: string, token: string): Promise<boolean> {
    const now = new Date();
    const tokenHash = sha256Hex(token);
    const normalizedEmail = email.toLowerCase().trim();

    return await prisma.$transaction(async tx => {
      const record = await tx.verificationToken.findFirst({ where: { identifier: normalizedEmail, token: tokenHash } });
      if (!record) return false;

      if (record.expires <= now) {
        await tx.verificationToken.deleteMany({ where: { identifier: normalizedEmail, token: tokenHash } });
        return false;
      }

      const user = await tx.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        await tx.verificationToken.deleteMany({ where: { identifier: normalizedEmail, token: tokenHash } });
        return false;
      }

      await tx.user.update({ where: { id: user.id }, data: { emailVerified: now } });
      // Invalidate all verification tokens for this email
      await tx.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });
      return true;
    });
  },
};

export default verificationService;


