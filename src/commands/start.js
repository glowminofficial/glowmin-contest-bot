const db = require('../database');
const MESSAGES = require('../config/messages');

module.exports = (bot) => {
  bot.command('start', async (ctx) => {
    try {
      const telegramId = ctx.from.id;
      const username = ctx.from.username || ctx.from.first_name;
      
      // Verifică dacă e referral link
      const referredBy = ctx.message.text.split(' ')[1]; // /start USERID
      const referrerId = referredBy ? parseInt(referredBy) : null;

      // Get or create user
      const user = await db.getOrCreateUser(telegramId, username, referrerId);
      
      // Recalculează puncte
      const points = await db.calculatePoints(telegramId);
      
      // Status eligibilitate
      const status = points >= 50 ? '✅ Eligible for draw' : '❌ Need 50 points';

      // Format mesaj
      const message = MESSAGES.WELCOME
        .replace('{points}', points)
        .replace('{status}', status);

      await ctx.reply(message);

      // Dacă e nou și a fost referit, notifică referrer-ul
      if (referrerId && user.createdAt.getTime() > Date.now() - 10000) {
        try {
          const referrer = await db.getUserById(referrerId);
          const referralCount = referrer?.referrals?.length || 0;
          await bot.telegram.sendMessage(
            referrerId,
            `🎁 Someone joined through your link! (+20 points)\n\nTotal referrals: ${referralCount}`
          );
        } catch (err) {
          // Ignore if can't send
        }
      }

    } catch (error) {
      console.error('Error in /start:', error);
      await ctx.reply('❌ Error processing request. Please try again.');
    }
  });
};

