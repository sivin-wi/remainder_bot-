import { Bot, InputFile } from 'grammy';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path'

const token = process.env.BOT_TOKEN;

// storage message ids;
const store = new Map<string, number[]>();
store.set('messages', []);

if (!token) throw new Error('BOT_TOKEN is not set');

export const bot = new Bot(token, {
  client: {
    // Reduce timeouts so we don't hang in serverless
    timeoutSeconds: 20,
  },
});

// file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
//

// logic – handle text messages via webhook
bot.on('message:text', async (ctx) => {
  const filePath = join(__dirname, '../public/output.webp')
  await ctx.reply('Remainder is running ✅');
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
  const current_hour = current_time.getUTCHours();

  // Check if current hour is 5 AM UTC or later
  if (current_hour >= 5) {
    // Calculate the start of the next day (00:00:00 UTC)
    const nextDay = new Date(
      Date.UTC(
        current_time.getUTCFullYear(),
        current_time.getUTCMonth(),
        current_time.getUTCDate() + 1, // next day
        0,
        0,
        0,
      ),
    );

    // Calculate difference in milliseconds
    const diffMs = nextDay.getTime() - current_time.getTime();

    // Use Math.ceil so if there are 7.2 hours left, it says "8 hours" (counting the current hour)
    const remaining_hours = Math.ceil(diffMs / (1000 * 60 * 60));

    const message_text: string = `⏰ Daily Reminder!\n\nRemaining time for today: *${remaining_hours} hours* left ⌛\n\nMake every second count! 💪`;

    // Race the sendMessage against a 15-second timeout
    try {
      const result = await Promise.race([
        bot.api.sendMessage(chatId, message_text, { parse_mode: 'Markdown' }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Telegram API timeout after 15s')), 15000),
        ),
      ]);

      // Add message ID to store
      const messages = store.get('messages') || [];
      messages.push(result.message_id);
      store.set('messages', messages);

      // console.log(`Sent message ${result.message_id}. Total stored: ${messages.length}`);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  } else {
    // Before 5 AM UTC → Delete all messages from the previous cycle
    const messages = store.get('messages') || [];
    if (messages.length > 0) {
      console.log(`Cleanup phase: Deleting ${messages.length} messages...`);
      for (const msgId of messages) {
        try {
          await bot.api.deleteMessage(chatId, msgId);
        } catch (err: any) {
          console.warn(`Could not delete message ${msgId}:`, err.message);
        }
      }
      // Clear the store
      store.set('messages', []);
    }
  }
}
