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
  async upsertByEmail(
    email: string,
    data: { passwordHash?: string; name?: string; termsAcceptedAt?: Date; privacyAcceptedAt?: Date }
  ) {
    const normalizedEmail = normalizeEmail(email);
    return prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        passwordHash: data.passwordHash,
        name: data.name,
        termsAcceptedAt: data.termsAcceptedAt ?? undefined,
        privacyAcceptedAt: data.privacyAcceptedAt ?? undefined,
      },
      create: {
        email: normalizedEmail,
        passwordHash: data.passwordHash,
        name: data.name,
        termsAcceptedAt: data.termsAcceptedAt ?? undefined,
        privacyAcceptedAt: data.privacyAcceptedAt ?? undefined,
      },
    });
  },
};

export type UserPreferences = {
  canvasSetupDismissed: boolean;
};

export const userInterface = {
  async register(input: { email: string; password: string; name?: string | null; termsAcceptedAt?: Date; privacyAcceptedAt?: Date }) {
    const { hash } = await import("bcryptjs");
    const normalizedEmail = normalizeEmail(input.email);
    const existing = await userService.findByEmail(normalizedEmail);
    if (existing?.passwordHash) {
      const error = new Error("Email already registered");
      (error as unknown as { code?: string }).code = "EMAIL_EXISTS";
      throw error;
    }
    const passwordHash = await hash(input.password, 12);
    const user = await userService.upsertByEmail(normalizedEmail, {
      passwordHash,
      name: input.name ?? undefined,
      termsAcceptedAt: input.termsAcceptedAt,
      privacyAcceptedAt: input.privacyAcceptedAt,
    });
    return { id: user.id, email: user.email, name: user.name } as const;
  },

  async getPreferences(userId: string): Promise<UserPreferences> {
    const { userPreferenceService } = await import("@/services/userPreferenceService");
    return userPreferenceService.get(userId);
  },

  async updatePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const { userPreferenceService } = await import("@/services/userPreferenceService");
    return userPreferenceService.update(userId, prefs);
  },

  async findByEmail(email: string) {
    const { userService } = await import("./user");
    return userService.findByEmail(email);
  },
};


