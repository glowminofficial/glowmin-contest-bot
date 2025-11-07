const { Markup } = require('telegraf');
const db = require('../database');
const MESSAGES = require('../config/messages');

const getAuthBaseUrl = () => {
  const base = process.env.DISCORD_AUTH_BASE_URL || `http://localhost:${process.env.DISCORD_AUTH_PORT || 4000}`;
  return base.replace(/\/$/, '');
};

module.exports = (bot) => {
  bot.command('connect_discord', async (ctx) => {
    if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_REDIRECT_URI) {
      await ctx.reply(MESSAGES.DISCORD_CONNECT_DISABLED);
      return;
    }

    const telegramId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;
    const user = await db.getOrCreateUser(telegramId, username);

    const authUrl = `${getAuthBaseUrl()}/discord/login?telegram_id=${telegramId}`;

    const buttons = [
      [Markup.button.url('🔗 Connect Discord', authUrl)]
    ];

    if (user.discordUserId) {
      buttons.push([Markup.button.callback('❌ Disconnect Discord', 'discord_disconnect')]);
      await ctx.reply(MESSAGES.DISCORD_ALREADY_CONNECTED.replace('{username}', user.discordUsername || 'your account'), {
        reply_markup: Markup.inlineKeyboard(buttons)
      });
    } else {
      await ctx.reply(MESSAGES.DISCORD_CONNECT_PROMPT, {
        reply_markup: Markup.inlineKeyboard(buttons)
      });
    }
  });

  bot.action('discord_disconnect', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = ctx.from.id;
    await db.removeDiscordAccount(telegramId);
    await db.calculatePoints(telegramId);
    await ctx.reply(MESSAGES.DISCORD_DISCONNECTED);
  });
};

