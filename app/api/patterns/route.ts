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
    const cascadeUser = await User.findOne({ email: session.user.email });
    if (!cascadeUser) return Response.json({ error: 'User not found' }, { status: 404 });

    const today = new Date().toISOString().split('T')[0];

    // Check if we already generated an insight today
    const existing = cascadeUser.insights?.find(i => i.date === today && !i.seen);
    if (existing) {
      return Response.json({ success: true, insight: existing });
    }

    // Fetch last 14 logs for pattern detection
    const logs = await DailyLog.find({ user: cascadeUser._id })
      .sort({ date: -1 })
      .limit(14);

    if (logs.length < 3) {
      return Response.json({ success: true, insight: null });
    }

    const userModel = {
      adherence:         mapToRecord(cascadeUser.userModel?.adherence as any),
      effectiveness:     mapToRecord(cascadeUser.userModel?.effectiveness as any),
      rcMultipliers:     mapToRecord(cascadeUser.userModel?.rcMultipliers as any),
      calibrationNeeded: cascadeUser.userModel?.calibrationNeeded ?? false,
    };

    const insight = detectPatterns(logs, userModel);
    if (!insight) {
      return Response.json({ success: true, insight: null });
    }

    // Store insight in user record
    if (!cascadeUser.insights) cascadeUser.insights = [];
    cascadeUser.insights.push({
      date:  today,
      type:  insight.type,
      title: insight.title,
      body:  insight.body,
      seen:  false,
    });
    // Keep only last 30 insights
    if (cascadeUser.insights.length > 30) {
      cascadeUser.insights = cascadeUser.insights.slice(-30);
    }
    await cascadeUser.save();

    return Response.json({ success: true, insight });
  } catch (err: any) {
    console.error('[CASCADE] patterns error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// Mark an insight as seen
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { date } = await req.json();
    await connectDB();
    const cascadeUser = await User.findOne({ email: session.user.email });
    if (!cascadeUser) return Response.json({ error: 'User not found' }, { status: 404 });

    const insight = cascadeUser.insights?.find(i => i.date === (date ?? new Date().toISOString().split('T')[0]));
    if (insight) insight.seen = true;
    await cascadeUser.save();

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
