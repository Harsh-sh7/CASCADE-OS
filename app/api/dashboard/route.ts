import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { DailyLog } from '@/lib/models/DailyLog';
import { User } from '@/lib/models/User';
import { detectPatterns } from '@/lib/engine/patterns';
import { mapToRecord } from '@/lib/userModelUtils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const dateStr = new Date().toISOString().split('T')[0];

    const cascadeUser = await User.findOne({ email: session.user.email }).select('gamification notifications userModel insights subscription');
    if (!cascadeUser) return Response.json({ error: 'User not found' }, { status: 404 });

    const userId = cascadeUser._id.toString();
    const log = await DailyLog.findOne({ user: userId, date: dateStr });

    // Pattern insight: check if one exists for today, otherwise detect
    let patternInsight = null;
    const existingInsight = cascadeUser.insights?.find((i: any) => i.date === dateStr && !i.seen);
    if (existingInsight) {
      patternInsight = existingInsight;
    } else {
      const recentLogs = await DailyLog.find({ user: userId }).sort({ date: -1 }).limit(14);
      if (recentLogs.length >= 3) {
        const userModel = {
          adherence:         mapToRecord(cascadeUser.userModel?.adherence as any),
          effectiveness:     mapToRecord(cascadeUser.userModel?.effectiveness as any),
          rcMultipliers:     mapToRecord(cascadeUser.userModel?.rcMultipliers as any),
          calibrationNeeded: cascadeUser.userModel?.calibrationNeeded ?? false,
        };
        patternInsight = detectPatterns(recentLogs, userModel);
      }
    }

    return Response.json({
      success: true,
      hasActiveLog: !!log,
      log: log || null,
      gamification: cascadeUser.gamification,
      plan: cascadeUser.subscription?.plan || 'FREE',
      patternInsight,
    });
  } catch (err: any) {
    console.error('[CASCADE] dashboard error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
