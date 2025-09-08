import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { trackEvent } from '@/services/analyticsService';
import { streakInterface } from '@/interfaces/streakInterface';

// Force this route to be dynamic since it uses authentication
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Perform study session via interface (service handles db)
    const summary = await streakInterface.recordStudySession(userId);

    // Track analytics event
    await trackEvent('study_completed', request, userId, {
      currentStreak: summary.currentStreak,
      longestStreak: summary.longestStreak,
      daysSinceLastStudied: summary.daysSinceLastStudied,
    });

    return NextResponse.json({
      success: true,
      message: 'Study session recorded successfully',
      streak: summary,
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
    const summary = await streakInterface.getSummary(session.user.id);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Get check-in status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
