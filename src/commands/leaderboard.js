const db = require('../database');

module.exports = (bot) => {
  bot.command('leaderboard', async (ctx) => {
    try {
      const telegramId = ctx.from.id;

      // Get top 20
      const topUsers = await db.getLeaderboard(20);
      
      // Get user position
      const userPosition = await db.getUserPosition(telegramId);
      const totalParticipants = await db.getTotalParticipants();

      // Format leaderboard
      let message = '🏆 TOP 20 LEADERBOARD 🏆\n\n';

      topUsers.forEach((user, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const username = user.username || 'Anonymous';
        const isCurrentUser = user.telegramId === telegramId ? '← YOU' : '';
        
        message += `${medal} ${username}: ${user.points}p ${isCurrentUser}\n`;
      });

      // Add user position dacă nu e în top 20
      if (userPosition > 20) {
        const user = await db.connect().then(database =>
          database.collection('users').findOne({ telegramId })
        );
        message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
        message += `📍 Your position: #${userPosition} (${user.points}p)\n`;
      }

      message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      message += `👥 Total participants: ${totalParticipants}\n`;
      message += `✅ Eligible (≥50p): ${(await db.getEligibleUsers()).length}`;

      await ctx.reply(message);

    } catch (error) {
      console.error('Error in /leaderboard:', error);
      await ctx.reply('❌ Error displaying leaderboard.');
    }
  });
};

