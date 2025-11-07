const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const db = require('./database');

const stateStore = new Map();

function generateState(telegramId) {
  const state = crypto.randomBytes(16).toString('hex');
  stateStore.set(state, { telegramId, createdAt: Date.now() });
  return state;
}

function consumeState(state) {
  const entry = stateStore.get(state);
  if (entry) {
    stateStore.delete(state);
    const age = Date.now() - entry.createdAt;
    if (age < 5 * 60 * 1000) {
      return entry.telegramId;
    }
  }
  return null;
}

async function joinGuild(discordUserId, accessToken) {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!guildId || !botToken) {
    throw new Error('Missing DISCORD_GUILD_ID or DISCORD_BOT_TOKEN');
  }

  const url = `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`;

  await axios.put(
    url,
    {
      access_token: accessToken
    },
    {
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

function startDiscordAuthServer(bot) {
  if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET || !process.env.DISCORD_REDIRECT_URI) {
    console.warn('⚠️ Discord OAuth environment variables missing. Discord connect disabled.');
    return;
  }

  const app = express();

  app.get('/discord/login', async (req, res) => {
    try {
      const telegramId = parseInt(req.query.telegram_id, 10);
      if (!telegramId) {
        return res.status(400).send('Missing telegram_id');
      }

      const state = generateState(telegramId);
      const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
        response_type: 'code',
        scope: 'identify guilds.join',
        state
      });

      res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
    } catch (error) {
      console.error('Discord login redirect error:', error);
      res.status(500).send('Internal error');
    }
  });

  app.get('/discord/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
      console.error('Discord OAuth error:', error);
      return res.status(400).send('Authorization failed.');
    }

    const telegramId = consumeState(state);
    if (!telegramId) {
      return res.status(400).send('Invalid or expired state');
    }

    try {
      const tokenResponse = await axios.post(
        'https://discord.com/api/oauth2/token',
        new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID,
          client_secret: process.env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.DISCORD_REDIRECT_URI
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token: accessToken, token_type: tokenType } = tokenResponse.data;

      if (!accessToken || tokenType !== 'Bearer') {
        throw new Error('Invalid access token response');
      }

      const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      const discordUser = userResponse.data;

      await joinGuild(discordUser.id, accessToken);

      await db.setDiscordAccount(telegramId, {
        discordUserId: discordUser.id,
        discordUsername: discordUser.global_name || `${discordUser.username}#${discordUser.discriminator}`,
        verified: true
      });

      await db.updateTask(telegramId, 'joinedDiscord', true);
      await db.calculatePoints(telegramId);

      try {
        await bot.telegram.sendMessage(telegramId, '✅ Discord account connected and verified!');
      } catch (notifyErr) {
        console.warn('Failed to notify user after Discord connect:', notifyErr.message);
      }

      res.send('<html><body><h2>Discord account linked successfully!</h2><p>You can close this window.</p></body></html>');
    } catch (err) {
      console.error('Discord callback error:', err.response?.data || err.message);
      try {
        await db.removeDiscordAccount(telegramId);
      } catch (cleanupErr) {
        console.warn('Failed to reset Discord account on error:', cleanupErr.message);
      }
      res.status(500).send('Failed to connect Discord account. Please try again.');
    }
  });

  const port = process.env.DISCORD_AUTH_PORT || 4000;
  app.listen(port, () => {
    console.log(`🌐 Discord OAuth server running on port ${port}`);
  });
}

module.exports = {
  startDiscordAuthServer
};

