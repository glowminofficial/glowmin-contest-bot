const { MongoClient } = require('mongodb');
require('dotenv').config();

let db = null;
let client = null;

/**
 * Conectare la MongoDB
 */
async function connect() {
  if (db) return db;

  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Găsește sau creează user
 */
async function getOrCreateUser(telegramId, username, referredBy = null) {
  const database = await connect();
  const users = database.collection('users');

  let user = await users.findOne({ telegramId });

  if (!user) {
    user = {
      telegramId,
      username,
      walletAddress: null,
      points: 0,
      tasks: {
        joinedTelegram: true, // Auto true când scrie /start
        followedTwitter: false,
        joinedDiscord: false,
        connectedWallet: false,
        traded: false,
        retweeted: false,
        createdMeme: false
      },
      referrals: [],
      referredBy: referredBy,
      createdAt: new Date(),
      disqualified: false,
      lastUpdated: new Date(),
      twitterUsername: null,
      twitterLinkedAt: null,
      retweetCode: null,
      retweetStatus: 'not_started',
      retweetTweetUrl: null,
      retweetSubmittedAt: null,
      memeStatus: 'not_started',
      memeTweetUrl: null,
      memeDescription: null,
      memeSubmittedAt: null,
      memePlatform: 'twitter',
      discordUserId: null,
      discordUsername: null,
      discordLinkedAt: null,
      discordVerified: false
    };

    await users.insertOne(user);
    console.log(`✅ New user created: ${username} (${telegramId})`);

    // Dacă a fost referit de cineva, adaugă puncte referrer-ului
    if (referredBy) {
      await addReferralPoints(referredBy, telegramId);
    }
  } else {
    const updates = {};

    if (typeof user.retweetCode === 'undefined') updates.retweetCode = null;
    if (typeof user.retweetStatus === 'undefined') updates.retweetStatus = 'not_started';
    if (typeof user.retweetTweetUrl === 'undefined') updates.retweetTweetUrl = null;
    if (typeof user.retweetSubmittedAt === 'undefined') updates.retweetSubmittedAt = null;
    if (typeof user.twitterUsername === 'undefined') updates.twitterUsername = null;
    if (typeof user.twitterLinkedAt === 'undefined') updates.twitterLinkedAt = null;
    if (typeof user.memeStatus === 'undefined') updates.memeStatus = 'not_started';
    if (typeof user.memeTweetUrl === 'undefined') updates.memeTweetUrl = null;
    if (typeof user.memeDescription === 'undefined') updates.memeDescription = null;
    if (typeof user.memeSubmittedAt === 'undefined') updates.memeSubmittedAt = null;
    if (typeof user.memePlatform === 'undefined') updates.memePlatform = 'twitter';
    if (typeof user.discordUserId === 'undefined') updates.discordUserId = null;
    if (typeof user.discordUsername === 'undefined') updates.discordUsername = null;
    if (typeof user.discordLinkedAt === 'undefined') updates.discordLinkedAt = null;
    if (typeof user.discordVerified === 'undefined') updates.discordVerified = false;

    if (Object.keys(updates).length > 0) {
      updates.lastUpdated = new Date();
      await users.updateOne({ telegramId }, { $set: updates });
      user = { ...user, ...updates };
    }
  }

  return user;
}

function generateRetweetCode() {
  const base = Math.random().toString(36).substring(2, 7).toUpperCase();
  const digits = Math.floor(100 + Math.random() * 900);
  return `GLOW-${base}${digits}`;
}

/**
 * Update task pentru user
 */
async function updateTask(telegramId, taskName, completed = true) {
  const database = await connect();
  const users = database.collection('users');

  const updateField = `tasks.${taskName}`;
  
  await users.updateOne(
    { telegramId },
    { 
      $set: { 
        [updateField]: completed,
        lastUpdated: new Date()
      }
    }
  );
}

/**
 * Adaugă puncte pentru user
 */
async function addPoints(telegramId, points, reason = '') {
  const database = await connect();
  const users = database.collection('users');

  await users.updateOne(
    { telegramId },
    { 
      $inc: { points },
      $set: { lastUpdated: new Date() }
    }
  );

  console.log(`📈 Added ${points}p to user ${telegramId} (${reason})`);
}

/**
 * Conectare wallet
 */
async function connectWallet(telegramId, walletAddress) {
  const database = await connect();
  const users = database.collection('users');

  await users.updateOne(
    { telegramId },
    { 
      $set: { 
        walletAddress,
        'tasks.connectedWallet': true,
        lastUpdated: new Date()
      }
    }
  );
}

/**
 * Adaugă referral și puncte
 */
async function addReferralPoints(referrerTelegramId, newUserTelegramId) {
  const database = await connect();
  const users = database.collection('users');

  // Verifică că new user a completat taskurile minime
  const newUser = await users.findOne({ telegramId: newUserTelegramId });
  
  if (newUser && newUser.tasks.joinedTelegram) {
    // Adaugă referral la referrer
    await users.updateOne(
      { telegramId: referrerTelegramId },
      { 
        $push: { referrals: newUserTelegramId },
        $inc: { points: 20 }
      }
    );

    console.log(`🎁 Referral bonus: ${referrerTelegramId} → ${newUserTelegramId}`);
  }
}

/**
 * Calculează punctele totale pentru user
 */
async function calculatePoints(telegramId) {
  const POINTS = require('./config/points');
  const database = await connect();
  const users = database.collection('users');

  const user = await users.findOne({ telegramId });
  if (!user) return 0;

  let total = 0;

  // Task points
  if (user.tasks.joinedTelegram) total += POINTS.JOIN_TELEGRAM;
  if (user.tasks.followedTwitter) total += POINTS.FOLLOW_TWITTER;
  if (user.tasks.joinedDiscord) total += POINTS.JOIN_DISCORD;
  if (user.tasks.connectedWallet) total += POINTS.CONNECT_WALLET;
  if (user.tasks.traded) total += POINTS.TRADE_GLOWMIN;
  if (user.tasks.retweeted) total += POINTS.RETWEET_ANNOUNCEMENT;
  if (user.tasks.createdMeme) total += POINTS.CREATE_MEME;

  // Referral points
  total += (user.referrals?.length || 0) * POINTS.REFERRAL;

  // Update total în DB dacă e diferit
  if (user.points !== total) {
    await users.updateOne(
      { telegramId },
      { $set: { points: total, lastUpdated: new Date() } }
    );
  }

  return total;
}

/**
 * Leaderboard
 */
async function getLeaderboard(limit = 20) {
  const database = await connect();
  const users = database.collection('users');

  return await users
    .find({ disqualified: false })
    .sort({ points: -1 })
    .limit(limit)
    .toArray();
}

/**
 * Pozitia user-ului în leaderboard
 */
async function getUserPosition(telegramId) {
  const database = await connect();
  const users = database.collection('users');

  const user = await users.findOne({ telegramId });
  if (!user) return null;

  const position = await users.countDocuments({
    points: { $gt: user.points },
    disqualified: false
  });

  return position + 1;
}

/**
 * Total participanți
 */
async function getTotalParticipants() {
  const database = await connect();
  const users = database.collection('users');
  return await users.countDocuments({ disqualified: false });
}

/**
 * Useri eligibili pentru draw (≥50 puncte)
 */
async function getEligibleUsers() {
  const database = await connect();
  const users = database.collection('users');

  return await users
    .find({ 
      points: { $gte: 50 },
      disqualified: false 
    })
    .toArray();
}

/**
 * Export all data pentru CSV
 */
async function exportAllData() {
  const database = await connect();
  const users = database.collection('users');

  return await users
    .find()
    .sort({ points: -1 })
    .toArray();
}

/**
 * Descalifică user
 */
async function disqualifyUser(telegramId) {
  const database = await connect();
  const users = database.collection('users');

  await users.updateOne(
    { telegramId },
    { 
      $set: { 
        disqualified: true,
        lastUpdated: new Date()
      }
    }
  );
}

async function ensureRetweetCode(telegramId) {
  const database = await connect();
  const users = database.collection('users');

  const user = await users.findOne({ telegramId });
  if (!user) return null;

  if (user.retweetCode) {
    return user.retweetCode;
  }

  const code = generateRetweetCode();
  await users.updateOne(
    { telegramId },
    { 
      $set: { 
        retweetCode: code,
        retweetStatus: 'code_generated',
        lastUpdated: new Date()
      }
    }
  );

  return code;
}

async function updateRetweetSubmission(telegramId, data = {}) {
  const database = await connect();
  const users = database.collection('users');

  const update = {
    lastUpdated: new Date(),
    ...('retweetStatus' in data ? { retweetStatus: data.retweetStatus } : {}),
    ...('retweetTweetUrl' in data ? { retweetTweetUrl: data.retweetTweetUrl } : {}),
    ...('retweetSubmittedAt' in data ? { retweetSubmittedAt: data.retweetSubmittedAt } : {})
  };

  if (Object.keys(update).length > 1) {
    await users.updateOne({ telegramId }, { $set: update });
  }
}

async function markRetweetApproved(telegramId, tweetUrl) {
  const database = await connect();
  const users = database.collection('users');

  const user = await users.findOne({ telegramId });
  if (!user) return { alreadyCompleted: false };

  const alreadyCompleted = !!(user.tasks && user.tasks.retweeted);

  await users.updateOne(
    { telegramId },
    { 
      $set: { 
        'tasks.retweeted': true,
        retweetStatus: 'approved',
        retweetTweetUrl: tweetUrl,
        retweetSubmittedAt: new Date(),
        lastUpdated: new Date()
      },
      $unset: { retweetRejectReason: '' }
    }
  );

  return { alreadyCompleted };
}

async function markRetweetPending(telegramId, tweetUrl) {
  await updateRetweetSubmission(telegramId, {
    retweetStatus: 'pending_review',
    retweetTweetUrl: tweetUrl,
    retweetSubmittedAt: new Date()
  });
}

async function markRetweetRejected(telegramId, reason = null) {
  const database = await connect();
  const users = database.collection('users');

  const update = {
    retweetStatus: 'rejected',
    lastUpdated: new Date()
  };

  if (reason) {
    update.retweetRejectReason = reason;
  }

  await users.updateOne(
    { telegramId },
    { 
      $set: { 
        ...update,
        'tasks.retweeted': false
      },
      $unset: { retweetTweetUrl: '', retweetSubmittedAt: '' }
    }
  );
}

async function getPendingRetweets(limit = 20) {
  const database = await connect();
  const users = database.collection('users');

  return await users
    .find({ retweetStatus: 'pending_review', disqualified: false })
    .sort({ retweetSubmittedAt: -1 })
    .limit(limit)
    .toArray();
}

async function setTwitterUsername(telegramId, twitterUsername) {
  const database = await connect();
  const users = database.collection('users');

  await users.updateOne(
    { telegramId },
    { 
      $set: {
        twitterUsername,
        twitterLinkedAt: new Date(),
        lastUpdated: new Date()
      }
    }
  );
}

async function removeTwitterUsername(telegramId) {
  const database = await connect();
  const users = database.collection('users');

  await users.updateOne(
    { telegramId },
    { 
      $set: {
        twitterUsername: null,
        twitterLinkedAt: null,
        lastUpdated: new Date()
      }
    }
  );
}

async function markMemePending(telegramId, { platform = 'twitter', url, description }) {
  const database = await connect();
  const users = database.collection('users');

  await users.updateOne(
    { telegramId },
    {
      $set: {
        memeStatus: 'pending_review',
        memePlatform: platform,
        memeTweetUrl: url,
        memeDescription: description || null,
        memeSubmittedAt: new Date(),
        lastUpdated: new Date()
      }
    }
  );
}

async function markMemeApproved(telegramId, { platform = 'twitter', url, description } = {}) {
  const database = await connect();
  const users = database.collection('users');

  await users.updateOne(
    { telegramId },
    {
      $set: {
        memeStatus: 'approved',
        memePlatform: platform || 'twitter',
        memeTweetUrl: url || null,
        memeDescription: description || null,
        memeSubmittedAt: new Date(),
        'tasks.createdMeme': true,
        lastUpdated: new Date()
      }
    }
  );
}

async function markMemeRejected(telegramId, reason = null) {
  const database = await connect();
  const users = database.collection('users');

  const update = {
    memeStatus: 'rejected',
    lastUpdated: new Date()
  };

  if (reason) {
    update.memeRejectReason = reason;
  }

  await users.updateOne(
    { telegramId },
    {
      $set: update,
      $unset: { memeTweetUrl: '', memeDescription: '', memeSubmittedAt: '' }
    }
  );
}

async function getPendingMemes(limit = 20) {
  const database = await connect();
  const users = database.collection('users');

  return await users
    .find({ memeStatus: 'pending_review', disqualified: false })
    .sort({ memeSubmittedAt: -1 })
    .limit(limit)
    .toArray();
}

async function getUserById(telegramId) {
  const database = await connect();
  const users = database.collection('users');
  return await users.findOne({ telegramId });
}

async function setDiscordAccount(telegramId, { discordUserId, discordUsername, verified = true }) {
  const database = await connect();
  const users = database.collection('users');

  await users.updateOne(
    { telegramId },
    {
      $set: {
        discordUserId,
        discordUsername,
        discordLinkedAt: new Date(),
        discordVerified: verified,
        'tasks.joinedDiscord': true,
        lastUpdated: new Date()
      }
    }
  );
}

async function removeDiscordAccount(telegramId) {
  const database = await connect();
  const users = database.collection('users');

  await users.updateOne(
    { telegramId },
    {
      $set: {
        discordUserId: null,
        discordUsername: null,
        discordLinkedAt: null,
        discordVerified: false,
        'tasks.joinedDiscord': false,
        lastUpdated: new Date()
      }
    }
  );
}

module.exports = {
  connect,
  getOrCreateUser,
  updateTask,
  addPoints,
  connectWallet,
  addReferralPoints,
  calculatePoints,
  getLeaderboard,
  getUserPosition,
  getTotalParticipants,
  getEligibleUsers,
  exportAllData,
  disqualifyUser,
  ensureRetweetCode,
  updateRetweetSubmission,
  markRetweetApproved,
  markRetweetPending,
  markRetweetRejected,
  getPendingRetweets,
  setTwitterUsername,
  removeTwitterUsername,
  markMemePending,
  markMemeApproved,
  markMemeRejected,
  getPendingMemes,
  getUserById,
  setDiscordAccount,
  removeDiscordAccount
};

