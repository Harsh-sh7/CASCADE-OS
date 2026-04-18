import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';

// In-memory verification store (same in-process memory as connect route)
// In production use Redis
const pendingVerifications = new Map<string, { userId: string; token: string }>();

export async function POST(req: Request) {
  try {
    const { token, telegramChatId } = await req.json();
    if (!token || !telegramChatId) {
      return Response.json({ error: 'Missing token or telegramChatId' }, { status: 400 });
    }

    await connectDB();

    // Find the pending verification matching this token
    let matchedUserId: string | null = null;
    const entry = Array.from(pendingVerifications.entries()).find(([, data]) => data.token === token);
    if (entry) matchedUserId = entry[0];

    if (!matchedUserId) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const user = await User.findById(matchedUserId);
    if (!user) throw new Error('User not found');

    user.notifications.telegram = true;
    user.notifications.telegramChatId = telegramChatId;
    await user.save();

    pendingVerifications.delete(matchedUserId);

    return Response.json({ success: true, message: 'Telegram connected successfully.' });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
