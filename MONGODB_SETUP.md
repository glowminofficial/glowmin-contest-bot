# 🗄️ MongoDB Setup Guide

## Opțiunea 1: MongoDB Atlas (Cloud - RECOMANDAT) ⭐

### Pasul 1: Creează cont MongoDB Atlas
1. Mergi pe: https://www.mongodb.com/cloud/atlas/register
2. Înregistrează-te cu email (gratuit)
3. Completează formularul (nume, companie, etc.)

### Pasul 2: Creează un Cluster Gratuit
1. După login, selectează **"Build a Database"**
2. Alege planul **FREE** (M0 Sandbox)
3. Selectează **Cloud Provider**: AWS (sau orice)
4. Selectează **Region**: cel mai apropiat de tine (ex: Frankfurt, Europe)
5. Click **"Create"** (îți ia ~3-5 minute)

### Pasul 3: Configurează Security
1. La "Create Database User":
   - Username: `glowminbot` (sau orice)
   - Password: **GENEREAZĂ UN PAROL PUTERNIC** (salvează-l!)
   - Click **"Create User"**

2. La "Network Access":
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** (sau adaugă IP-ul tău)
   - Click **"Confirm"**

### Pasul 4: Obține Connection String
1. Click **"Connect"** pe cluster-ul tău
2. Selectează **"Connect your application"**
3. Driver: **Node.js**, Version: **5.5 or later**
4. Copiază connection string-ul (arată așa):
   ```
   mongodb+srv://glowminbot:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Pasul 5: Actualizează .env
1. Deschide `glowmin-contest-bot/.env`
2. Înlocuiește `<password>` cu parola ta reală din Pasul 3
3. Adaugă numele bazei de date la final (opțional, dar recomandat):
   ```
   mongodb+srv://glowminbot:PAROLA_TA@cluster0.xxxxx.mongodb.net/glowmin_contest?retryWrites=true&w=majority
   ```
4. Salvează fișierul

### Pasul 6: Testează conexiunea
```bash
npm start
```

Ar trebui să vezi: `✅ Connected to MongoDB`

---

## Opțiunea 2: MongoDB Local (Avansat)

Dacă vrei să rulezi MongoDB pe mașina ta:

1. **Descarcă MongoDB Community Server:**
   - Windows: https://www.mongodb.com/try/download/community
   - Selectează: Windows, MSI, x64

2. **Instalează MongoDB:**
   - Rulează installer-ul
   - Alege "Complete" installation
   - Bifează "Install MongoDB as a Service"
   - Completează instalarea

3. **Verifică că rulează:**
   ```bash
   # În CMD (ca Administrator)
   net start MongoDB
   ```

4. **Actualizează .env:**
   ```
   MONGODB_URI=mongodb://localhost:27017/glowmin_contest
   ```

---

## 🆘 Probleme?

**Dacă apare eroare de conexiune:**
- Verifică că ai înlocuit `<password>` în connection string
- Verifică că ai adăugat IP-ul tău în Network Access (Atlas)
- Verifică că parola nu conține caractere speciale (dacă da, URL-encode-le: `@` → `%40`)

**Dacă MongoDB local nu pornește:**
- Verifică serviciul în "Services" (services.msc)
- Rulează CMD ca Administrator

