import { Bot } from 'grammy';
import 'dotenv/config';

const token = process.env.BOT_TOKEN;

if (!token) throw new Error('BOT_TOKEN is not set');

export const bot = new Bot(token, {
  client: {
    // Reduce timeouts so we don't hang in serverless
    timeoutSeconds: 20,
  },
});

// logic – handle text messages via webhook
bot.on('message:text', async (ctx) => {
  await ctx.reply('Remainder bot is running');
  await ctx.react("🫡");
  await ctx.react("❤‍🔥")
});

export async function main() {
  const chatId = process.env.CHAT_ID;
  if (!chatId) {
    console.error('CHAT_ID is not set');
    return;
  }

  // Get the current time (UTC — Vercel runs in UTC)
  const current_time: Date = new Date();

  if (current_time.getUTCHours() >= 5) {
    // Calculate the remaining time until end of UTC day
    const endOfDay = new Date(
      Date.UTC(
        current_time.getUTCFullYear(),
        current_time.getUTCMonth(),
        current_time.getUTCDate(),
        23,
        59,
        59,
      ),
    );
    const remaining_time: number = (endOfDay.getTime() - current_time.getTime()) / 1000;
    const remaining_hours: number = Math.floor(remaining_time / 3600);
    const remaining_minutes: number = Math.floor((remaining_time % 3600) / 60);
    const remaining_seconds: number = Math.floor(remaining_time % 60);

    const message_text: string = `⏰ Daily Reminder!\n\nRemaining time for today: *${remaining_hours}h ${remaining_minutes}m ${remaining_seconds}s* ⌛\n\nMake every second count! 💪`;

    // Race the sendMessage against a 15-second timeout
    await Promise.race([
      bot.api.sendMessage(chatId, message_text, { parse_mode: 'Markdown' }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Telegram API timeout after 15s')), 15000),
      ),
    ]);
  }
  // Before hour 5 UTC → silently skip
}