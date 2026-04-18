import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';
import { telegramPending } from '@/lib/telegramStore';

const TG = (token: string) => `https://api.telegram.org/bot${token}`;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      return Response.json({ error: 'Telegram bot token not configured' }, { status: 500 });
    }

    // Step 1: Delete any existing webhook so getUpdates works
    const deleteRes = await fetch(`${TG(BOT_TOKEN)}/deleteWebhook?drop_pending_updates=false`);
    const deleteData = await deleteRes.json();
    console.log('[CASCADE] deleteWebhook:', deleteData);

    // Step 2: Get recent updates — use offset=-100 to always get the most recent 100
    const updatesRes = await fetch(`${TG(BOT_TOKEN)}/getUpdates?limit=100&timeout=0&offset=-100`);
    const updatesData = await updatesRes.json();

    if (!updatesData.ok) {
      return Response.json({
        error: 'Telegram API error: ' + updatesData.description,
      }, { status: 500 });
    }

    const updates: any[] = updatesData.result || [];
    console.log('[CASCADE] Total updates received:', updates.length);

    // Step 3: Find most recent /connect TOKEN command matching a pending token for this user
    // Process in reverse so newest commands win
    for (const update of [...updates].reverse()) {
      const msg = update.message;
      if (!msg?.text) continue;

      const text = msg.text.trim();
      const chatId = msg.chat.id.toString();

      const match = text.match(/^\/connect\s+(\d{6})$/i);
      if (!match) continue;

      const token = match[1];
      console.log('[CASCADE] Found /connect command with token:', token);

      const pending = telegramPending.get(token);
      if (!pending) {
        console.log('[CASCADE] Token not in pending store:', token, 'Store:', Array.from(telegramPending.keys()));
        continue;
      }

      // Only allow the currently signed-in user to claim their own token
      if (pending.userEmail !== session.user.email) continue;

      // Save chat ID to user
      await connectDB();
      const user = await User.findOne({ email: pending.userEmail });
      if (!user) continue;

      user.notifications.telegram = true;
      user.notifications.telegramChatId = chatId;
      await user.save();

      telegramPending.delete(token);

      // Send welcome message to user
      await fetch(`${TG(BOT_TOKEN)}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ *CASCADE OS Connected*\n\nYour Telegram is now linked.\nYou will receive your daily system brief here every morning.`,
          parse_mode: 'Markdown',
        }),
      });

      return Response.json({
        success: true,
        chatId,
        message: 'Telegram account linked successfully.',
      });
    }

    // If we get here, no matching token was found yet
    return Response.json({
      success: false,
      message: 'No matching /connect command found. Make sure you sent it to the bot.',
      updatesChecked: updates.length,
    });
  } catch (err: any) {
    console.error('[CASCADE] Telegram poll error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
