import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';
import { DailyLog } from '@/lib/models/DailyLog';
import { sendEmailBrief, sendTelegramBrief, DailyBriefData } from '@/lib/notifications';
import { runFullAnalysis, EngineContext } from '@/lib/engine/engine';
import { DomainNode } from '@/lib/engine/graph';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Secure the cron endpoint
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const nowUTC = new Date();
  const dateStr = nowUTC.toISOString().split('T')[0];

  // Find all users who have notifications enabled and haven't been sent today
  const users = await User.find({
    $or: [
      { 'notifications.email': true },
      { 'notifications.telegram': true },
    ],
  });

  let sent = 0;
  let errors = 0;

  for (const user of users) {
    try {
      let log = await DailyLog.findOne({ user: user._id, date: dateStr });

      // State decay if no check-in today
      let analysis: any;
      if (!log) {
        // Simulate neutral decay state
        const decayedStates = {
          sleep: 5,
          energy: 4,
          focus: 4,
          stress: 6, // stress increases slightly each unchecked day
          time: 5,
          workOutput: 4,
          health: 5,
          social: 4,
        };

        const context: EngineContext = {
          states: decayedStates as Record<DomainNode, number>,
          ignoredRecommendationsCount: 0,
          rcMultipliers: user.profile.rcMultipliers || {},
        };
        analysis = runFullAnalysis(context);
      } else {
        // Only send for logs that haven't been notified
        if (log.notifications.emailSent && log.notifications.telegramSent) continue;
        analysis = log.systemAnalysis;
      }

      const briefData: DailyBriefData = {
        userName: user.name || user.email.split('@')[0],
        userEmail: user.email,
        bottleneck: analysis.bottleneck || analysis.recommendation?.action || 'Unknown',
        mode: analysis.mode || 'FIX',
        action: analysis.recommendation?.action || 'Rest and recover.',
        gain: analysis.recommendation?.gain || [],
        cost: analysis.recommendation?.cost || [],
        whyThis: analysis.recommendation?.whyThis || '',
        loops: analysis.loops || [],
        confidenceLevel: analysis.recommendation?.confidenceLevel || 'LOW',
        systemMessage: analysis.systemMessage || 'Your system is running.',
        xp: user.gamification.xp,
        streaks: user.gamification.streaks,
        level: user.gamification.level,
        adaptiveShift: analysis.adaptiveShift || false,
      };

      if (user.notifications.email) {
        await sendEmailBrief(briefData);
        if (log) {
          log.notifications.emailSent = true;
          await log.save();
        }
      }

      if (user.notifications.telegram && user.notifications.telegramChatId) {
        await sendTelegramBrief(briefData, user.notifications.telegramChatId);
        if (log) {
          log.notifications.telegramSent = true;
          await log.save();
        }
      }

      sent++;
    } catch (err) {
      console.error(`Failed for user ${user._id}:`, err);
      errors++;
    }
  }

  return Response.json({ success: true, sent, errors, timestamp: nowUTC.toISOString() });
}
