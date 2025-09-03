import prisma from "@/db/client";

// Email normalization utility - ensures case-insensitive email handling
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export const userService = {
  async findByEmail(email: string) {
    const normalizedEmail = normalizeEmail(email);
    return prisma.user.findUnique({ where: { email: normalizedEmail } });
  },
  async upsertByEmail(email: string, data: { passwordHash?: string; name?: string }) {
    const normalizedEmail = normalizeEmail(email);
    return prisma.user.upsert({
      where: { email: normalizedEmail },
      update: { passwordHash: data.passwordHash, name: data.name },
      create: { email: normalizedEmail, passwordHash: data.passwordHash, name: data.name },
    });
  },
};

export const userInterface = {
  async register(input: { email: string; password: string; name?: string | null }) {
    const { hash } = await import("bcryptjs");
    const normalizedEmail = normalizeEmail(input.email);
    const existing = await userService.findByEmail(normalizedEmail);
    if (existing?.passwordHash) {
      const error = new Error("Email already registered");
      (error as any).code = "EMAIL_EXISTS";
      throw error;
    }
    const passwordHash = await hash(input.password, 12);
    const user = await userService.upsertByEmail(normalizedEmail, { passwordHash, name: input.name ?? undefined });
    return { id: user.id, email: user.email, name: user.name } as const;
  },
};


