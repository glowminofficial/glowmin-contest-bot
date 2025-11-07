# 🚀 SETUP GUIDE - GLOWMIN Contest Bot

Ghid pas cu pas pentru a rula botul pe calculatorul tău!

---

## 📋 PREREQUISITE (Ce ai nevoie):

✅ **Node.js** v18+ (verifică cu `node --version`)  
✅ **MongoDB** (local SAU MongoDB Atlas FREE)  
✅ **Telegram Bot Token** (de la @BotFather)  
✅ **Group Chat ID** (ID-ul grupului Telegram)  

---

## 🛠️ STEP 1: Instalare Dependințe

**Deschide CMD în folderul botului:**

```bash
cd D:\backup\alfanest.digital\ALFANESTDIGITAL\glowmin-contest-bot
```

**Instalează pachetele:**

```bash
npm install
```

**Așteaptă 2-3 minute... Când vezi "added XX packages" → gata!**

---

## 🔑 STEP 2: Creează Bot Telegram

### A. Deschide @BotFather pe Telegram

1. Caută `@BotFather` pe Telegram
2. Trimite: `/newbot`
3. Nume bot: `GLOWMIN Contest Bot`
4. Username bot: `glowmin_contest_bot` (sau ce vrei, trebuie să fie unic)
5. @BotFather îți dă **TOKEN** → salvează-l!

**Exemplu token:** `6234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw`

### B. Setări Bot (opțional)

În @BotFather:
- `/setdescription` - Descriere bot
- `/setabouttext` - About text
- `/setcommands` - Setează comenzile

**Comenzi pentru /setcommands:**
```
start - Start bot și overview
tasks - Vezi taskuri disponibile
score - Punctajul tău
wallet - Conectează Solana wallet
referral - Link referral
leaderboard - Top 20 participanți
verify - Re-verifică taskuri
help - Ajutor comenzi
```

---

## 🆔 STEP 3: Găsește Group Chat ID

**Metoda 1 (Simplă):**

1. Adaugă `@RawDataBot` în grupul tău
2. Bot-ul trimite un mesaj cu toate datele
3. Caută `"id": -1001234567890` → ăsta e Group ID
4. Șterge @RawDataBot

**Metoda 2 (Manual):**

1. Adaugă botul tău în grup (temporary)
2. Trimite un mesaj în grup
3. Deschide: `https://api.telegram.org/bot[YOUR_BOT_TOKEN]/getUpdates`
4. Caută `"chat":{"id":-1001234567890}` → ăsta e Group ID

---

## 💾 STEP 4: MongoDB Setup

### Opțiunea A: MongoDB Local (mai simplu pentru test)

**Skip acest pas și folosește:**
```
MONGODB_URI=mongodb://localhost:27017/glowmin-contest
```

Bot-ul va folosi in-memory sau file-based temporary database pentru test.

### Opțiunea B: MongoDB Atlas (FREE, cloud, recomandat)

1. **Signup:** https://www.mongodb.com/cloud/atlas/register
2. **Create FREE Cluster** (M0 Sandbox - FREE forever)
3. **Database Access:** Create user + password
4. **Network Access:** Add IP `0.0.0.0/0` (allow all)
5. **Connect:** Copy connection string

**Connection string arată așa:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/glowmin-contest
```

---

## ⚙️ STEP 5: Configurare .env

**Creează fișier `.env` în folderul botului:**

```bash
# În Windows, folosește Notepad:
notepad .env
```

**Copiază din `.env.template` și completează:**

```env
# Telegram Bot Configuration
BOT_TOKEN=6234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
TELEGRAM_GROUP_ID=-1001234567890
TELEGRAM_GROUP_LINK=https://t.me/glowminraiders
ADMIN_USER_IDS=123456789,987654321

# MongoDB Configuration  
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/glowmin-contest

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
GLOWMIN_TOKEN_MINT=FdaWtGGTfnWq8MU9ToCGBTQspuXhxyGpRjqY7M55V62n

# Contest Configuration
CONTEST_START_DATE=2025-11-25T00:00:00Z
CONTEST_END_DATE=2025-12-15T23:59:59Z
MIN_POINTS_FOR_DRAW=50

# Optional
DISCORD_INVITE_LINK=https://discord.gg/glowmin
```

**Salvează și închide!**

---

## 🚀 STEP 6: Rulează Bot-ul!

**În CMD:**

```bash
npm start
```

**Sau pentru development (cu auto-reload):**

```bash
npm run dev
```

**Dacă vezi:**
```
✅ Connected to MongoDB
🤖 GLOWMIN Contest Bot starting...
✅ Bot is running!
```

**SUCCES! Botul funcționează! 🎉**

---

## 🧪 STEP 7: Testare

### Test în privat (DM botului):

1. Caută botul pe Telegram (@glowmin_contest_bot)
2. Trimite `/start`
3. Testează comenzile:
   - `/tasks`
   - `/score`
   - `/wallet` → trimite un wallet address
   - `/referral`
   - `/leaderboard`

### Test în grup:

1. Adaugă botul în grupul de test
2. Dă-i admin rights (pentru a verifica members)
3. Testează `/start` în grup
4. Verifică `/admin_stats` (dacă ești admin)

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module 'telegraf'"
**Fix:** `npm install`

### Error: "BOT_TOKEN not found"
**Fix:** Verifică că ai `.env` file cu BOT_TOKEN

### Error: "MongoServerError: Authentication failed"
**Fix:** Verifică username/password în MONGODB_URI

### Bot nu răspunde în grup
**Fix:** Dă-i admin rights în grup SAU disable "Privacy Mode" în @BotFather:
- `/setprivacy` → Disable

### Error: "Forbidden: bot was blocked by the user"
**Fix:** Normal când user a blocat botul. Ignore error.

---

## 📊 COMENZI DISPONIBILE:

### User Commands:
- `/start` - Start bot
- `/tasks` - Vezi taskuri
- `/score` - Punctaj detaliat
- `/wallet` - Connect wallet
- `/referral` - Link referral
- `/leaderboard` - Top 20
- `/verify` - Re-check tasks
- `/help` - Ajutor

### Admin Commands:
- `/admin_stats` - Statistici generale
- `/admin_leaderboard` - Full leaderboard
- `/admin_draw` - Random winner selection
- `/admin_award [userid] [points]` - Award manual
- `/admin_disqualify [userid]` - Descalifică
- `/admin_announce [message]` - Broadcast
- `/admin_export` - Export CSV

---

## 🌐 STEP 8: Deploy Production (când e gata de launch)

### Render.com (FREE)

1. Push code la GitHub
2. https://render.com/ → Sign up
3. New → Web Service
4. Connect GitHub repo
5. Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Environment Variables: Add toate din `.env`
7. Deploy!

**Bot-ul va rula 24/7 gratuit pe Render!**

---

## ✅ GATA!

Bot-ul e funcțional și gata de test!

**Următorii pași:**
1. ✅ Test complet în grup privat
2. ✅ Fix bugs dacă apar
3. ✅ Deploy pe Render când e perfect
4. 🚀 Launch concursul pe 25 Noiembrie!

---

**Dacă ai probleme, contactează devii sau check logs în terminal!** 🤖

