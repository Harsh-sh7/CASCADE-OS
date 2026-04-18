import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { telegramPending } from '@/lib/telegramStore';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a 6-digit verification token
    const token = crypto.randomInt(100000, 999999).toString();

    // Clear any existing pending verification for this user
    for (const [key, val] of Array.from(telegramPending.entries())) {
      if (val.userEmail === session.user.email) {
        telegramPending.delete(key);
      }
    }

    telegramPending.set(token, {
      userEmail: session.user.email,
      token,
      createdAt: Date.now(),
    });

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'your_cascade_bot';
    return Response.json({
      success: true,
      token,
      message: `Send /connect ${token} to @${botUsername} on Telegram.`,
      botUsername,
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
