const db = require('../database');
const { verifyTelegramMembership } = require('../verifications/telegram');
const { checkGlowminTrade } = require('../verifications/solana');
const { verifyDiscordMembership } = require('../verifications/discord');
const POINTS = require('../config/points');

module.exports = (bot) => {
  bot.command('verify', async (ctx) => {
    try {
      const telegramId = ctx.from.id;
      const user = await db.getOrCreateUser(telegramId, ctx.from.username);

      await ctx.reply('🔄 Verifying tasks...\n\nPlease wait a few seconds...');

      let updatedTasks = [];

      // 1. Verifică Telegram membership
      const isMember = await verifyTelegramMembership(bot, telegramId);
      if (isMember && !user.tasks.joinedTelegram) {
        await db.updateTask(telegramId, 'joinedTelegram', true);
        await db.addPoints(telegramId, POINTS.JOIN_TELEGRAM, 'telegram_join');
        updatedTasks.push(`✅ Join Telegram (+${POINTS.JOIN_TELEGRAM}p)`);
      }

      // 2. Verifică GLOWMIN trade (dacă are wallet)
      if (user.walletAddress && !user.tasks.traded) {
        const hasTrade = await checkGlowminTrade(user.walletAddress);
        if (hasTrade) {
          await db.updateTask(telegramId, 'traded', true);
          await db.addPoints(telegramId, POINTS.TRADE_GLOWMIN, 'glowmin_trade');
          updatedTasks.push(`✅ Trade GLOWMIN (+${POINTS.TRADE_GLOWMIN}p)`);
        }
      }

      // 3. Twitter & Discord sunt manual verification (se fac prin admin sau self-report)

      // Recalculează total
      const totalPoints = await db.calculatePoints(telegramId);

      // Discord verification
      if (user.discordUserId) {
        const discordOk = await verifyDiscordMembership(user.discordUserId);
        if (discordOk && !user.tasks.joinedDiscord) {
          await db.updateTask(telegramId, 'joinedDiscord', true);
          await db.addPoints(telegramId, POINTS.JOIN_DISCORD, 'discord_verified');
          updatedTasks.push(`✅ Discord verified (+${POINTS.JOIN_DISCORD}p)`);
        } else if (!discordOk && user.tasks.joinedDiscord) {
          await db.updateTask(telegramId, 'joinedDiscord', false);
          updatedTasks.push('⚠️ Discord membership lost.');
        }
      }

      // Răspuns
      if (updatedTasks.length > 0) {
        const message = `🎉 NEW TASKS DETECTED:\n\n${updatedTasks.join('\n')}\n\n━━━━━━━━━━━━━━━━━━━━\n📊 Total points: ${totalPoints}\n\nUse /score for details!`;
        await ctx.reply(message);
      } else {
        await ctx.reply(`✅ Verification complete!\n\nNo new completed tasks found.\n\n📊 Total points: ${totalPoints}\n\n💡 For Twitter manual tasks, contact admin with screenshot if required.`);
      }

    } catch (error) {
      console.error('Error in /verify:', error);
      await ctx.reply('❌ Error during verification.');
    }
  });
};

