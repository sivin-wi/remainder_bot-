import 'dotenv/config';
import cron from 'node-cron';
import { main, bot } from './bot.js';

console.log('Starting Habit Reminder Bot...');

// app.post('/webhook', webhookCallback(bot, 'express')); // serverless

// ── Daily reminder cron job ───────────────────────────────────────────────────
// Runs every day at 8:00 AM IST (2:30 AM UTC)
// Change the time here if needed: 'minute hour * * *'
cron.schedule('30 2 * * *', async () => {
   console.log(`[${new Date().toISOString()}] Running daily reminder...`);
   try {
      await main();
      console.log('Daily reminder sent successfully.');
   } catch (error: any) {
      console.error('Cron error:', error.message);
   }
}, { timezone: 'UTC' });

// ── Start bot with long polling ───────────────────────────────────────────────
// Long polling: bot continuously asks Telegram for new messages
// This works perfectly on Railway (persistent container)
bot.start({
   onStart: () => console.log('Bot is running with long polling ✅'),
});