# 🤖 GLOWMIN Contest Bot

Bot Telegram pentru tracking automat al punctelor în concursul Genesis NFT Collection.

## 📋 Features

- ✅ Tracking automat puncte pentru taskuri
- ✅ Verificare join Telegram
- ✅ Conectare wallet Solana
- ✅ Verificare tranzacții GLOWMIN
- ✅ Sistem de referral cu link-uri unice
- ✅ Leaderboard live
- ✅ Admin commands pentru management
- ✅ Random winner selection
- ✅ Export CSV pentru transparență

## 🚀 Quick Start

### 1. Instalare Dependințe

```bash
npm install
```

### 2. Configurare

Copiază `.env.example` la `.env` și completează:

```bash
cp .env.example .env
```

Editează `.env` cu tokenurile tale:
- `BOT_TOKEN`: Token de la @BotFather
- `MONGODB_URI`: Connection string MongoDB
- `TELEGRAM_GROUP_ID`: ID-ul grupului tău
- `ADMIN_USER_IDS`: ID-uri admini (separate prin virgulă)

### 3. Rulare

**Development (cu auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## 📚 Comenzi Bot

### User Commands

- `/start` - Start bot și overview contest
- `/tasks` - Vezi toate taskurile și status
- `/score` - Punctajul tău total
- `/referral` - Link-ul tău de referral
- `/leaderboard` - Top 20 participanți
- `/wallet` - Conectează wallet Solana
- `/verify` - Re-verifică toate taskurile
- `/help` - Ajutor comenzi

### Admin Commands

- `/admin_stats` - Statistici generale
- `/admin_leaderboard` - Leaderboard complet
- `/admin_draw` - Alege câștigători random (min 50p)
- `/admin_award [userid] [points]` - Award manual puncte
- `/admin_disqualify [userid]` - Descalifică user
- `/admin_announce [message]` - Broadcast la toți userii
- `/admin_export` - Export CSV cu toate datele

## 🏗️ Structură Proiect

```
glowmin-contest-bot/
├── src/
│   ├── index.js              # Entry point
│   ├── bot.js                # Bot setup și comenzi
│   ├── database.js           # MongoDB connection și queries
│   ├── pointsEngine.js       # Logică calculare puncte
│   ├── verifications/
│   │   ├── telegram.js       # Verificare join TG
│   │   ├── solana.js         # Verificare wallet + trades
│   │   ├── twitter.js        # Verificare Twitter (optional)
│   │   └── discord.js        # Verificare Discord (optional)
│   ├── utils/
│   │   ├── referrals.js      # Sistem referral
│   │   ├── leaderboard.js    # Generare leaderboard
│   │   └── helpers.js        # Helper functions
│   └── config/
│       ├── points.js         # Configurare puncte per task
│       └── messages.js       # Template-uri mesaje
├── .env                      # Configurare (NU se pune pe Git!)
├── .env.example              # Template pentru configurare
├── .gitignore
├── package.json
└── README.md
```

## 🔧 Tech Stack

- **Node.js** v18+
- **Telegraf.js** v4 - Framework Telegram Bot
- **MongoDB** - Database
- **@solana/web3.js** - Verificare Solana wallet
- **Axios** - HTTP requests pentru APIs
- **dotenv** - Environment variables

## 📊 Database Schema

### Users Collection
```javascript
{
  telegramId: Number,
  username: String,
  walletAddress: String,
  points: Number,
  tasks: {
    joinedTelegram: Boolean,
    followedTwitter: Boolean,
    joinedDiscord: Boolean,
    connectedWallet: Boolean,
    traded: Boolean,
    retweeted: Boolean,
    createdMeme: Boolean
  },
  referrals: [telegramId],
  referredBy: Number,
  createdAt: Date,
  disqualified: Boolean
}
```

## 🚀 Deployment

### Local Testing
```bash
npm run dev
```

### Production (Render.com FREE)
1. Push repo la GitHub
2. Connect Render la repo
3. Add environment variables
4. Deploy automatic!

## 📝 License

MIT

