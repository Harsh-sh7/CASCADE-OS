export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { DailyLog } from '@/lib/models/DailyLog';
import { User } from '@/lib/models/User';
import { calculateGamification, GamificationEvent, GamificationState } from '@/lib/gamification';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { followedAction } = await req.json();
    await connectDB();
    const dateStr = new Date().toISOString().split('T')[0];

    const cascadeUser = await User.findOne({ email: session.user.email });
    if (!cascadeUser) return Response.json({ error: 'User not found' }, { status: 404 });

    const userId = cascadeUser._id.toString();
    const log = await DailyLog.findOne({ user: userId, date: dateStr });
    if (!log) return Response.json({ error: 'No active log for today' }, { status: 400 });
    if (log.followUp.completed) return Response.json({ error: 'Follow-up already completed today' }, { status: 400 });

    const isShameFreeLoop = !followedAction && (log.morningState.cognitiveBandwidth !== undefined && log.morningState.cognitiveBandwidth < 4);

    log.followUp.completed = true;
    log.followUp.feedback = followedAction ? 'followed' : (isShameFreeLoop ? 'EXECUTION_BLOCKED' : 'ignored');
    
    if (isShameFreeLoop && !log.feedback) {
       log.feedback = {
         rating: 'down',
         reason: 'EXECUTION_BLOCKED',
         submittedAt: new Date()
       }
    }
    await log.save();

    if (isShameFreeLoop) {
      // Do not apply penalties. Just return success.
      return Response.json({ success: true, message: "Blocked due to low capacity. Resetting load.", gamification: cascadeUser.gamification });
    }

    const recentLogs = await DailyLog.find({ user: userId }).sort({ date: -1 }).limit(3);
    const ignoredCount = recentLogs.filter(l => l.followUp.completed && l.followUp.feedback === 'ignored').length;

    const event: GamificationEvent = {
      type: 'FOLLOWUP',
      followedAction: !!followedAction,
      loopBroken: !!followedAction && log.systemAnalysis.loops.length > 0,
      correctPrediction: !!followedAction && log.systemAnalysis.recommendation?.confidenceLevel === 'HIGH',
      isCounterintuitive: !!followedAction && log.systemAnalysis.isCounterintuitive,
      ignoredCount,
    };

    const currentState: GamificationState = {
      xp: cascadeUser.gamification.xp,
      level: cascadeUser.gamification.level,
      streaks: cascadeUser.gamification.streaks,
      badges: cascadeUser.gamification.badges,
    };

    const nextState = calculateGamification(currentState, event);
    cascadeUser.gamification.xp = nextState.xp;
    cascadeUser.gamification.level = nextState.level;
    cascadeUser.gamification.streaks = nextState.streaks;
    cascadeUser.gamification.badges = nextState.badges;
    await cascadeUser.save();

    return Response.json({ success: true, gamification: nextState });
  } catch (err: any) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
