const db = require('../database');
const MESSAGES = require('../config/messages');
const POINTS = require('../config/points');

module.exports = (bot) => {
  bot.command('referral', async (ctx) => {
    try {
      const telegramId = ctx.from.id;
      const user = await db.getOrCreateUser(telegramId, ctx.from.username);

      // Generează link unic
      const botUsername = (await bot.telegram.getMe()).username;
      const referralLink = `https://t.me/${botUsername}?start=${telegramId}`;

      // Statistici
      const referralCount = user.referrals?.length || 0;
      const referralPoints = referralCount * POINTS.REFERRAL;

      // Format mesaj
      const message = MESSAGES.REFERRAL_INFO
        .replace('{referralLink}', referralLink)
        .replace('{referralCount}', referralCount)
        .replace('{referralPoints}', referralPoints);

      // Keyboard cu share button
      const keyboard = {
        inline_keyboard: [
          [
            { 
              text: '📤 Share Referral Link', 
              url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('🔥 Join GLOWMIN Genesis NFT Contest! Win NFTs + tokens!')}`
            }
          ]
        ]
      };

      await ctx.reply(message, { reply_markup: keyboard });

    } catch (error) {
      console.error('Error in /referral:', error);
      await ctx.reply('❌ Eroare la generare link referral.');
    }
  });
};

