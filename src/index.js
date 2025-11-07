/**
 * GLOWMIN Contest Bot - Entry Point
 * 
 * Bot Telegram pentru tracking automat puncte în concursul Genesis NFT
 */

require('dotenv').config();
const { Telegraf } = require('telegraf');
const db = require('./database');
const { startDiscordAuthServer } = require('./discordAuthServer');

// Verifică environment variables
if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN not found in .env file!');
  process.exit(1);
}

// Inițializare bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Connect la database
db.connect().catch(err => {
  console.error('❌ Failed to connect to database:', err);
  process.exit(1);
});

console.log('🤖 GLOWMIN Contest Bot starting...');

// Import comenzi
require('./commands/start')(bot);
require('./commands/tasks')(bot);
require('./commands/score')(bot);
require('./commands/wallet')(bot);
require('./commands/referral')(bot);
require('./commands/leaderboard')(bot);
require('./commands/verify')(bot);
require('./commands/help')(bot);
require('./commands/retweet')(bot);
require('./commands/twitter')(bot);
require('./commands/meme')(bot);
require('./commands/discord')(bot);

// Admin commands
require('./commands/admin')(bot);

// Error handling
bot.catch((err, ctx) => {
  console.error('❌ Bot error:', err);
  ctx.reply('❌ An error occurred. Please try again or contact an admin.');
});

// Launch bot
bot.launch().then(() => {
  console.log('✅ Bot is running!');
  console.log('📅 Contest period: 25 Nov - 15 Dec 2025');
  startDiscordAuthServer(bot);
}).catch(err => {
  console.error('❌ Failed to launch bot:', err);
  process.exit(1);
});

// Graceful stop
process.once('SIGINT', () => {
  console.log('🛑 Bot stopping...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('🛑 Bot stopping...');
  bot.stop('SIGTERM');
});

