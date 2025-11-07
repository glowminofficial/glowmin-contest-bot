const axios = require('axios');

async function verifyDiscordMembership(discordUserId) {
  if (!discordUserId || !process.env.DISCORD_GUILD_ID || !process.env.DISCORD_BOT_TOKEN) {
    return false;
  }

  const url = `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordUserId}`;

  try {
    await axios.get(url, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    });
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false;
    }
    console.error('Discord membership check failed:', error.response?.data || error.message);
    return false;
  }
}

module.exports = {
  verifyDiscordMembership
};

