# 📱 AngelOs Mobile App

## Quick Start

### Test with Expo Go (Limited)
```bash
npm install
npm run start:go
```
**Works:** Home, Services, Calendar, Clients, Settings, History  
**Doesn't work:** Voice recording (needs native modules)

---

## Build Development Client (Voice Works!)

### Option 1: EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build development client with voice support
eas build --profile development --platform android
# or for iOS:
# eas build --profile development --platform ios

# Install APK on your phone
# Voice recording will work!
```

### Option 2: Local Dev Client (Faster)

```bash
# Android (requires Android SDK)
npx expo run:android

# iOS (requires Xcode/Mac)
npx expo run:ios
```

---

## Features

✅ Hermes Voice (with dev build)  
✅ Planner/Calendar  
✅ Client Management  
✅ Services Menu  
✅ Settings  
✅ Conversation History  

---

## Tech Stack

- Expo SDK 52
- React Native 0.76
- Supabase Backend
- LiveKit Voice
- EAS Build

**Status:** Production Ready (voice needs dev build)
