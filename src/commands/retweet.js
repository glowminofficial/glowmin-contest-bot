const axios = require('axios');
const { Markup } = require('telegraf');
const db = require('../database');
const MESSAGES = require('../config/messages');
const POINTS = require('../config/points');

const TWEET_URL_REGEX = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/\d+/i;

function normaliseTweetUrl(url) {
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}

function extractPlainText(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHandleFromUrl(url) {
  const match = url.match(/(twitter\.com|x\.com)\/([^\/]+)\/status/i);
  if (!match) return null;
  return match[2].toLowerCase();
}

function normaliseMention(handle) {
  return handle.replace(/^@/, '').toLowerCase();
}

function isValidMention(handle) {
  const normalised = normaliseMention(handle);
  return /^[A-Za-z][A-Za-z0-9_]{0,14}$/.test(normalised);
}

module.exports = (bot) => {
  bot.command('retweet', async (ctx) => {
    const telegramId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;

    try {
      const user = await db.getOrCreateUser(telegramId, username);

      if (!user.twitterUsername) {
        await ctx.reply(MESSAGES.TWITTER_REQUIRED);
        return;
      }

      const code = await db.ensureRetweetCode(telegramId);
      const message = MESSAGES.RETWEET_INSTRUCTIONS
        .replace('{code}', code)
        .replace('{tweetCommand}', '/submit_retweet <tweet_link>');

      await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback('📋 Copy Code', 'retweet_copy_code')
        ])
      });
    } catch (error) {
      console.error('Error in /retweet:', error);
      await ctx.reply(MESSAGES.RETWEET_ERROR);
    }
  });

  bot.command('submit_retweet', async (ctx) => {
    const telegramId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;
    const args = ctx.message.text.split(' ').slice(1);
    const rawUrl = args.join(' ').trim();

    try {
      const user = await db.getOrCreateUser(telegramId, username);

      if (!user.twitterUsername) {
        await ctx.reply(MESSAGES.TWITTER_REQUIRED);
        return;
      }
      const code = await db.ensureRetweetCode(telegramId);

      if (!rawUrl) {
        await ctx.reply(MESSAGES.RETWEET_MISSING_URL.replace('{tweetCommand}', '/submit_retweet <tweet_link>'));
        return;
      }

      if (!TWEET_URL_REGEX.test(rawUrl)) {
        await ctx.reply(MESSAGES.RETWEET_INVALID_URL);
        return;
      }

      const tweetUrl = normaliseTweetUrl(rawUrl);

      await ctx.reply(MESSAGES.RETWEET_CHECKING);

      let response;
      try {
        response = await axios.get('https://publish.twitter.com/oembed', {
          params: { url: tweetUrl },
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; GlowminBot/1.0)',
            Accept: 'application/json'
          },
          timeout: 10000
        });
      } catch (error) {
        console.error('Twitter oEmbed error:', error?.response?.status || error.message);
        await ctx.reply(MESSAGES.RETWEET_FETCH_FAILED);
        return;
      }

      const plainText = extractPlainText(response.data?.html || '');
      const hasCode = plainText.includes(code);
      const mentions = plainText.match(/@[A-Za-z0-9_]+/g) || [];
      const filteredMentions = mentions.filter(isValidMention);
      const uniqueMentions = [...new Set(filteredMentions.map(normaliseMention))];

      const tweetHandle = extractHandleFromUrl(tweetUrl);
      const linkedHandle = user.twitterUsername?.toLowerCase();
      if (!tweetHandle || !linkedHandle || tweetHandle !== linkedHandle) {
        await ctx.reply(MESSAGES.RETWEET_WRONG_ACCOUNT.replace('{username}', `@${user.twitterUsername}`));
        await db.markRetweetPending(telegramId, tweetUrl);
        return;
      }

      if (hasCode && uniqueMentions.length >= 3) {
        const { alreadyCompleted } = await db.markRetweetApproved(telegramId, tweetUrl);

        if (!alreadyCompleted) {
          await db.updateTask(telegramId, 'retweeted', true);
          await db.addPoints(telegramId, POINTS.RETWEET_ANNOUNCEMENT, 'retweet_verified');
        } else {
          await db.updateRetweetSubmission(telegramId, {
            retweetStatus: 'approved',
            retweetTweetUrl: tweetUrl,
            retweetSubmittedAt: new Date()
          });
        }

        await db.calculatePoints(telegramId);

        await ctx.reply(MESSAGES.RETWEET_SUCCESS);
      } else {
        await db.markRetweetPending(telegramId, tweetUrl);

        const issues = [];
        if (!hasCode) issues.push(MESSAGES.RETWEET_MISSING_CODE.replace('{code}', code));
        if (uniqueMentions.length < 3) {
          issues.push(MESSAGES.RETWEET_INVALID_MENTIONS);
        }

        const issueText = issues.length ? `\n\n⚠️ ${issues.join('\n⚠️ ')}` : '';
        await ctx.reply(MESSAGES.RETWEET_PENDING_REVIEW + issueText);
      }
    } catch (error) {
      console.error('Error in /submit_retweet:', error);
      await ctx.reply(MESSAGES.RETWEET_ERROR);
    }
  });

  bot.action('retweet_copy_code', async (ctx) => {
    const telegramId = ctx.from.id;
    const code = await db.ensureRetweetCode(telegramId);
    await ctx.answerCbQuery('Code sent to chat!');
    await ctx.reply(`🔑 Your retweet code:\n\`${code}\``, { parse_mode: 'Markdown' });
  });
};

