import { startOfDay, differenceInCalendarDays, format } from "date-fns";
import { streakService } from "@/services/streakService";

export type StreakStatus = "active" | "at_risk" | "broken" | "inactive";

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  lastStudiedDate: Date | null;
  lastResetDate: Date | null;
  hasStudiedToday: boolean;
  streakStatus: StreakStatus;
  daysSinceLastStudied: number;
  recentCheckIns: Array<{ date: string; streakCount: number }>; // date: yyyy-MM-dd
}

async function getSummary(userId: string): Promise<StreakSummary> {
  const [streak, hasToday, recent] = await Promise.all([
    streakService.getCurrentStreak(userId),
    streakService.hasActionToday(userId),
    streakService.listRecentDailyCheckIns(userId, 30),
  ]);

  const today = startOfDay(new Date());
  const last = streak.lastCheckInDate ? startOfDay(streak.lastCheckInDate) : null;
  const daysSince = last ? differenceInCalendarDays(today, last) : 0;

  let status: StreakStatus = "inactive";
  if (last) {
    if (daysSince === 0 && hasToday) status = "active";
    else if (daysSince === 1) status = "at_risk";
    else if (daysSince > 1) status = "broken";
  }

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastStudiedDate: streak.lastCheckInDate,
    lastResetDate: streak.lastResetDate,
    hasStudiedToday: hasToday,
    streakStatus: status,
    daysSinceLastStudied: last ? daysSince : 0,
    recentCheckIns: recent.map((r) => ({
      date: format(r.date, "yyyy-MM-dd"),
      streakCount: r.streakCount,
    })),
  };
}

async function recordStudySession(userId: string): Promise<StreakSummary> {
  await streakService.recordMeaningfulAction(userId);
  return getSummary(userId);
}

export const streakInterface = {
  getSummary,
  recordStudySession,
};


