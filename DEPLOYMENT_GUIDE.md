# 🚀 AngelOs Complete Deployment Guide

## Status: ✅ Production Ready

---

## Part 1: Supabase Setup (Backend)

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Name: `AngelOs`
4. Database Password: (save this!)
5. Region: Choose closest to you (Tokyo for Japan)

### Step 2: Deploy Edge Functions

**Option A: Via Dashboard (Easiest)**

1. Go to **Edge Functions** in Supabase dashboard
2. Click **New Function**
3. Name: `api`
4. Paste code from: `supabase/functions/api/index.ts`
5. Click **Deploy**

Repeat for `voice-agent` function.

**Option B: Via CLI (Recommended)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy
```

### Step 3: Add Secrets (Environment Variables)

In **Edge Functions → Secrets**, add:

```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_secret
OPENAI_API_KEY=sk-your_openai_key
AGENT_HTTP_BASE_URL=https://your-railway-url.com
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 4: Get Your URLs

Note these down:
- **Supabase URL:** `https://hhzegavoyuicclsmrkwf.supabase.co`
- **Anon Key:** (from Settings → API)
- **Service Role Key:** (from Settings → API)

---

## Part 2: Railway Deployment (Voice Agent)

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project: `AngelOs Voice Agent`

### Step 2: Deploy from GitHub

1. Click **New** → **GitHub Repo**
2. Select: `angelsbeauty-ai/ANGELOS_PHASE6`
3. Choose branch: `main`
4. Root directory: `apps/voice-agent`

### Step 3: Configure Environment Variables

In Railway dashboard → **Variables**, add:

```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_secret
OPENAI_API_KEY=sk-your_openai_key
SUPABASE_URL=https://hhzegavoyuicclsmrkwf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=8787
NODE_ENV=production
```

### Step 4: Deploy

1. Click **Deploy**
2. Wait for build (~2-3 minutes)
3. Copy the generated URL: `https://angelos-voice.up.railway.app`

### Step 5: Update Supabase Secret

Go back to Supabase → **Edge Functions → Secrets**

Update:
```
AGENT_HTTP_BASE_URL=https://angelos-voice.up.railway.app
```

---

## Part 3: Mobile App (Expo)

### Step 1: Install Dependencies

```bash
cd apps/mobile
npm install
```

### Step 2: Start Dev Server

**Method 1: Local Network (Recommended)**

```bash
npm start
```

- Make sure phone and computer are on SAME Wi-Fi
- Scan QR code with Expo Go app

**Method 2: Tunnel (If local fails)**

```bash
npm start -- --tunnel
```

### Step 3: Test on Phone

1. Install **Expo Go** (App Store / Play Store)
2. Scan QR code
3. Test Hermes voice, planner, settings

---

## Part 4: Production Build (App Store)

### Step 1: Configure EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure build
eas build:configure
```

### Step 2: Build for iOS

```bash
eas build --platform ios
```

- Takes ~10-15 minutes
- Downloads `.ipa` file
- Upload to App Store Connect → TestFlight

### Step 3: Build for Android

```bash
eas build --platform android
```

- Takes ~10-15 minutes
- Downloads `.apk` or `.aab` file
- Upload to Google Play Console

---

## Part 5: Testing Checklist

### Before Launch

- [ ] Supabase functions deployed and working
- [ ] Railway voice agent running (check logs)
- [ ] Mobile app connects via Expo Go
- [ ] Hermes voice session starts
- [ ] Japanese speech-to-text works
- [ ] Settings save properly
- [ ] All screens navigate correctly

### Week 1 After Launch

- [ ] Monitor Supabase function logs
- [ ] Check Railway deployment logs
- [ ] Read user reviews
- [ ] Track daily active users
- [ ] Fix any critical bugs

---

## Common Issues & Fixes

### "Supabase function 404"

**Fix:** Redeploy function:
```bash
supabase functions deploy api
supabase functions deploy voice-agent
```

### "Railway healthcheck failed"

**Fix:** Add `/health` endpoint in `apps/voice-agent/server.js`:
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
```

### "Expo tunnel won't connect"

**Fix:** Use local network instead:
1. Make sure same Wi-Fi
2. Run: `npm start` (no --tunnel)
3. Enter `exp://YOUR_IP:8081` manually in Expo Go

### "App crashes on start"

**Fix:** Clear cache:
```bash
npx expo start -c
```

---

## Monitoring

### Supabase
- Dashboard → **Functions** → **Logs**
- Check for errors in real-time

### Railway
- Dashboard → **Deployments** → **View Logs**
- Set up email alerts for failures

### Mobile App
- Use Sentry or Crashlytics for crash reports
- Monitor App Store / Play Store reviews

---

## Support

**Documentation:**
- Supabase: https://supabase.com/docs
- Railway: https://docs.railway.app
- Expo: https://docs.expo.dev

**Community:**
- Supabase Discord: https://discord.supabase.com
- Railway Discord: https://discord.railway.app
- Expo Forums: https://forums.expo.dev

---

**Last Updated:** September 2026  
**Version:** 1.0.0  
**Maintained by:** AngelOs Team
