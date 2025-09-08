import { prisma } from '@/db/client';
import { startOfDay } from 'date-fns';
import { analyticsService } from './analyticsService';

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: Date | null;
  lastResetDate: Date | null;
}

/**
 * Records a meaningful action for streak calculation
 * This can be called when user checks in or marks assignments as planned/done
 */
export async function recordMeaningfulAction(userId: string): Promise<StreakResult> {
  const today = startOfDay(new Date());

  // Check if user already has an action recorded today
  const existingCheckIn = await prisma.dailyCheckIn.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (existingCheckIn) {
    // Already recorded today, just return current streak
    const userStreak = await prisma.userStreak.findUnique({
      where: { userId },
    });

    return {
      currentStreak: userStreak?.currentStreak || 0,
      longestStreak: userStreak?.longestStreak || 0,
      lastCheckInDate: userStreak?.lastCheckInDate || null,
      lastResetDate: userStreak?.lastResetDate || null,
    };
  }

  // Get or create user streak record
  let userStreak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  if (!userStreak) {
    userStreak = await prisma.userStreak.create({
      data: { userId },
    });
  }

  // Calculate new streak
  let newStreak = 1; // Default for first action
  let lastResetDate = userStreak.lastResetDate;

  if (userStreak.lastCheckInDate) {
    const lastCheckIn = startOfDay(userStreak.lastCheckInDate);
    const daysDiff = Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      // Consecutive day - increment streak
      newStreak = userStreak.currentStreak + 1;
    } else if (daysDiff > 1) {
      // Gap in streak - reset to 1
      newStreak = 1;
      lastResetDate = today;
    }
    // If daysDiff === 0, it's the same day (shouldn't happen due to existing check-in check above)
  }

  // Create the daily check-in record
  await prisma.dailyCheckIn.create({
    data: {
      userId,
      date: today,
      streakCount: newStreak,
      lastResetDate,
    },
  });

  // Update user streak record
  const updatedUserStreak = await prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(userStreak.longestStreak, newStreak),
      lastCheckInDate: today,
      lastResetDate,
    },
  });

  // Track analytics event
  await analyticsService.track({
    event: 'streak_updated',
    userId,
    data: {
      currentStreak: newStreak,
      longestStreak: updatedUserStreak.longestStreak,
      streakIncreased: newStreak > userStreak.currentStreak,
      streakReset: !!lastResetDate && (!userStreak.lastResetDate || lastResetDate > userStreak.lastResetDate),
      trigger: 'assignment_action', // This is called from assignment updates
    },
  });

  return {
    currentStreak: updatedUserStreak.currentStreak,
    longestStreak: updatedUserStreak.longestStreak,
    lastCheckInDate: updatedUserStreak.lastCheckInDate,
    lastResetDate: updatedUserStreak.lastResetDate,
  };
}

/**
 * Get current streak information for a user
 */
export async function getCurrentStreak(userId: string): Promise<StreakResult> {
  const userStreak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  if (!userStreak) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCheckInDate: null,
      lastResetDate: null,
    };
  }

  return {
    currentStreak: userStreak.currentStreak,
    longestStreak: userStreak.longestStreak,
    lastCheckInDate: userStreak.lastCheckInDate,
    lastResetDate: userStreak.lastResetDate,
  };
}

/**
 * Check if user has already performed a meaningful action today
 */
export async function hasActionToday(userId: string): Promise<boolean> {
  const today = startOfDay(new Date());

  const existingCheckIn = await prisma.dailyCheckIn.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  return !!existingCheckIn;
}

/**
 * List recent daily check-ins for history rendering
 */
export async function listRecentDailyCheckIns(
  userId: string,
  days: number = 30
): Promise<Array<{ date: Date; streakCount: number }>> {
  const today = startOfDay(new Date());
  const from = new Date(today);
  from.setDate(today.getDate() - days);
  const rows = await prisma.dailyCheckIn.findMany({
    where: { userId, date: { gte: from } },
    orderBy: { date: 'desc' },
    take: days,
    select: { date: true, streakCount: true },
  });
  return rows;
}

export const streakService = {
  recordMeaningfulAction,
  getCurrentStreak,
  hasActionToday,
  listRecentDailyCheckIns,
};
