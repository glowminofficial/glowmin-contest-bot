/**
 * Verificare membership Telegram group
 */

async function verifyTelegramMembership(bot, telegramId) {
  try {
    const groupId = process.env.TELEGRAM_GROUP_ID;
    
    if (!groupId) {
      console.error('❌ TELEGRAM_GROUP_ID not set in .env');
      return false;
    }

    // Verifică dacă user e membru în grup
    const member = await bot.telegram.getChatMember(groupId, telegramId);
    
    // Status-uri valide: creator, administrator, member
    const validStatuses = ['creator', 'administrator', 'member'];
    
    return validStatuses.includes(member.status);

  } catch (error) {
    // Dacă dă eroare, probabil nu e membru
    console.log(`⚠️ User ${telegramId} not in group or error:`, error.message);
    return false;
  }
}

module.exports = {
  verifyTelegramMembership
};

