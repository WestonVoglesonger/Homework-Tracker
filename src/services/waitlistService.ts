import prisma from "@/db/client";

export interface WaitlistEntry {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  joinedAt: Date;
  convertedAt: Date | null;
  convertedBy: string | null;
}

export const waitlistService = {
  async getTotalUserCount(): Promise<number> {
    return await prisma.user.count({
      // Count only fully active, non-admin users
      where: { isAdmin: false, isWaitlisted: false }
    });
  },

  async isUserLimitReached(limit?: number): Promise<boolean> {
    const userCount = await this.getTotalUserCount();
    const maxUsers = limit || await this.getMaxUserLimit();
    return userCount >= maxUsers;
  },

  async getMaxUserLimit(): Promise<number> {
    try {
      const setting = await prisma.systemSettings.findUnique({
        where: { key: 'max_users' },
      });
      return setting ? parseInt(setting.value) : 50; // Default to 50 if not set
    } catch (error) {
      console.error('Error fetching max user limit:', error);
      return 50; // Fallback to default
    }
  },

  async setMaxUserLimit(limit: number, updatedBy: string): Promise<void> {
    const currentUserCount = await this.getTotalUserCount();
    if (limit < currentUserCount) {
      throw new Error(`Cannot set limit to ${limit}. Current user count is ${currentUserCount}.`);
    }

    await prisma.systemSettings.upsert({
      where: { key: 'max_users' },
      update: {
        value: limit.toString(),
        updatedBy,
        description: 'Maximum number of registered users allowed',
      },
      create: {
        key: 'max_users',
        value: limit.toString(),
        updatedBy,
        description: 'Maximum number of registered users allowed',
      },
    });
  },

  async addToWaitlist(userId: string, email: string, name?: string): Promise<WaitlistEntry> {
    return await prisma.waitlist.create({
      data: {
        userId,
        email,
        name,
      },
    });
  },

  async convertToFullUser(waitlistId: string, convertedBy: string): Promise<WaitlistEntry> {
    const now = new Date();

    // Update the waitlist entry
    const updatedWaitlist = await prisma.waitlist.update({
      where: { id: waitlistId },
      data: {
        convertedAt: now,
        convertedBy,
      },
    });

    // Update the user to no longer be waitlisted
    await prisma.user.update({
      where: { id: updatedWaitlist.userId },
      data: {
        isWaitlisted: false,
      },
    });

    return updatedWaitlist;
  },

  async convertAllToFullUsers(convertedBy: string): Promise<number> {
    const now = new Date();

    // Get all unconverted waitlist entries
    const unconvertedEntries = await prisma.waitlist.findMany({
      where: { convertedAt: null },
      select: { id: true, userId: true },
    });

    if (unconvertedEntries.length === 0) {
      return 0;
    }

    // Update all waitlist entries
    await prisma.waitlist.updateMany({
      where: { convertedAt: null },
      data: {
        convertedAt: now,
        convertedBy,
      },
    });

    // Update all users to no longer be waitlisted
    const userIds = unconvertedEntries.map(entry => entry.userId);
    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { isWaitlisted: false },
    });

    return unconvertedEntries.length;
  },

  async getWaitlistEntries(filters?: {
    converted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<WaitlistEntry[]> {
    const where: {
      convertedAt?: { not: null } | null;
    } = {};

    if (filters?.converted !== undefined) {
      where.convertedAt = filters.converted ? { not: null } : null;
    }

    return await prisma.waitlist.findMany({
      where,
      orderBy: { joinedAt: "desc" },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
    });
  },

  async getWaitlistEntryByUserId(userId: string): Promise<WaitlistEntry | null> {
    return await prisma.waitlist.findUnique({
      where: { userId },
    });
  },

  async getWaitlistStats(): Promise<{
    total: number;
    unconverted: number;
    converted: number;
    recentJoins: number;
  }> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, unconverted, converted, recentJoins] = await Promise.all([
      prisma.waitlist.count(),
      prisma.waitlist.count({ where: { convertedAt: null } }),
      prisma.waitlist.count({ where: { convertedAt: { not: null } } }),
      prisma.waitlist.count({ where: { joinedAt: { gte: weekAgo } } }),
    ]);

    return {
      total,
      unconverted,
      converted,
      recentJoins,
    };
  },

  async removeFromWaitlist(userId: string): Promise<void> {
    await prisma.waitlist.delete({
      where: { userId },
    });

    // Also update the user
    await prisma.user.update({
      where: { id: userId },
      data: { isWaitlisted: false },
    });
  },
};
