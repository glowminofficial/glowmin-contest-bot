const { Markup } = require('telegraf');
const db = require('../database');
const MESSAGES = require('../config/messages');
const POINTS = require('../config/points');

const TWITTER_STATUS_REGEX = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/\d+/i;

module.exports = (bot) => {
  bot.command('meme', async (ctx) => {
    const telegramId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;

    try {
      const user = await db.getOrCreateUser(telegramId, username);
      const message = MESSAGES.MEME_INSTRUCTIONS
        .replace('{twitterStatus}', user.twitterUsername ? `@${user.twitterUsername}` : 'Not linked yet (/set_twitter)')
        .replace('{submitCommand}', '/submit_meme <tweet_link> | short description');

      const buttons = [];
      if (!user.twitterUsername) {
        buttons.push([Markup.button.callback('🐦 Link Twitter', 'meme_link_twitter')]);
      }
      buttons.push([Markup.button.callback('➕ Submit Meme', 'meme_submit_prompt')]);

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons)
      });
    } catch (error) {
      console.error('Error in /meme:', error);
      await ctx.reply(MESSAGES.MEME_ERROR);
    }
  });

  bot.action('meme_link_twitter', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('🐦 Link your Twitter account first using:\n\n`/set_twitter your_username`', { parse_mode: 'Markdown' });
  });

  bot.action('meme_submit_prompt', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('🖼️ Submit your meme tweet using:\n\n`/submit_meme <tweet_link> | short description`\n\nExample:\n`/submit_meme https://twitter.com/user/status/123 | Meme about Glowmin orbit`', { parse_mode: 'Markdown' });
  });

  bot.command('submit_meme', async (ctx) => {
    const telegramId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;
    const payload = ctx.message.text.split(' ').slice(1).join(' ').trim();

    try {
      const user = await db.getOrCreateUser(telegramId, username);

      if (!user.twitterUsername) {
        await ctx.reply(MESSAGES.TWITTER_REQUIRED);
        return;
      }

      if (!payload) {
        await ctx.reply(MESSAGES.MEME_MISSING_INPUT.replace('{format}', '/submit_meme <tweet_link> | short description'));
        return;
      }

      const [urlPart, ...descParts] = payload.split('|');
      const rawUrl = (urlPart || '').trim();
      const description = descParts.join('|').trim();

      if (!rawUrl) {
        await ctx.reply(MESSAGES.MEME_MISSING_INPUT.replace('{format}', '/submit_meme <tweet_link> | short description'));
        return;
      }

      if (!TWITTER_STATUS_REGEX.test(rawUrl)) {
        await ctx.reply(MESSAGES.MEME_INVALID_URL);
        return;
      }

      await db.markMemePending(telegramId, {
        platform: 'twitter',
        url: rawUrl,
        description
      });

      await ctx.reply(
        MESSAGES.MEME_SUBMITTED
          .replace('{url}', rawUrl)
          .replace('{description}', description || 'No description provided'),
        { parse_mode: 'Markdown' }
      );

      try {
        const admins = (process.env.ADMIN_USER_IDS || '').split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        const notification = `🖼️ New meme submission pending review\n\nUser: ${username} (${telegramId})\nTwitter: @${user.twitterUsername}\nLink: ${rawUrl}\nDescription: ${description || 'N/A'}`;
        await Promise.all(admins.map(adminId => bot.telegram.sendMessage(adminId, notification)));
      } catch (notifyErr) {
        console.warn('Failed to notify admins about meme submission:', notifyErr.message);
      }
    } catch (error) {
      console.error('Error in /submit_meme:', error);
      await ctx.reply(MESSAGES.MEME_ERROR);
    }
  });

  bot.command('admin_meme_pending', async (ctx) => {
    const admins = (process.env.ADMIN_USER_IDS || '').split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (!admins.includes(ctx.from.id)) {
      await ctx.reply('❌ Access denied.');
      return;
    }

    try {
      const pending = await db.getPendingMemes(20);

      if (pending.length === 0) {
        await ctx.reply('✅ No pending meme submissions.');
        return;
      }

      let message = '🖼️ Pending meme submissions:\n\n';
      pending.forEach((user, index) => {
        message += `${index + 1}. ${user.username || user.telegramId}\n`;
        message += `   ID: ${user.telegramId}\n`;
        message += `   Twitter: ${user.twitterUsername ? '@' + user.twitterUsername : 'not linked'}\n`;
        if (user.memeTweetUrl) {
          message += `   Link: ${user.memeTweetUrl}\n`;
        }
        if (user.memeDescription) {
          message += `   Desc: ${user.memeDescription}\n`;
        }
        if (user.memeSubmittedAt) {
          message += `   Submitted: ${new Date(user.memeSubmittedAt).toLocaleString()}\n`;
        }
        message += '\n';
      });

      await ctx.reply(message);
    } catch (error) {
      console.error('Error in /admin_meme_pending:', error);
      await ctx.reply('❌ Error fetching meme submissions.');
    }
  });

  bot.command('admin_meme_approve', async (ctx) => {
    const admins = (process.env.ADMIN_USER_IDS || '').split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (!admins.includes(ctx.from.id)) {
      await ctx.reply('❌ Access denied.');
      return;
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
      await ctx.reply('❌ Usage: /admin_meme_approve <telegram_id>');
      return;
    }

    const targetUserId = parseInt(args[0], 10);
    if (isNaN(targetUserId)) {
      await ctx.reply('❌ Telegram ID must be a number.');
      return;
    }

    try {
      const database = await db.connect();
      const users = database.collection('users');
      const user = await users.findOne({ telegramId: targetUserId });

      if (!user) {
        await ctx.reply('❌ User not found.');
        return;
      }

      await db.markMemeApproved(targetUserId, {
        platform: user.memePlatform || 'twitter',
        url: user.memeTweetUrl,
        description: user.memeDescription
      });

      if (!user.tasks?.createdMeme) {
        await db.addPoints(targetUserId, POINTS.CREATE_MEME, 'meme_approved');
      }

      await db.calculatePoints(targetUserId);

      await ctx.reply(`✅ Meme approved for user ${user.username || targetUserId}.`);

      try {
        await bot.telegram.sendMessage(
          targetUserId,
          '🎉 Your meme submission has been approved! Points added to your score.'
        );
      } catch (err) {
        // ignore DM failure
      }
    } catch (error) {
      console.error('Error in /admin_meme_approve:', error);
      await ctx.reply('❌ Error approving meme.');
    }
  });

  bot.command('admin_meme_reject', async (ctx) => {
    const admins = (process.env.ADMIN_USER_IDS || '').split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (!admins.includes(ctx.from.id)) {
      await ctx.reply('❌ Access denied.');
      return;
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
      await ctx.reply('❌ Usage: /admin_meme_reject <telegram_id> [reason]');
      return;
    }

    const targetUserId = parseInt(args[0], 10);
    const reason = args.slice(1).join(' ') || 'Does not meet requirements';

    if (isNaN(targetUserId)) {
      await ctx.reply('❌ Telegram ID must be a number.');
      return;
    }

    try {
      await db.markMemeRejected(targetUserId, reason);
      await db.calculatePoints(targetUserId);

      await ctx.reply(`⚠️ Meme rejected for user ${targetUserId}.`);

      try {
        await bot.telegram.sendMessage(
          targetUserId,
          `⚠️ Your meme submission was rejected.\nReason: ${reason}\nPlease try again following the instructions in /meme.`
        );
      } catch (err) {
        // ignore DM failure
      }
    } catch (error) {
      console.error('Error in /admin_meme_reject:', error);
      await ctx.reply('❌ Error rejecting meme.');
    }
  });
};

