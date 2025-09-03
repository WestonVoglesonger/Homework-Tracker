import prisma from "@/db/client";

export type UserPreferences = {
  canvasSetupDismissed: boolean;
};

export const userPreferenceService = {
  async get(userId: string): Promise<UserPreferences> {
    try {
      const user = (await prisma.user.findUnique({
        where: { id: userId },
      })) as any;
      return { canvasSetupDismissed: user?.canvasSetupDismissed ?? false };
    } catch (error: any) {
      // If column doesn't exist (migration not applied), default to false
      return { canvasSetupDismissed: false };
    }
  },

  async update(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      if (typeof prefs.canvasSetupDismissed === "boolean") {
        // Use raw SQL to avoid TS/type coupling before migration is applied
        await prisma.$executeRaw`UPDATE "User" SET "canvasSetupDismissed" = ${prefs.canvasSetupDismissed} WHERE id = ${userId}`;
        return { canvasSetupDismissed: prefs.canvasSetupDismissed };
      }
      const current = await prisma.user.findUnique({ where: { id: userId } });
      return { canvasSetupDismissed: (current as any)?.canvasSetupDismissed ?? false };
    } catch (error: any) {
      // If update fails (e.g., column missing), return default and let caller handle UI fallback
      return { canvasSetupDismissed: false };
    }
  },
};


