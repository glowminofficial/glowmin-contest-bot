const MESSAGES = require('../config/messages');

module.exports = (bot) => {
  bot.command('help', async (ctx) => {
    await ctx.reply(MESSAGES.HELP);
  });
};

