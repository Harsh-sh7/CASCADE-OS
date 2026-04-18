import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';
import { DailyLog } from '@/lib/models/DailyLog';
import { generateWeeklyReport } from '@/lib/reports/weekly';
import { mapToRecord } from '@/lib/userModelUtils';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
  try {
    // Verify cron secret
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const users = await User.find({
      $or: [{ 'notifications.email': true }, { 'notifications.telegram': true }],
    });

    const results = [];

    for (const user of users) {
      try {
        const logs = await DailyLog.find({ user: user._id })
          .sort({ date: -1 })
          .limit(7);

        if (logs.length < 3) {
          results.push({ email: user.email, status: 'skipped', reason: 'insufficient logs' });
          continue;
        }

        const userModel = {
          adherence:         mapToRecord(user.userModel?.adherence as any),
          effectiveness:     mapToRecord(user.userModel?.effectiveness as any),
          rcMultipliers:     mapToRecord(user.userModel?.rcMultipliers as any),
          calibrationNeeded: user.userModel?.calibrationNeeded ?? false,
        };

        const report = generateWeeklyReport(logs, userModel);

        // Send email
        if (user.notifications.email && user.email) {
          await resend.emails.send({
            from: process.env.EMAIL_FROM!,
            to: user.email,
            subject: `CASCADE OS — Weekly Report (${report.systemTrend})`,
            html: report.html,
          });
        }

        // Send Telegram
        if (user.notifications.telegram && user.notifications.telegramChatId) {
          const BOT = process.env.TELEGRAM_BOT_TOKEN;
          await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: user.notifications.telegramChatId,
              text: report.text,
              parse_mode: 'Markdown',
            }),
          });
        }

        results.push({ email: user.email, status: 'sent', trend: report.systemTrend });
      } catch (userErr: any) {
        results.push({ email: user.email, status: 'error', error: userErr.message });
      }
    }

    return Response.json({ success: true, processed: results.length, results });
  } catch (err: any) {
    console.error('[CASCADE] weekly report cron error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
