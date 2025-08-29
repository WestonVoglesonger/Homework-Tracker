import prisma from "@/db/client";

export const userService = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  async upsertByEmail(email: string, data: { passwordHash?: string; name?: string }) {
    return prisma.user.upsert({
      where: { email },
      update: { passwordHash: data.passwordHash, name: data.name },
      create: { email, passwordHash: data.passwordHash, name: data.name },
    });
  },
};

export const userInterface = {
  async register(input: { email: string; password: string; name?: string | null }) {
    const { hash } = await import("bcryptjs");
    const existing = await userService.findByEmail(input.email);
    if (existing?.passwordHash) throw new Error("Email already registered");
    const passwordHash = await hash(input.password, 12);
    const user = await userService.upsertByEmail(input.email, { passwordHash, name: input.name ?? undefined });
    return { id: user.id, email: user.email, name: user.name } as const;
  },
};


