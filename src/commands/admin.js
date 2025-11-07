const db = require('../database');
const POINTS = require('../config/points');

// Lista admin IDs din .env
const getAdminIds = () => {
  return (process.env.ADMIN_USER_IDS || '').split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
};

// Verifică dacă user e admin
const isAdmin = (telegramId) => {
  return getAdminIds().includes(telegramId);
};

module.exports = (bot) => {
  
  // Admin Stats
  bot.command('admin_stats', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      await ctx.reply('❌ Access denied. Admins only.');
      return;
    }

    try {
      const database = await db.connect();
      const users = database.collection('users');

      const totalUsers = await users.countDocuments();
      const eligibleUsers = await users.countDocuments({ points: { $gte: 50 }, disqualified: false });
      const disqualifiedUsers = await users.countDocuments({ disqualified: true });
      
      // Average points
      const avgResult = await users.aggregate([
        { $match: { disqualified: false } },
        { $group: { _id: null, avgPoints: { $avg: '$points' } } }
      ]).toArray();
      const avgPoints = avgResult[0]?.avgPoints || 0;

      // Top scorer
      const topUser = await users.findOne({ disqualified: false }, { sort: { points: -1 } });

      // Users cu wallet conectat
      const walletsConnected = await users.countDocuments({ walletAddress: { $ne: null } });

      // Users cu trade completat
      const trades = await users.countDocuments({ 'tasks.traded': true });

      const pendingRetweets = await users.countDocuments({ retweetStatus: 'pending_review' });
      const pendingMemes = await users.countDocuments({ memeStatus: 'pending_review' });

      const message = `
📊 ADMIN STATISTICS 📊

━━━ PARTICIPANTS ━━━
👥 Total users: ${totalUsers}
✅ Eligible (≥50p): ${eligibleUsers}
❌ Disqualified: ${disqualifiedUsers}

━━━ ENGAGEMENT ━━━
📊 Average points: ${avgPoints.toFixed(1)}p
🏆 Top scorer: ${topUser?.username || 'N/A'} (${topUser?.points || 0}p)
💎 Wallets connected: ${walletsConnected}
💰 GLOWMIN trades: ${trades}

━━━ TASK COMPLETION ━━━
${await getTaskCompletionStats(users)}

🌀 Pending retweet submissions: ${pendingRetweets}
🖼️ Pending meme submissions: ${pendingMemes}

Use /admin_leaderboard for full list
Use /admin_export for CSV export
      `;

      await ctx.reply(message);

    } catch (error) {
      console.error('Error in /admin_stats:', error);
      await ctx.reply('❌ Error displaying statistics.');
    }
  });

  // Admin Leaderboard (Full)
  bot.command('admin_leaderboard', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      await ctx.reply('❌ Access denied.');
      return;
    }

    try {
      const topUsers = await db.getLeaderboard(50); // Top 50 for admins

      let message = '🏆 FULL LEADERBOARD (Top 50)\n\n';
      
      topUsers.forEach((user, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const username = user.username || 'Anonymous';
        const wallet = user.walletAddress ? ' 💎' : '';
        
        message += `${medal} ${username}: ${user.points}p${wallet}\n`;
      });

      const totalParticipants = await db.getTotalParticipants();
      const eligibleUsers = await db.getEligibleUsers();

      message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      message += `👥 Total: ${totalParticipants} | ✅ Eligible: ${eligibleUsers.length}`;

      await ctx.reply(message);

    } catch (error) {
      console.error('Error in /admin_leaderboard:', error);
      await ctx.reply('❌ Error displaying leaderboard.');
    }
  });

  // Admin Draw Winners
  bot.command('admin_draw', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      await ctx.reply('❌ Access denied.');
      return;
    }

    try {
      const eligibleUsers = await db.getEligibleUsers();

      if (eligibleUsers.length === 0) {
        await ctx.reply('❌ No eligible users (minimum 50 points required)!');
        return;
      }

      // Random selection (10 winners)
      const numberOfWinners = Math.min(10, eligibleUsers.length);
      const shuffled = eligibleUsers.sort(() => 0.5 - Math.random());
      const winners = shuffled.slice(0, numberOfWinners);

      let message = `🎲 RANDOM DRAW RESULTS (${numberOfWinners} winners)\n\n`;
      
      winners.forEach((user, index) => {
        message += `${index + 1}. ${user.username} (${user.points}p)\n`;
      });

      message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      message += `Total eligible: ${eligibleUsers.length}\n`;
      message += `Winners selected: ${numberOfWinners}`;

      await ctx.reply(message);

      // Optional: save winners in DB for reference
      const database = await db.connect();
      await database.collection('contest_winners').insertOne({
        drawDate: new Date(),
        winners: winners.map(u => ({ telegramId: u.telegramId, username: u.username, points: u.points })),
        totalEligible: eligibleUsers.length
      });

    } catch (error) {
      console.error('Error in /admin_draw:', error);
      await ctx.reply('❌ Error with draw.');
    }
  });

  bot.command('admin_retweet_pending', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      await ctx.reply('❌ Access denied.');
      return;
    }

    try {
      const pending = await db.getPendingRetweets(20);

      if (pending.length === 0) {
        await ctx.reply('✅ No pending retweet submissions.');
        return;
      }

      let message = '🕒 Pending retweet submissions:\n\n';
      pending.forEach((user, index) => {
        message += `${index + 1}. ${user.username || user.telegramId}\n`;
        message += `   ID: ${user.telegramId}\n`;
        if (user.twitterUsername) {
          message += `   Twitter: @${user.twitterUsername}\n`;
        } else {
          message += `   Twitter: not linked\n`;
        }
        if (user.retweetTweetUrl) {
          message += `   Tweet: ${user.retweetTweetUrl}\n`;
        }
        if (user.retweetCode) {
          message += `   Code: ${user.retweetCode}\n`;
        }
        if (user.retweetSubmittedAt) {
          message += `   Submitted: ${new Date(user.retweetSubmittedAt).toLocaleString()}\n`;
        }
        message += '\n';
      });

      await ctx.reply(message);
    } catch (error) {
      console.error('Error in /admin_retweet_pending:', error);
      await ctx.reply('❌ Error fetching pending retweets.');
    }
  });

  bot.command('admin_retweet_approve', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      await ctx.reply('❌ Access denied.');
      return;
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
      await ctx.reply('❌ Usage: /admin_retweet_approve <telegram_id> [tweet_url]');
      return;
    }

    const targetUserId = parseInt(args[0], 10);
    const providedUrl = args[1] || null;

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

      const tweetUrl = providedUrl || user.retweetTweetUrl || '';
      const { alreadyCompleted } = await db.markRetweetApproved(targetUserId, tweetUrl);

      if (!alreadyCompleted) {
        await db.addPoints(targetUserId, POINTS.RETWEET_ANNOUNCEMENT, 'retweet_admin_approve');
      }

      await db.calculatePoints(targetUserId);

      await ctx.reply(`✅ Retweet approved for user ${user.username || targetUserId}.`);

      try {
        await bot.telegram.sendMessage(
          targetUserId,
          '✅ Your retweet submission has been approved by an admin! Points have been added.'
        );
      } catch (err) {
        // ignore DM failures
      }
    } catch (error) {
      console.error('Error in /admin_retweet_approve:', error);
      await ctx.reply('❌ Error approving retweet.');
    }
  });

  bot.command('admin_retweet_reject', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      await ctx.reply('❌ Access denied.');
      return;
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
      await ctx.reply('❌ Usage: /admin_retweet_reject <telegram_id> [reason]');
      return;
    }

    const targetUserId = parseInt(args[0], 10);
    const reason = args.slice(1).join(' ') || 'Requirements not met';

    if (isNaN(targetUserId)) {
      await ctx.reply('❌ Telegram ID must be a number.');
      return;
    }

    try {
      await db.markRetweetRejected(targetUserId, reason);
      await db.calculatePoints(targetUserId);

      await ctx.reply(`⚠️ Retweet rejected for user ${targetUserId}.`);

      try {
        await bot.telegram.sendMessage(
          targetUserId,
          `⚠️ Your retweet submission was rejected.\nReason: ${reason}\nPlease try again with a correct quote tweet using /retweet.`
        );
      } catch (err) {
        // ignore DM failures
      }
    } catch (error) {
      console.error('Error in /admin_retweet_reject:', error);
      await ctx.reply('❌ Error rejecting retweet.');
    }
  });

  // Admin Award Points Manually
  bot.command('admin_award', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      await ctx.reply('❌ Access denied.');
      return;
    }

    try {
      // Parse: /admin_award userid points reason
      const args = ctx.message.text.split(' ').slice(1);
      
      if (args.length < 2) {
        await ctx.reply('❌ Usage: /admin_award [userid] [points] [optional_reason]');
        return;
      }

      const targetUserId = parseInt(args[0]);
      const points = parseInt(args[1]);
      const reason = args.slice(2).join(' ') || 'manual_award';

      if (isNaN(targetUserId) || isNaN(points)) {
        await ctx.reply('❌ ID and points must be numbers!');
        return;
      }

      await db.addPoints(targetUserId, points, reason);
      await ctx.reply(`✅ Awarded ${points}p to user ${targetUserId}\n\nReason: ${reason}`);

      // Notify user
      try {
        await bot.telegram.sendMessage(
          targetUserId,
          `🎉 You received ${points} bonus points from admin!\n\nReason: ${reason}\n\nUse /score for details.`
        );
      } catch (err) {
        // User might have blocked bot
      }

    } catch (error) {
      console.error('Error in /admin_award:', error);
      await ctx.reply('❌ Error awarding points.');
    }
  });

  // Admin Disqualify
  bot.command('admin_disqualify', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      await ctx.reply('❌ Access denied.');
      return;
    }

    try {
      const args = ctx.message.text.split(' ').slice(1);
      
      if (args.length < 1) {
        await ctx.reply('❌ Usage: /admin_disqualify [userid] [optional_reason]');
        return;
      }

      const targetUserId = parseInt(args[0]);
      const reason = args.slice(1).join(' ') || 'fraud/violation';

      if (isNaN(targetUserId)) {
        await ctx.reply('❌ User ID must be a number!');
        return;
      }

      await db.disqualifyUser(targetUserId);
      await ctx.reply(`✅ User ${targetUserId} disqualified!\n\nReason: ${reason}`);

      // Notify user
      try {
        await bot.telegram.sendMessage(
          targetUserId,
          `⚠️ You have been disqualified from the contest.\n\nReason: ${reason}\n\nContact an admin if you believe this is a mistake.`
        );
      } catch (err) {
        // User might have blocked bot
      }

    } catch (error) {
      console.error('Error in /admin_disqualify:', error);
      await ctx.reply('❌ Eroare la disqualify.');
    }
  });

  // Admin Announce (broadcast to all)
  bot.command('admin_announce', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      await ctx.reply('❌ Acces interzis.');
      return;
    }

    try {
      const message = ctx.message.text.split(' ').slice(1).join(' ');
      
      if (!message) {
        await ctx.reply('❌ Usage: /admin_announce [message]');
        return;
      }

      const database = await db.connect();
      const users = await database.collection('users').find({ disqualified: false }).toArray();

      await ctx.reply(`📢 Sending broadcast to ${users.length} users...\n\nPlease wait...`);

      let sent = 0;
      let failed = 0;

      for (const user of users) {
        try {
          await bot.telegram.sendMessage(user.telegramId, `📢 OFFICIAL ANNOUNCEMENT:\n\n${message}`);
          sent++;
          
          // Delay pentru a evita rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (err) {
          failed++;
        }
      }

      await ctx.reply(`✅ Broadcast complet!\n\n📤 Trimis: ${sent}\n❌ Failed: ${failed}`);

    } catch (error) {
      console.error('Error in /admin_announce:', error);
      await ctx.reply('❌ Eroare la broadcast.');
    }
  });

  // Admin Export CSV
  bot.command('admin_export', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      await ctx.reply('❌ Acces interzis.');
      return;
    }

    try {
      const allUsers = await db.exportAllData();

      // Generate CSV
      let csv = 'Position,Username,TelegramID,Points,WalletAddress,Referrals,Eligible,Disqualified\n';
      
      allUsers.forEach((user, index) => {
        csv += `${index + 1},${user.username || 'N/A'},${user.telegramId},${user.points},${user.walletAddress || 'N/A'},${user.referrals?.length || 0},${user.points >= 50 ? 'YES' : 'NO'},${user.disqualified ? 'YES' : 'NO'}\n`;
      });

      // Trimite ca file
      await ctx.replyWithDocument({
        source: Buffer.from(csv),
        filename: `glowmin_contest_export_${new Date().toISOString().split('T')[0]}.csv`
      });

      await ctx.reply(`✅ Export complet!\n\nTotal users: ${allUsers.length}`);

    } catch (error) {
      console.error('Error in /admin_export:', error);
      await ctx.reply('❌ Eroare la export.');
    }
  });
};

