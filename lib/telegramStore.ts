// Shared in-memory store for pending Telegram verifications
// Populated by /api/notifications/telegram/connect
// Read by /api/notifications/telegram/poll and /api/telegram/webhook

declare global {
  var _telegramPending: Map<string, { userEmail: string; token: string; createdAt: number }>;
}

if (!global._telegramPending) {
  global._telegramPending = new Map();
}

export const telegramPending = global._telegramPending;
