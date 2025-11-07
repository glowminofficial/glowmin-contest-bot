/**
 * Bot message templates - All in English
 */

module.exports = {
  WELCOME: `
🔥 Welcome to GLOWMIN Genesis NFT Contest! 🔥

Participate and win one of 20 exclusive NFTs + GLOWMIN tokens!

🏆 Prizes:
• Top 10: Legendary/Epic/Rare NFT + 15k-100k GLOWMIN
• Random 10: Common/Uncommon NFT + 10k-15k GLOWMIN

📊 Your current score: {points} points
📍 Status: {status}

Use these commands:
/tasks - View available tasks
/score - Your detailed score
/referral - Your referral link
/leaderboard - Top 20 participants
/help - Help

Good luck! 🚀
  `,

  TASKS_LIST: `
📋 AVAILABLE TASKS:

━━━ BASIC TASKS ━━━
{joinTelegram} Join Telegram: 10p
{followTwitter} Follow Twitter: 10p
{joinDiscord} Join Discord: 10p

━━━ ADVANCED TASKS ━━━
{connectWallet} Connect Wallet: 20p
{tradeGlowmin} Trade min $10 GLOWMIN: 30p
{retweet} Retweet + tag 3 friends: 40p

━━━ BONUS TASKS ━━━
{createMeme} Create meme: 50p
{referrals} Referrals: 20p each

━━━━━━━━━━━━━━━━━━━━

📊 Total points: {totalPoints}
📍 Eligible for draw: {eligible}

Use /verify to re-check your tasks!
  `,

  SCORE_DETAILS: `
📊 YOUR DETAILED SCORE:

━━━ COMPLETED TASKS ━━━
{completedTasks}

━━━ TOTAL ━━━
Points: {totalPoints}
Referrals: {referralCount} (+{referralPoints}p)

━━━ STATUS ━━━
{status}

━━━ LEADERBOARD POSITION ━━━
#{position} out of {totalParticipants} participants

{encouragement}
  `,

  WALLET_CONNECT: `
💎 SOLANA WALLET CONNECTION

To receive 20 points, connect your Solana wallet:

Send your wallet address (starts with letters/numbers, ~44 characters).

Example: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

⚠️ Make sure you have GLOWMIN in your wallet for verification!
  `,

  REFERRAL_INFO: `
🎁 REFERRAL SYSTEM

Your personal link:
{referralLink}

📊 Statistics:
• Friends invited: {referralCount}
• Points from referrals: {referralPoints}

💰 You earn 20 points for each friend who:
1. Joins through your link
2. Completes minimum basic tasks (join TG + Twitter)

Share your link and increase your chances! 🚀
  `,

  TASK_COMPLETED: `✅ Task completed: {taskName} (+{points}p)`,
  
  TASK_ALREADY_DONE: `⚠️ You have already completed this task!`,
  
  NOT_ELIGIBLE: `❌ You are not eligible for the draw (minimum 50 points required)`,
  
  ELIGIBLE: `✅ You are eligible for the random draw!`,
  
  CONTEST_NOT_STARTED: `⏰ The contest starts on November 25, 2025!`,
  
  CONTEST_ENDED: `🏁 The contest has ended! Winners announced soon!`,

  RETWEET_INSTRUCTIONS: `
🔁 RETWEET TASK - 40 POINTS

1️⃣ Post a quote tweet from your linked account using this code: <code>{code}</code>
2️⃣ Mention at least 3 friends (@user1 @user2 @user3)
3️⃣ Include your thoughts about GLOWMIN

After you post, send the link using:
{tweetCommand}

Examples:
/submit_retweet https://twitter.com/username/status/1234567890

Tap the button below to copy the code.
  `,

  RETWEET_MISSING_URL: `⚠️ Please send the tweet link after the command. Example: {tweetCommand}`,
  RETWEET_INVALID_URL: `❌ Invalid link. Use a full tweet URL from twitter.com or x.com (quote tweet required).`,
  RETWEET_CHECKING: `🔎 Checking your tweet...`,
  RETWEET_FETCH_FAILED: `❌ Could not read that tweet. Make sure it is public and try again.`,
  RETWEET_SUCCESS: `✅ Retweet verified! 40 points added to your score.`,
  RETWEET_PENDING_REVIEW: `⌛ We could not verify all requirements automatically. An admin will review it soon.`,
  RETWEET_MISSING_CODE: `Add your unique code in the tweet text: {code}`,
  RETWEET_MISSING_MENTIONS: `Tag at least 3 friends using @username.`,
  RETWEET_WRONG_ACCOUNT: `❌ The tweet must be posted from the Twitter account you linked: {username}. Please repost from that account.`,
  RETWEET_INVALID_MENTIONS: `❌ Tag at least 3 valid Twitter handles (e.g. @friend1). Numeric-only tags are not accepted.`,
  RETWEET_ERROR: `❌ Something went wrong. Please try again or contact an admin.`,

  TWITTER_PROMPT: `🐦 **Twitter Account Setup**\n\nCurrent linked account: *{current}*\n\nTo link or update your account, send:\n\`/set_twitter your_username\`\n\nExample:\n\`/set_twitter glowmin_official\``,
  TWITTER_INVALID: `❌ Invalid Twitter username. Use only letters, numbers or underscore (max 15 characters).`,
  TWITTER_SUCCESS: `✅ Twitter account linked: {username}`,
  TWITTER_REMOVED: `✅ Twitter account disconnected.`,
  TWITTER_ERROR: `❌ Error updating Twitter username. Please try again.`,
  TWITTER_REQUIRED: `🐦 Please link your Twitter account first using /set_twitter before completing this task.`,

  DISCORD_CONNECT_DISABLED: `❌ Discord connect is currently unavailable. Please contact an admin.`,
  DISCORD_CONNECT_PROMPT: `🛡️ Connect your Discord account to verify membership.\n\nTap the button below to authorize and join the GLOWMIN server automatically.`,
  DISCORD_ALREADY_CONNECTED: `✅ Discord is already connected as {username}.`,
  DISCORD_CONNECTED: `✅ Discord account {username} connected!`,
  DISCORD_DISCONNECTED: `❌ Discord account disconnected.`,
  DISCORD_NOT_CONNECTED: `⚠️ No Discord account connected yet. Use /connect_discord.`,
  DISCORD_VERIFICATION_FAILED: `❌ Could not verify Discord membership. Please reconnect using /connect_discord.`,
  
  MEME_INSTRUCTIONS: `🖼️ **Create Meme Task – 50 points**\n\nLinked Twitter account: *{twitterStatus}*\n\n1️⃣ Create an original meme about GLOWMIN.\n2️⃣ Post it on Twitter (public) and tag @GlowMinOfficial + hashtag #GlowminMemeContest.\n3️⃣ Submit the tweet link with optional description:\n\`{submitCommand}\`\n\nExample:\n\`/submit_meme https://twitter.com/user/status/1234567890 | Glowmin cyberpunk meme\`\n\nAfter submission an admin will review it. Feedback will be sent via bot.`,
  MEME_MISSING_INPUT: `⚠️ Please send the tweet link and optional description using the format: {format}`,
  MEME_INVALID_URL: `❌ Invalid Twitter link. Send the full tweet URL (quote tweet or original post).`,
  MEME_SUBMITTED: `✅ Meme submitted for review!\n\n🔗 Link: {url}\n📝 Description: {description}\n\nAn admin will review it shortly.`,
  MEME_ERROR: `❌ Could not process your meme submission. Please try again.`,

  HELP: `
🤖 AVAILABLE COMMANDS:

📊 For You:
/start - Contest overview
/tasks - View tasks + status
/score - Detailed score
/wallet - Connect Solana wallet
/referral - Referral link + stats
/set_twitter - Link your Twitter account
/connect_discord - Link your Discord account
/meme - Meme task instructions
/submit_meme <link> | desc - Submit meme tweet for review
/retweet - Get your retweet code + instructions
/submit_retweet <link> - Submit quote tweet for verification
/leaderboard - Top 20
/verify - Re-verify tasks
/help - This message

🔗 Useful Links:
Telegram: https://t.me/GlowMinOfficialToken
Twitter: https://x.com/GlowMinOfficial
Discord: https://discord.gg/4X9tS3Hns2
Website: https://glowmin.alfanestlabs.xyz

Good luck! 🚀
  `
};