// Helper function pentru task completion stats
async function getTaskCompletionStats(usersCollection) {
  const total = await usersCollection.countDocuments({ disqualified: false });
  
  const tgJoined = await usersCollection.countDocuments({ 'tasks.joinedTelegram': true, disqualified: false });
  const twitterFollowed = await usersCollection.countDocuments({ 'tasks.followedTwitter': true, disqualified: false });
  const discordJoined = await usersCollection.countDocuments({ 'tasks.joinedDiscord': true, disqualified: false });
  const walletsConnected = await usersCollection.countDocuments({ 'tasks.connectedWallet': true, disqualified: false });
  const traded = await usersCollection.countDocuments({ 'tasks.traded': true, disqualified: false });
  const retweeted = await usersCollection.countDocuments({ 'tasks.retweeted': true, disqualified: false });
  const memes = await usersCollection.countDocuments({ 'tasks.createdMeme': true, disqualified: false });

  const percent = (count) => total > 0 ? ((count / total) * 100).toFixed(1) : 0;

  return `
📝 Telegram: ${tgJoined}/${total} (${percent(tgJoined)}%)
🐦 Twitter: ${twitterFollowed}/${total} (${percent(twitterFollowed)}%)
💬 Discord: ${discordJoined}/${total} (${percent(discordJoined)}%)
💎 Wallets: ${walletsConnected}/${total} (${percent(walletsConnected)}%)
💰 Trades: ${traded}/${total} (${percent(traded)}%)
🔄 Retweets: ${retweeted}/${total} (${percent(retweeted)}%)
🎨 Memes: ${memes}/${total} (${percent(memes)}%)
  `.trim();
}

