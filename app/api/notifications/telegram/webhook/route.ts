import { telegramPending } from '@/lib/telegramStore';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';

const TG = (token: string) => `https://api.telegram.org/bot${token}`;

async function sendMessage(chatId: string, text: string) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
  await fetch(`${TG(BOT_TOKEN)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
}

export async function POST(req: Request) {
  try {
    const update = await req.json();
    const msg = update?.message;
    if (!msg?.text) return Response.json({ ok: true });

    const text = msg.text.trim();
    const chatId = msg.chat.id.toString();

    const match = text.match(/^\/connect\s+(\d{6})$/i);
    if (!match) return Response.json({ ok: true });

    const token = match[1];
    const pending = telegramPending.get(token);

    if (!pending) {
      await sendMessage(chatId, '❌ *Invalid or expired token.* Generate a new one from the app.');
      return Response.json({ ok: true });
    }

    // Token is valid — immediately acknowledge in Telegram
    await sendMessage(chatId, '✅ *Token received!*\n\nGo and Verify Sync on the App to complete the link.');

    // Also store chat ID so poll can confirm and save immediately too
    try {
      await connectDB();
      const user = await User.findOne({ email: pending.userEmail });
      if (user) {
        user.notifications.telegram = true;
        user.notifications.telegramChatId = chatId;
        await user.save();
        telegramPending.delete(token);
        // Optionally send a follow-up after app verification
      }
    } catch (_) {}

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error('[CASCADE] Webhook error:', err);
    return Response.json({ ok: true }); // Always 200 to Telegram
  }
}
