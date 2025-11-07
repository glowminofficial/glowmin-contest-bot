const db = require('../database');
const { verifyWalletAddress, checkGlowminTrade } = require('../verifications/solana');
const POINTS = require('../config/points');
const MESSAGES = require('../config/messages');

module.exports = (bot) => {
  bot.command('wallet', async (ctx) => {
    await ctx.reply(MESSAGES.WALLET_CONNECT);
  });

  // Handler pentru când user trimite wallet address
  bot.hears(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, async (ctx) => {
    try {
      const telegramId = ctx.from.id;
      const walletAddress = ctx.message.text.trim();

      // Verifică dacă adresa e validă
      const isValid = await verifyWalletAddress(walletAddress);
      
      if (!isValid) {
        await ctx.reply('❌ Invalid wallet address! Please check and try again.');
        return;
      }

      // Verifică dacă wallet-ul nu e deja folosit
      // (Anti-fraud: 1 wallet = 1 user)
      const existingUser = await db.connect().then(database => 
        database.collection('users').findOne({ 
          walletAddress,
          telegramId: { $ne: telegramId }
        })
      );

      if (existingUser) {
        await ctx.reply('❌ This wallet is already connected to another account!');
        return;
      }

      // Salvează wallet
      await db.connectWallet(telegramId, walletAddress);
      await db.updateTask(telegramId, 'connectedWallet', true);
      await db.addPoints(telegramId, POINTS.CONNECT_WALLET, 'wallet_connect');

      await ctx.reply(`✅ Wallet connected successfully!\n\n+${POINTS.CONNECT_WALLET} points\n\n💰 Now trade minimum $10 GLOWMIN for ${POINTS.TRADE_GLOWMIN} more points!\n\nUse /verify to check your transactions.`);

    } catch (error) {
      console.error('Error in wallet handler:', error);
      await ctx.reply('❌ Error connecting wallet.');
    }
  });
};

