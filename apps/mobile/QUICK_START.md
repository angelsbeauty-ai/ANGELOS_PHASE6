# 🚀 Quick Start - Run AngelOs on Your Phone

## Method 1: Expo Go (Fastest - 5 minutes)

### Step 1: Install Expo Go on your phone
- **iPhone:** App Store → Search "Expo Go" → Install
- **Android:** Play Store → Search "Expo Go" → Install

### Step 2: Start the app on your computer
Open Terminal (Mac) or Command Prompt (Windows):

```bash
cd ANGELOS_PHASE6/apps/mobile
npm install
npm start
```

### Step 3: Scan QR code
- **iPhone:** Open Camera app → Point at QR → Tap "Open in Expo Go"
- **Android:** Open Expo Go app → Tap "Scan QR Code" → Point at QR

### Step 4: Done!
AngelOs loads on your phone. Tap "Hermes Voice" to start.

---

## Method 2: EAS Build (Production - 30 minutes)

### Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Build for iOS
```bash
eas build --platform ios
```

### Build for Android
```bash
eas build --platform android
```

### Install on phone
- **iOS:** Download from TestFlight (email invitation)
- **Android:** Download APK from build link

---

## Troubleshooting

**"Command not found: npm"**
→ Install Node.js from https://nodejs.org

**"Cannot find module"**
→ Run `npm install` in the `apps/mobile` folder

**QR code won't scan**
→ Make sure phone and computer are on same Wi-Fi network

**App crashes on start**
→ Run `npx expo start -c` to clear cache

---

## What You Can Do Now

✅ **Hermes Voice** - Talk in Japanese, drag avatar around  
✅ **Planner** - Schedule appointments  
✅ **History** - View past conversations  
✅ **Settings** - Change language, avatar size  

---

## Next Steps

1. Test all features on your phone
2. Report any bugs or weird behavior
3. We'll fix and prepare for App Store launch

**Questions?** Check `LAUNCH_CHECKLIST.md` for full details.
