import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { DailyLog } from '@/lib/models/DailyLog';
import { User } from '@/lib/models/User';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rating, reason } = await req.json();
    if (!['up', 'down'].includes(rating)) {
      return Response.json({ error: 'Rating must be "up" or "down"' }, { status: 400 });
    }

    await connectDB();
    const dateStr = new Date().toISOString().split('T')[0];

    const cascadeUser = await User.findOne({ email: session.user.email });
    if (!cascadeUser) return Response.json({ error: 'User not found' }, { status: 404 });

    const log = await DailyLog.findOne({ user: cascadeUser._id, date: dateStr });
    if (!log) return Response.json({ error: 'No log found for today' }, { status: 404 });

    // Store feedback
    log.feedback = { rating, reason: reason || undefined, submittedAt: new Date() };
    await log.save();

    // Award XP for rating quality (up = system was right)
    if (rating === 'up') {
      cascadeUser.gamification.xp += 10;
      await cascadeUser.save();
    }

    return Response.json({ success: true, feedback: log.feedback });
  } catch (err: any) {
    console.error('[CASCADE] feedback error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
