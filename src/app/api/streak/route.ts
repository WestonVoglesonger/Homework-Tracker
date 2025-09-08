import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { streakInterface } from '@/interfaces/streakInterface';

// Force this route to be dynamic since it uses authentication
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const summary = await streakInterface.getSummary(session.user.id);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Get streak data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
