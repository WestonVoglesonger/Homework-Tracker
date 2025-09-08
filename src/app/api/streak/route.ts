import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/db/client';
import { startOfDay, subDays, format } from 'date-fns';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const today = startOfDay(new Date());

    // Get current streak info
    const userStreak = await prisma.userStreak.findUnique({
      where: { userId },
    });

    // Check if already checked in today
    const todaysCheckIn = await prisma.dailyCheckIn.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    // Get recent check-ins for streak history (last 30 days)
    const thirtyDaysAgo = startOfDay(subDays(today, 30));
    const recentCheckIns = await prisma.dailyCheckIn.findMany({
      where: {
        userId,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 30,
    });

    // Calculate streak status
    let streakStatus = 'inactive';
    let daysSinceLastCheckIn = 0;

    if (userStreak?.lastCheckInDate) {
      const lastCheckIn = startOfDay(userStreak.lastCheckInDate);
      daysSinceLastCheckIn = Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastCheckIn === 0 && todaysCheckIn) {
        streakStatus = 'active'; // Checked in today
      } else if (daysSinceLastCheckIn === 1) {
        streakStatus = 'at_risk'; // Missed yesterday, streak at risk
      } else if (daysSinceLastCheckIn > 1) {
        streakStatus = 'broken'; // Streak is broken
      }
    }

    return NextResponse.json({
      currentStreak: userStreak?.currentStreak || 0,
      longestStreak: userStreak?.longestStreak || 0,
      lastStudiedDate: userStreak?.lastCheckInDate,
      lastResetDate: userStreak?.lastResetDate,
      hasStudiedToday: !!todaysCheckIn,
      streakStatus,
      daysSinceLastStudied: daysSinceLastCheckIn,
      recentCheckIns: recentCheckIns.map(checkIn => ({
        date: format(checkIn.date, 'yyyy-MM-dd'),
        streakCount: checkIn.streakCount,
      })),
    });

  } catch (error) {
    console.error('Get streak data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
