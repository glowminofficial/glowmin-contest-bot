const { Markup } = require('telegraf');
const db = require('../database');
const MESSAGES = require('../config/messages');

const USERNAME_REGEX = /^@?([A-Za-z0-9_]{1,15})$/;

function formatTwitterUsername(username) {
  if (!username) return null;
  if (username.startsWith('@')) return username;
  return `@${username}`;
}

module.exports = (bot) => {
  bot.command('set_twitter', async (ctx) => {
    const telegramId = ctx.from.id;
    const telegramUsername = ctx.from.username || ctx.from.first_name;
    const args = ctx.message.text.split(' ').slice(1);

    try {
      const user = await db.getOrCreateUser(telegramId, telegramUsername);

      if (args.length === 0) {
        const current = user.twitterUsername ? formatTwitterUsername(user.twitterUsername) : 'Not set';
        const message = MESSAGES.TWITTER_PROMPT.replace('{current}', current);

        const buttons = [];
        buttons.push([Markup.button.callback('🔄 Update username', 'twitter_prompt_update')]);
        if (user.twitterUsername) {
          buttons.push([Markup.button.callback('❌ Remove username', 'twitter_remove')]);
        }

        await ctx.reply(message, {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard(buttons)
        });
        return;
      }

      const candidate = args[0];
      const match = USERNAME_REGEX.exec(candidate);

      if (!match) {
        await ctx.reply(MESSAGES.TWITTER_INVALID);
        return;
      }

      const normalized = match[1].toLowerCase();
      await db.setTwitterUsername(telegramId, normalized);
      await ctx.reply(MESSAGES.TWITTER_SUCCESS.replace('{username}', `@${normalized}`));
    } catch (error) {
      console.error('Error in /set_twitter:', error);
      await ctx.reply(MESSAGES.TWITTER_ERROR);
    }
  });

  bot.action('twitter_prompt_update', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('✏️ Send your Twitter username using:\n\n`/set_twitter your_username`', { parse_mode: 'Markdown' });
  });

  bot.action('twitter_remove', async (ctx) => {
    const telegramId = ctx.from.id;
    await ctx.answerCbQuery();
    try {
      await db.removeTwitterUsername(telegramId);
      await ctx.reply(MESSAGES.TWITTER_REMOVED);
    } catch (error) {
      console.error('Error in twitter_remove:', error);
      await ctx.reply(MESSAGES.TWITTER_ERROR);
    }
  });
};

