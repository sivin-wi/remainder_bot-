import 'dotenv/config';
import cron from 'node-cron';
import { main, bot } from './bot.js';

// ── Webhook for serverless ────────────────────────────────────────────────────
// // serverless
// import { webhookCallback } from 'grammy'; 

// app.post('/webhook', webhookCallback(bot, 'express')); // serverless

// ── Daily reminder cron job ───────────────────────────────────────────────────
cron.schedule('0 * * * *', async () => {
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