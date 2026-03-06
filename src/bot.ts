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

// file path -> older version nodejs 
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

  // 1. Get current time in Indian Standard Time (IST)
  const now = new Date();
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const istHour = istDate.getHours();

  // 2. Logic: Reminders run from 10 AM IST to Midnight IST
  if (istHour >= 4) {
    // Target is Midnight tonight in IST
    const midnight = new Date(istDate);
    midnight.setHours(24, 0, 0, 0);

    const diffMs = midnight.getTime() - istDate.getTime();
    const remaining_hours = Math.ceil(diffMs / (1000 * 60 * 60));

    const message_text: string = `⏰ Daily Reminder!\n\nRemaining time for today: *${remaining_hours} hours* left ⌛\n\nMake every second count! 💪 Day: ${istDate.toLocaleString()}`;

    try {
      // Delete the previous reminder if it exists to keep the chat clean
      const messages = store.get('messages') || [];
      // const previousMsgId = messages.pop();
      if (Array.isArray(messages) && messages.length) {
        try {
          await bot.api.deleteMessages(chatId, messages);
        } catch (err) {
          // Ignore if message already deleted or too old
        }
      }

      // Race the sendMessage against a 15-second timeout
      // file path
      const filePath = path.join(__dirname,'../public/output.webp')
      const result = await Promise.race([
        bot.api.sendMessage(chatId, message_text, { parse_mode: 'Markdown' }),
        bot.api.sendSticker(chatId,new InputFile(filePath),{protect_content: true}),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Telegram API timeout after 15s')), 15000),
        ),
      ]);

      // Add new message ID to store
      messages.push(result.message_id);
      store.set('messages', messages);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  } else {
    // 3. Cleanup phase: Delete remaining messages from the previous day (runs before 10 AM IST)
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
