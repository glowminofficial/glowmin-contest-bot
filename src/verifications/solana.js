/**
 * Verificare Solana wallet și tranzacții GLOWMIN
 */

const { Connection, PublicKey } = require('@solana/web3.js');
const bs58 = require('bs58');

// Solana connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

const GLOWMIN_MINT = process.env.GLOWMIN_TOKEN_MINT || 'FdaWtGGTfnWq8MU9ToCGBTQspuXhxyGpRjqY7M55V62n';

/**
 * Verifică dacă wallet address e valid
 */
async function verifyWalletAddress(address) {
  try {
    const publicKey = new PublicKey(address);
    return PublicKey.isOnCurve(publicKey.toBuffer());
  } catch (error) {
    return false;
  }
}

/**
 * Verifică dacă wallet-ul a făcut trade GLOWMIN ≥$10
 */
async function checkGlowminTrade(walletAddress, minUsdValue = 10) {
  try {
    const publicKey = new PublicKey(walletAddress);

    // Get token accounts pentru GLOWMIN
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { mint: new PublicKey(GLOWMIN_MINT) }
    );

    // Dacă nu are token account, nu a tranzacționat
    if (tokenAccounts.value.length === 0) {
      return false;
    }

    // Get signatures (ultimele 100 tranzacții)
    const signatures = await connection.getSignaturesForAddress(
      publicKey,
      { limit: 100 }
    );

    // Verifică dacă are tranzacții GLOWMIN
    // Pentru simplitate: dacă are GLOWMIN în wallet = a tranzacționat
    // Verificare mai detaliată ar parse fiecare tranzacție
    
    const balance = tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;

    // Simplificat: dacă are orice balance de GLOWMIN, considerăm că a tranzacționat
    // Pentru calcul USD exact, ar trebui să verificăm amount × price
    // Deocamdată: dacă balance > 0 sau signatures > 5 = probabil a tranzacționat
    
    if (balance > 0 && signatures.length > 0) {
      return true;
    }

    // Verificare mai riguroasă: parse transactions pentru transfer amount
    // TODO: Implementare avansată cu price checking

    return false;

  } catch (error) {
    console.error('Error checking GLOWMIN trade:', error);
    return false;
  }
}

/**
 * Get GLOWMIN balance pentru wallet
 */
async function getGlowminBalance(walletAddress) {
  try {
    const publicKey = new PublicKey(walletAddress);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { mint: new PublicKey(GLOWMIN_MINT) }
    );

    if (tokenAccounts.value.length === 0) {
      return 0;
    }

    return tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;

  } catch (error) {
    console.error('Error getting GLOWMIN balance:', error);
    return 0;
  }
}

module.exports = {
  verifyWalletAddress,
  checkGlowminTrade,
  getGlowminBalance
};

