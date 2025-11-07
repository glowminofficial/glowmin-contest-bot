const db = require('../database');
const MESSAGES = require('../config/messages');

module.exports = (bot) => {
  bot.command('tasks', async (ctx) => {
    try {
      const telegramId = ctx.from.id;
      const user = await db.getOrCreateUser(telegramId, ctx.from.username);

      // Emoji pentru status
      const check = '✅';
      const cross = '❌';

      // Format mesaj cu status taskuri
      let message = MESSAGES.TASKS_LIST
        .replace('{joinTelegram}', user.tasks.joinedTelegram ? check : cross)
        .replace('{followTwitter}', user.tasks.followedTwitter ? check : cross)
        .replace('{joinDiscord}', user.tasks.joinedDiscord ? check : cross)
        .replace('{connectWallet}', user.tasks.connectedWallet ? check : cross)
        .replace('{tradeGlowmin}', user.tasks.traded ? check : cross)
        .replace('{retweet}', user.tasks.retweeted ? check : cross)
        .replace('{createMeme}', user.tasks.createdMeme ? check : cross)
        .replace('{referrals}', `${user.referrals?.length || 0} referrals`);

      // Total points
      const points = await db.calculatePoints(telegramId);
      message = message
        .replace('{totalPoints}', points)
        .replace('{eligible}', points >= 50 ? '✅ YES' : '❌ NO (' + (50 - points) + 'p more needed)');

      const statusMap = {
        not_started: 'Not started',
        code_generated: 'Code generated',
        pending_review: 'Pending review',
        approved: 'Approved ✅',
        rejected: 'Rejected ❌'
      };

      const twitterAccount = user.twitterUsername ? `@${user.twitterUsername}` : 'Not linked (/set_twitter)';
      const discordAccount = user.discordUserId ? (user.discordUsername ? `${user.discordUsername}` : 'Connected') : 'Not linked (/connect_discord)';
      const retweetCode = user.retweetCode || await db.ensureRetweetCode(telegramId);
      let retweetInfo = '';
      if (user.tasks.retweeted) {
        retweetInfo = `\n🌀 Retweet task: ✅ Verified`;
        if (user.retweetTweetUrl) {
          retweetInfo += `\n🔗 Tweet: ${user.retweetTweetUrl}`;
        }
      } else {
        const currentStatus = statusMap[user.retweetStatus] || 'Not started';
        const codeDisplay = retweetCode || 'Use /retweet to generate code';
        retweetInfo = `\n🌀 Retweet task: ${currentStatus}\n🔑 Code: ${codeDisplay}\n📤 Submit link: /submit_retweet <tweet_link>`;
      }

      const memeStatusMap = {
        not_started: 'Not started',
        pending_review: 'Pending review',
        approved: 'Approved ✅',
        rejected: 'Rejected ❌'
      };

      let memeInfo = '';
      const memeStatus = memeStatusMap[user.memeStatus] || 'Not started';
      if (user.tasks.createdMeme) {
        memeInfo = `\n🖼️ Meme task: ✅ Approved`;
        if (user.memeTweetUrl) {
          memeInfo += `\n🔗 Meme: ${user.memeTweetUrl}`;
        }
      } else {
        memeInfo = `\n🖼️ Meme task: ${memeStatus}\n✨ Submit via: /submit_meme <tweet_link> | description`;
      }

      message += `\n🐦 Twitter account: ${twitterAccount}`;
      message += `\n🛡️ Discord account: ${discordAccount}`;
      message += retweetInfo + memeInfo;

      // Keyboard cu linkuri
      const keyboard = {
        inline_keyboard: [
          [
            { text: '💬 Join Telegram', url: process.env.TELEGRAM_GROUP_LINK || 'https://t.me/GlowMinOfficialToken' }
          ],
          [
            { text: '🐦 Follow Twitter', url: process.env.TWITTER_PROFILE_URL || 'https://x.com/GlowMinOfficial' }
          ],
          [
            { text: '💬 Join Discord', url: process.env.DISCORD_INVITE_LINK || 'https://discord.gg/4X9tS3Hns2' }
          ],
          [
            { text: '💎 Connect Wallet', callback_data: 'connect_wallet' }
          ],
          [
            { text: '🔄 Re-verify Tasks', callback_data: 'verify_all' }
          ],
          [
            { text: '🖼️ Meme Instructions', callback_data: 'meme_instructions' }
          ]
        ]
      };

      await ctx.reply(message, { reply_markup: keyboard });

    } catch (error) {
      console.error('Error in /tasks:', error);
      await ctx.reply('❌ Error displaying tasks.');
    }
  });

  // Callback pentru connect wallet button
  bot.action('connect_wallet', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(MESSAGES.WALLET_CONNECT);
  });

  bot.action('meme_instructions', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = ctx.from.id;
    const user = await db.getOrCreateUser(telegramId, ctx.from.username);
    const message = MESSAGES.MEME_INSTRUCTIONS
      .replace('{twitterStatus}', user.twitterUsername ? `@${user.twitterUsername}` : 'Not linked yet (/set_twitter)')
      .replace('{submitCommand}', '/submit_meme <tweet_link> | short description');
    await ctx.reply(message, { parse_mode: 'Markdown' });
  });

  // Callback pentru verify all
  bot.action('verify_all', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('🔄 Verification in progress...');
    // Trigger verify command
    ctx.command = 'verify';
    require('./verify')(bot);
  });
};

