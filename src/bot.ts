import { Bot, InputFile } from 'grammy';
import 'dotenv/config';
import path from 'node:path';

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
  const filePath = path.resolve(import.meta.dirname,'../public/output.webp');
  await ctx.reply('Remainder is running ✅');
  await ctx.react("🫡");
  await ctx.react("❤‍🔥");
  await ctx.replyWithSticker(new InputFile(filePath));
});

export async function main() {
  const chatId = process.env.CHAT_ID;
  if (!chatId) {
    console.error('CHAT_ID is not set');
    return;
  }

  // Get the current time (UTC — Vercel runs in UTC)
  const current_time: Date = new Date();

  // Check if current hour is 5 AM UTC or later
  if (current_time.getUTCHours() >= 5) {
    // Calculate the end of the current day (23:59:59 UTC)
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

    // Calculate difference in milliseconds
    const diffMs = endOfDay.getTime() - current_time.getTime();
    
    // Convert milliseconds to hours (Math.floor rounds down)
    const remaining_hours = Math.floor(diffMs / (1000 * 60 * 60));

    const message_text: string = `⏰ Daily Reminder!\n\nRemaining time for today: *${remaining_hours} hours* left ⌛\n\nMake every second count! 💪`;

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