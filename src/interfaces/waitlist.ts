import { waitlistService, type WaitlistEntry } from "@/services/waitlistService";
import { adminService } from "@/services/adminService";
import { emailService } from "@/services/emailService";

export const waitlistInterface = {
  async checkUserLimit(limit?: number): Promise<boolean> {
    const max = limit ?? await waitlistService.getMaxUserLimit();
    const count = await waitlistService.getTotalUserCount();
    return count >= max;
  },

  async registerWaitlistedUser(input: {
    userId: string;
    email: string;
    name?: string;
  }): Promise<WaitlistEntry> {
    // Add to waitlist
    const waitlistEntry = await waitlistService.addToWaitlist(
      input.userId,
      input.email,
      input.name
    );

    // Update user as waitlisted
    await this.updateUserWaitlistStatus(input.userId, true);

    // Send welcome email
    try {
      await emailService.sendWaitlistWelcomeEmail(input.email, input.name);
    } catch (error) {
      console.error("Failed to send waitlist welcome email:", error);
      // Don't fail the registration if email fails
    }

    return waitlistEntry;
  },

  async convertToFullUser(adminUserId: string, waitlistId: string): Promise<WaitlistEntry> {
    // Verify admin permissions
    const isAdmin = await adminService.isAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Convert the user
    const updatedEntry = await waitlistService.convertToFullUser(waitlistId, adminUserId);

    // Send conversion email
    try {
      const user = await this.getUserByWaitlistId(waitlistId);
      if (user?.email) {
        await emailService.sendWaitlistConversionEmail(user.email, user.name);
      }
    } catch (error) {
      console.error("Failed to send conversion email:", error);
      // Don't fail the conversion if email fails
    }

    // Log admin action
    await adminService.logAdminAction({
      action: "waitlist_convert",
      targetId: waitlistId,
      targetType: "waitlist",
      data: { convertedBy: adminUserId },
      adminId: adminUserId,
    });

    return updatedEntry;
  },

  async convertAllToFullUsers(adminUserId: string): Promise<number> {
    // Verify admin permissions
    const isAdmin = await adminService.isAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Convert all users
    const convertedCount = await waitlistService.convertAllToFullUsers(adminUserId);

    // Log admin action
    await adminService.logAdminAction({
      action: "waitlist_convert_all",
      targetType: "waitlist",
      data: { convertedCount, convertedBy: adminUserId },
      adminId: adminUserId,
    });

    return convertedCount;
  },

  async getWaitlistEntries(adminUserId: string, filters?: {
    converted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<WaitlistEntry[]> {
    // Verify admin permissions
    const isAdmin = await adminService.isAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await waitlistService.getWaitlistEntries(filters);
  },

  async getWaitlistStats(adminUserId: string): Promise<{
    total: number;
    unconverted: number;
    converted: number;
    recentJoins: number;
  }> {
    // Verify admin permissions
    const isAdmin = await adminService.isAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await waitlistService.getWaitlistStats();
  },

  async getUserWaitlistStatus(userId: string): Promise<WaitlistEntry | null> {
    return await waitlistService.getWaitlistEntryByUserId(userId);
  },

  async updateUserWaitlistStatus(userId: string, isWaitlisted: boolean): Promise<void> {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isWaitlisted },
      });
    } finally {
      await prisma.$disconnect();
    }
  },

  async getUserByWaitlistId(waitlistId: string): Promise<{ email: string; name?: string } | null> {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    try {
      const waitlist = await prisma.waitlist.findUnique({
        where: { id: waitlistId },
        select: { email: true, name: true },
      });

      // Transform null to undefined for compatibility
      return waitlist ? {
        email: waitlist.email,
        name: waitlist.name || undefined,
      } : null;
    } finally {
      await prisma.$disconnect();
    }
  },
};
