const db = require('../database');
const MESSAGES = require('../config/messages');
const POINTS = require('../config/points');

module.exports = (bot) => {
  bot.command('score', async (ctx) => {
    try {
      const telegramId = ctx.from.id;
      const user = await db.getOrCreateUser(telegramId, ctx.from.username);

      // Recalculează puncte
      const totalPoints = await db.calculatePoints(telegramId);

      // Construiește lista taskuri completate
      let completedTasks = '';
      
      if (user.tasks.joinedTelegram) completedTasks += `✅ Join Telegram: +${POINTS.JOIN_TELEGRAM}p\n`;
      if (user.tasks.followedTwitter) completedTasks += `✅ Follow Twitter: +${POINTS.FOLLOW_TWITTER}p\n`;
      if (user.tasks.joinedDiscord) completedTasks += `✅ Join Discord: +${POINTS.JOIN_DISCORD}p\n`;
      if (user.tasks.connectedWallet) completedTasks += `✅ Connect Wallet: +${POINTS.CONNECT_WALLET}p\n`;
      if (user.tasks.traded) completedTasks += `✅ Trade GLOWMIN: +${POINTS.TRADE_GLOWMIN}p\n`;
      if (user.tasks.retweeted) completedTasks += `✅ Retweet: +${POINTS.RETWEET_ANNOUNCEMENT}p\n`;
      if (user.tasks.createdMeme) completedTasks += `✅ Create Meme: +${POINTS.CREATE_MEME}p\n`;

      if (completedTasks === '') {
        completedTasks = '❌ No tasks completed yet\n\nUse /tasks to get started!';
      }

      // Referral info
      const referralCount = user.referrals?.length || 0;
      const referralPoints = referralCount * POINTS.REFERRAL;
      
      if (referralCount > 0) {
        completedTasks += `\n🎁 Referrals: ${referralCount} × ${POINTS.REFERRAL}p = +${referralPoints}p`;
      }

      // Poziție în leaderboard
      const position = await db.getUserPosition(telegramId);
      const totalParticipants = await db.getTotalParticipants();

      // Status eligibilitate
      let status = '';
      if (totalPoints >= 50) {
        status = '✅ ELIGIBLE for random draw!';
      } else {
        const needed = 50 - totalPoints;
        status = `❌ You need ${needed} more points for eligibility`;
      }

      // Encouragement message
      let encouragement = '';
      if (totalPoints < 50) {
        encouragement = '\n💪 Keep completing tasks to become eligible!';
      } else if (position > 10) {
        encouragement = '\n🔥 You are eligible! Now try to get into Top 10!';
      } else {
        encouragement = '\n🏆 WOW! You are in Top 10! Keep it up!';
      }

      // Format mesaj
      const message = MESSAGES.SCORE_DETAILS
        .replace('{completedTasks}', completedTasks)
        .replace('{totalPoints}', totalPoints)
        .replace('{referralCount}', referralCount)
        .replace('{referralPoints}', referralPoints)
        .replace('{status}', status)
        .replace('{position}', position)
        .replace('{totalParticipants}', totalParticipants)
        .replace('{encouragement}', encouragement);

      await ctx.reply(message);

    } catch (error) {
      console.error('Error in /score:', error);
      await ctx.reply('❌ Error displaying score.');
    }
  });
};

