export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { DailyLog } from '@/lib/models/DailyLog';
import { User } from '@/lib/models/User';
import { runFullAnalysis, EngineContext } from '@/lib/engine/engine';
import { mapToRecord } from '@/lib/userModelUtils';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      sleep, work, money, energy, attention, health, learning, relationships,
      resourceTime, resourceEnergy, resourceMoney, resourceAttention,
      environmentNoisy, mentallyOverloaded 
    } = body;

    // Basic validity check
    const states: Record<string, number> = { sleep, work, money, energy, attention, health, learning, relationships };
    for (const [key, val] of Object.entries(states)) {
      if (val === undefined || val < 1 || val > 10) {
        return Response.json({ error: `Invalid state for ${key}` }, { status: 400 });
      }
    }

    const resources = {
      time: resourceTime ?? 5,
      energy: resourceEnergy ?? 5,
      money: resourceMoney ?? 5,
      attention: resourceAttention ?? 5,
    };

    await connectDB();
    const dateStr = new Date().toISOString().split('T')[0];

    // 1. Resolve CASCADE user
    let cascadeUser = await User.findOne({ email: session.user.email });
    if (!cascadeUser) {
      cascadeUser = await User.create({
        email: session.user.email,
        name: session.user.name || '',
        profile: { rcMultipliers: {}, constraints: [] },
      });
    }
    const userId = cascadeUser._id.toString();

    // 2. Check for existing log today
    const existingLog = await DailyLog.findOne({ user: userId, date: dateStr });
    if (existingLog) {
      return Response.json({ error: 'Morning check-in already completed today' }, { status: 400 });
    }

    // 3. Load historical logs for ML layer + ignored count
    const recentLogs = await DailyLog.find({ user: userId }).sort({ date: -1 }).limit(14);
    const ignoredCount = recentLogs.slice(0, 3).filter(
      l => l.followUp.completed && l.followUp.feedback === 'ignored'
    ).length;

    // 4. Build userModel from Mongoose Map types
    const userModel = cascadeUser.userModel ? {
      adherence:         mapToRecord(cascadeUser.userModel.adherence as any),
      effectiveness:     mapToRecord(cascadeUser.userModel.effectiveness as any),
      rcMultipliers:     mapToRecord(cascadeUser.userModel.rcMultipliers as any),
      calibrationNeeded: cascadeUser.userModel.calibrationNeeded ?? false,
      lastCalibration:   cascadeUser.userModel.lastCalibration,
      successRate:       cascadeUser.userModel.successRate ?? 0.5,
      ignoreRate:        cascadeUser.userModel.ignoreRate ?? 0,
      avgOutcomeDelta:   cascadeUser.userModel.avgOutcomeDelta ?? 0,
      bandwidthPerformance: mapToRecord(cascadeUser.userModel.bandwidthPerformance as any),
    } : null;

    // 5. Run engine with adaptive context
    const context: EngineContext = {
      states,
      resources,
      ignoredRecommendationsCount: ignoredCount,
      rcMultipliers: mapToRecord(cascadeUser.profile.rcMultipliers as any),
      userModel,
      historicalLogs: recentLogs,
      policies: cascadeUser.policies || [],
      environmentNoisy: !!environmentNoisy,
      mentallyOverloaded: !!mentallyOverloaded,
    };

    const analysis = runFullAnalysis(context);

    // 6. Persist the daily log
    const log = await DailyLog.create({
      user: userId,
      date: dateStr,
      morningState: { 
        sleep, work, money, energy, attention, health, learning, relationships,
        cognitiveBandwidth: analysis.cognitiveBandwidth,
        sensoryLoad: analysis.sensoryLoad,
        executiveFriction: analysis.executiveFriction
      },
      resources,
      systemAnalysis: {
        bottleneck: analysis.bottleneck,
        leverageRatio: analysis.leverageRatio,
        adjustedLR: analysis.adjustedLR,
        mode: analysis.mode,
        loops: analysis.loops,
        recommendation: analysis.recommendation,
        isCounterintuitive: analysis.isCounterintuitive,
        adaptiveShift: analysis.adaptiveShift,
        systemMessage: analysis.systemMessage,
        successProbability: analysis.successProbability,
        systemConfidence: analysis.systemConfidence,
        insights: analysis.insights,
        decisions: analysis.decisions,
        dayType: analysis.dayType,
        activeRules: analysis.activeRules,
      },
    });

    // 7. Award XP + streak
    cascadeUser.gamification.xp += 20;
    cascadeUser.gamification.streaks += 1;
    await cascadeUser.save();

    // 8. Send notifications (fire-and-forget)
    const briefData = {
      userName: cascadeUser.name || session.user.name || 'Operator',
      userEmail: cascadeUser.email,
      bottleneck: analysis.bottleneck,
      mode: analysis.mode,
      action: analysis.recommendation.action,
      gain: analysis.recommendation.gain,
      cost: analysis.recommendation.cost,
      whyThis: analysis.recommendation.whyThis,
      loops: analysis.loops,
      confidenceLevel: analysis.recommendation.confidenceLevel,
      systemMessage: analysis.systemMessage,
      xp: cascadeUser.gamification.xp,
      streaks: cascadeUser.gamification.streaks,
      level: cascadeUser.gamification.level,
      adaptiveShift: analysis.adaptiveShift,
    };

    if (cascadeUser.notifications?.telegram && cascadeUser.notifications?.telegramChatId) {
      const { sendTelegramBrief } = await import('@/lib/notifications');
      sendTelegramBrief(briefData, cascadeUser.notifications.telegramChatId)
        .then(() => DailyLog.updateOne({ _id: log._id }, { 'notifications.telegramSent': true }).exec())
        .catch(err => console.error('[CASCADE] Telegram send failed:', err));
    }

    if (cascadeUser.notifications?.email && cascadeUser.email) {
      const { sendEmailBrief } = await import('@/lib/notifications');
      sendEmailBrief(briefData)
        .then(() => DailyLog.updateOne({ _id: log._id }, { 'notifications.emailSent': true }).exec())
        .catch(err => console.error('[CASCADE] Email send failed:', err));
    }

    return Response.json({ success: true, analysis: log.systemAnalysis });
  } catch (err: any) {
    console.error('[CASCADE] morning check-in error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
