export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { DailyLog } from '@/lib/models/DailyLog';
import { User } from '@/lib/models/User';
import { updateUserModel } from '@/lib/engine/adaptive';
import { mapToRecord } from '@/lib/userModelUtils';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sleep, energy, focus, stress, timeAvailable, health, social } = body;

    // Validate inputs
    const fields = { sleep, energy, focus, stress, time: timeAvailable, health, social };
    for (const [k, v] of Object.entries(fields)) {
      if (v === undefined || v < 1 || v > 10) {
        return Response.json({ error: `Invalid value for ${k}` }, { status: 400 });
      }
    }

    await connectDB();
    const dateStr = new Date().toISOString().split('T')[0];

    let cascadeUser = await User.findOne({ email: session.user.email });
    if (!cascadeUser) return Response.json({ error: 'User not found' }, { status: 404 });

    const log = await DailyLog.findOne({ user: cascadeUser._id, date: dateStr });
    if (!log) return Response.json({ error: 'No morning check-in found for today' }, { status: 400 });
    if (log.eveningState?.energy) return Response.json({ error: 'Evening check-in already completed' }, { status: 400 });

    // Compute outcomeDelta (evening - morning per domain)
    const morning = log.morningState;
    const outcomeDelta: Record<string, number> = {
      sleep:  sleep  - morning.sleep,
      energy: energy - morning.energy,
      focus:  focus  - morning.focus,
      stress: stress - morning.stress,  // note: lower stress is better, so negative delta = improvement
      time:   timeAvailable - morning.timeAvailable,
      health: health - morning.health,
      social: social - morning.social,
    };

    // Determine outcomeSuccess: did the bottleneck domain improve?
    const bn = log.systemAnalysis.bottleneck;
    const bnField = bn === 'time' ? 'time' : bn;
    let bnDelta = outcomeDelta[bnField] ?? 0;
    // For stress, improvement = negative delta (stress went down)
    if (bn === 'stress') bnDelta = -bnDelta;
    const outcomeSuccess = bnDelta >= 1;

    log.eveningState = { sleep, energy, focus, stress, timeAvailable, health, social };
    log.outcomeDelta = outcomeDelta as any;
    log.outcomeSuccess = outcomeSuccess;
    await log.save();

    // Calculate consecutive failures for calibration logic
    const recentLogs = await DailyLog.find({ user: cascadeUser._id })
      .sort({ date: -1 })
      .limit(5)
      .select('outcomeSuccess');
    let consecutiveFailures = 0;
    for (const l of recentLogs) {
      if ((l as any).outcomeSuccess === false) consecutiveFailures++;
      else break;
    }

    // Update userModel using adaptive engine
    const currentModel = {
      adherence:         mapToRecord(cascadeUser.userModel?.adherence as any),
      effectiveness:     mapToRecord(cascadeUser.userModel?.effectiveness as any),
      rcMultipliers:     mapToRecord(cascadeUser.userModel?.rcMultipliers as any),
      calibrationNeeded: cascadeUser.userModel?.calibrationNeeded ?? false,
      lastCalibration:   cascadeUser.userModel?.lastCalibration,
    };

    const updatedModel = updateUserModel(currentModel, log, consecutiveFailures);

    cascadeUser.userModel = {
      adherence:         updatedModel.adherence as any,
      effectiveness:     updatedModel.effectiveness as any,
      rcMultipliers:     updatedModel.rcMultipliers as any,
      calibrationNeeded: updatedModel.calibrationNeeded,
      lastCalibration:   updatedModel.lastCalibration,
    };

    // XP for completing evening check-in
    cascadeUser.gamification.xp += 15;
    await cascadeUser.save();

    return Response.json({
      success: true,
      outcomeDelta,
      outcomeSuccess,
      userModelUpdated: true,
    });
  } catch (err: any) {
    console.error('[CASCADE] evening check-in error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
