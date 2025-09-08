import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/db/client';
import { startOfDay } from 'date-fns';
import { trackEvent } from '@/services/analyticsService';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const today = startOfDay(new Date());

    // Check if user already checked in today
    const existingCheckIn = await prisma.dailyCheckIn.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (existingCheckIn) {
      return NextResponse.json({
        success: false,
        message: 'Already checked in today',
        checkIn: existingCheckIn
      });
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
    let newStreak = 1; // Default for first check-in
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
    const checkIn = await prisma.dailyCheckIn.create({
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
    await trackEvent('checkin_completed', request, userId, {
      streakCount: newStreak,
      longestStreak: updatedUserStreak.longestStreak,
      wasFirstCheckIn: userStreak.currentStreak === 0,
      daysSinceLastCheckIn: userStreak.lastCheckInDate
        ? Math.floor((today.getTime() - userStreak.lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    });

    return NextResponse.json({
      success: true,
      message: 'Study session recorded successfully',
      checkIn,
      streak: {
        ...updatedUserStreak,
        lastStudiedDate: updatedUserStreak.lastCheckInDate,
      },
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    return NextResponse.json({
      streak: userStreak || {
        currentStreak: 0,
        longestStreak: 0,
        lastCheckInDate: null,
        lastResetDate: null,
      },
      todaysCheckIn: todaysCheckIn || null,
      hasCheckedInToday: !!todaysCheckIn,
    });

  } catch (error) {
    console.error('Get check-in status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
