# 📱 AngelOs Mobile App

## Quick Start (Fixed Tunnel Issues)

### Method 1: Local Network (Recommended - No Tunnel)

**This is the fastest and most reliable method.**

1. **Make sure your phone and computer are on the SAME Wi-Fi network**

2. **Start the dev server:**
```bash
cd apps/mobile
npm install
npm start
```

3. **Scan the QR code** with Expo Go app

4. **If it doesn't connect:**
   - Check your computer's local IP: `ipconfig` (Windows) or `ifconfig` (Mac)
   - In Expo CLI, press `a` for Android or `i` for iOS
   - Or manually enter: `exp://YOUR_IP:8081` in Expo Go

### Method 2: Expo Tunnel (If Local Network Fails)

**Only use this if Method 1 doesn't work.**

```bash
npm start -- --tunnel
```

**Known issues with tunnel:**
- Slower connection
- May fail if behind corporate firewall
- Requires internet connection

**If tunnel fails:**
1. Try: `npx expo start --tunnel --clear`
2. Check firewall settings
3. Use local network method instead

---

## Troubleshooting

### "Cannot connect to Metro"

**Fix:**
```bash
# Clear cache and restart
npx expo start -c
```

### "Tunnel connection failed"

**Fix:**
1. Use local network instead (Method 1)
2. Or try: `EXPO_NO_METRO_LAZY=1 npx expo start --tunnel`

### App crashes on start

**Fix:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## Running on Device

### iOS (iPhone)
1. Install **Expo Go** from App Store
2. Scan QR code from Camera app
3. App loads automatically

### Android
1. Install **Expo Go** from Play Store
2. Open Expo Go app
3. Tap "Scan QR Code"
4. Point at QR code

---

## Production Build

### Using EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

## Features

- ✅ Hermes Voice Agent (drag & talk)
- ✅ Planner (appointment scheduling)
- ✅ History (past conversations)
- ✅ Settings (language, avatar, haptics)
- ✅ Professional dark mode design
- ✅ WCAG 2.2 AA accessible

---

## Tech Stack

- **Framework:** Expo SDK 52, React Native 0.76
- **Navigation:** Expo Router 5
- **Voice:** LiveKit + Supabase Edge Functions
- **State:** Zustand
- **Storage:** AsyncStorage
- **Styling:** StyleSheet (React Native)

---

**Last Updated:** September 2026  
**Status:** Production Ready
