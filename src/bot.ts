import { Bot, InputFile } from 'grammy';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path'

const token = process.env.BOT_TOKEN;

if (!token) throw new Error('BOT_TOKEN is not set');

// storage message ids;
const store = new Map<string, Array<number>>();
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

// delete message
async function deleteMessage() {
  console.log("called the delete message... fn()")
  const messagesIdArray = store.get('messages') || []
  // first send message
  const messageId = (await bot.api.sendMessage(process.env.CHAT_ID!, "Deleting in 6 seconds [■□□□□□]"))?.message_id;
  console.log('store >>>>>', store)
  // count
  let count=6;
  // progress frames
  const frames = [
    "Deleting in 5 seconds [■□□□□]",
    "Deleting in 4 seconds [■■□□□]",
    "Deleting in 3 seconds [■■■□□]",
    "Deleting in 2 seconds [■■■■□]",
    "Deleting in 1 seconds [■■■■■]",
    "🚮 Deleted."
  ];

  for (const frame of frames) {
    await new Promise((res) => setTimeout(res, 800));
    try {
      await bot.api.editMessageText( // sent message editing in each iteration.
        process.env.CHAT_ID!,
        messageId,
        frame,
        { parse_mode: "HTML" }
      )
    } catch (err) {
      console.log(err)
    }
    // final auto-delete
    await new Promise((res) => setTimeout(res, 1000));
    count--;
    if (count === 0 && messagesIdArray.length > 0) {
    try {
      const s = await bot.api.deleteMessages(process.env.CHAT_ID!, messagesIdArray)
      store.clear()
      console.log(s, store.values())
    } catch (err) {
      console.log(err)
    }
  }
  }

  
}

// // logic – handle text messages (skip commands so /delete etc. still work)
// bot.on('message:text', async (ctx) => {
//   // If it's a command, let the command handlers deal with it
//   if (ctx.message.text.startsWith('/')) return;

//   await main()
// });



// bot.command('delete_me', async (ctx) => {
//    console.log('delete_me command called...')
//     // 1. Send the initial message
//     const msg = await ctx.reply("Deleting in 5 seconds...");

//     // 2. Define the animation frames
//     // We use HTML <code> or <pre> for a monospace "block" look
//     const frames = [
//         "Deleting in 5 seconds [■□□□□]",
//         "Deleting in 4 seconds [■■□□□]",
//         "Deleting in 3 seconds [■■■□□]",
//         "Deleting in 2 seconds [■■■■□]",
//         "Deleting in 1 seconds [■■■■■]",
//         "🚮 Deleted."
//     ];

//     // 3. Loop through frames and edit
//     for (let i = 0; i < frames.length; i++) {
//         // Pause for 800ms (adjust for speed)
//         await new Promise(resolve => setTimeout(resolve, 800));

//         try {
//             // Edit the message with the new frame
//             await ctx.api.editMessageText(
//                 msg.chat.id, 
//                 msg.message_id, 
//                 frames[i],
//                 { parse_mode: "HTML" } // Allows formatting if needed
//             );
//         } catch (e) {
//             // Ignore errors if message wasn't modified fast enough
//             console.log(e);
//         }
//     }

//     // 4. Final auto-delete
//     // Wait a moment so they see "Deleted", then remove it
//     await new Promise(resolve => setTimeout(resolve, 1000));
//     // await ctx.api.deleteMessage(msg.chat.id, msg.message_id);
//     await deleteMessage();
// });


bot.command('start', async (ctx) => {
  await ctx.react("❤‍🔥")
})


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

  // Target is Midnight tonight in IST
  const midnight = new Date(istDate);
  midnight.setHours(24, 0, 0, 0);

  const diffMs = midnight.getTime() - istDate.getTime();
  const remaining_hours = Math.ceil(diffMs / (1000 * 60 * 60));

  const message_text: string = `⏰ Daily Reminder!\n\nRemaining time for today: *${remaining_hours} hours* left ⌛\n\nMake every second count! 💪 Day: ${istDate.toLocaleString()}`;

  try {


    // Race the sendMessage against a 15-second timeout
    // file path
    const filePath = path.join(__dirname, '../public/output.webp')
    // promise sending
    const messageObjArray = await Promise.all([
      bot.api.sendMessage(chatId, message_text, { parse_mode: 'Markdown' }),
      bot.api.sendSticker(chatId, new InputFile(filePath), { protect_content: true })
    ])
    // message sent successfully
    setTimeout(async () => {
      await deleteMessage()
     }, new Date(istDate).getTime() + (1000*60*60) )
    // extracting message id
    const messageIdsArray = messageObjArray.map((messageObj) => messageObj.message_id)
    console.log('testing. ids[]>>>>', messageIdsArray)
    // Add new message ID to store
    const messages = store.get('messages') || []
    messages.push(...messageIdsArray);
    store.set('messages', messages);

  } catch (error) {
    console.error('Error sending message:', error);
  }

}

