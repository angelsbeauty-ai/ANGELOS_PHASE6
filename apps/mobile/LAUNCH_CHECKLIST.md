# 📱 AngelOs Mobile App Launch Checklist

## ✅ Pre-Launch Verification (25 Points)

### Design & Accessibility
- [ ] **Color contrast meets WCAG 2.2 AA** (4.5:1 for text, 3:1 for UI components)
- [ ] **Dark mode uses soft blacks** (#121212 base, not #000000)
- [ ] **All interactive elements have visible states** (hover, focus, active)
- [ ] **Text is legible at all sizes** (minimum 14px for body)
- [ ] **Icons have labels or clear meaning**

### Navigation & Routing
- [ ] **All screens accessible from home** (Hermes, Planner, History, Settings)
- [ ] **Back buttons work on every screen**
- [ ] **No broken links or 404s**
- [ ] **Deep linking configured** (if applicable)

### Functionality
- [ ] **Hermes voice sessions connect successfully**
- [ ] **Speech-to-text works in Japanese**
- [ ] **Settings persist across app restarts**
- [ ] **Tutorial shows only once** (resets on demand)
- [ ] **Haptic feedback works** (if enabled)

### Performance
- [ ] **App loads in < 3 seconds**
- [ ] **No memory leaks** (test with Instruments/Xcode)
- [ ] **Smooth 60fps animations**
- [ ] **Offline mode handles gracefully**

### Testing
- [ ] **Tested on iOS** (iPhone 13+, iOS 16+)
- [ ] **Tested on Android** (Pixel 6+, Android 13+)
- [ ] **Tested on different screen sizes** (small, large, tablet)
- [ ] **Tested in light and dark mode**
- [ ] **Tested with VoiceOver/TalkBack** (accessibility)

---

## 🎨 Design System

### Color Palette (Dark Mode)
```javascript
// Backgrounds
base: '#121212'      // Main background (WCAG compliant)
surface1: '#1e1e1e'  // Cards, modals
surface2: '#2a2a2a'  // Elevated surfaces
surface3: '#333333'  // Hover states

// Text
primary: '#f3f4f6'   // Body text (off-white, not pure white)
secondary: '#e0e0e0' // Subtitles
disabled: '#9e9e9e'  // Disabled text

// Accents
primary: '#0a0'      // Success, primary actions
warning: '#aa0'      // Warning, thinking state
error: '#f44'        // Error, destructive actions
info: '#00a'         // Info, speaking state

// Borders
border: '#333333'    // Separators, outlines
```

### Typography
```javascript
// Font sizes
xs: 12   // Captions, footers
sm: 14   // Secondary text
md: 15   // Body text
lg: 16   // Buttons, labels
xl: 22   // Headers
xxl: 36  // Title

// Font weights
regular: '400'
medium: '600'
bold: '700'
extraBold: '800'
```

### Spacing
```javascript
// Consistent spacing scale
xs: 8
sm: 12
md: 16
lg: 24
xl: 32
xxl: 40
```

---

## 🚀 Deployment Steps

### 1. Development Testing (Expo Go)
```bash
cd apps/mobile
npm install
npm start
# Scan QR code with Expo Go app
```

### 2. Pre-Build Verification
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Run ESLint
npm run lint

# Format code
npm run format
```

### 3. EAS Build Configuration
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to EAS
eas login

# Configure build
eas build:configure

# Create production build
eas build --platform ios   # or android
```

### 4. App Store Submission

#### iOS (App Store Connect)
- [ ] App icon 1024×¹⁰⁸⁴ PNG (no transparency)
- [ ] Screenshots: 6.7", 6.5", 5.5" (3 sizes)
- [ ] App preview video (optional, 30s max)
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] App description (max 4000 chars)
- [ ] Keywords (max 100 chars)
- [ ] Category: Productivity / Education
- [ ] Age rating: 4+
- [ ] Build uploaded via Xcode or EAS

#### Android (Google Play Console)
- [ ] App icon 512×¹⁵⁶ PNG
- [ ] Feature graphic 1024×²⁵⁰ PNG
- [ ] Screenshots: phone (2+), tablet (optional)
- [ ] Privacy policy URL
- [ ] App description (max 4000 chars)
- [ ] Short description (max 80 chars)
- [ ] Category: Productivity / Education
- [ ] Content rating questionnaire completed
- [ ] AAB file uploaded (via EAS or Android Studio)

---

## 📊 Post-Launch Monitoring

### Week 1
- [ ] Monitor crash reports (Sentry/Crashlytics)
- [ ] Check user reviews daily
- [ ] Track daily active users (DAU)
- [ ] Monitor server load (Supabase, LiveKit)

### Month 1
- [ ] Analyze user retention (D1, D7, D30)
- [ ] Review feature usage analytics
- [ ] Gather user feedback for v2
- [ ] Plan next sprint based on data

---

## 🛠️ Troubleshooting

### Common Issues

**App won't start on device:**
1. Check Metro bundler is running (port 8081)
2. Verify same Wi-Fi network
3. Clear cache: `npx expo start -c`

**Voice session fails:**
1. Check LiveKit credentials in Supabase secrets
2. Verify microphone permissions granted
3. Test on different network (WiFi vs cellular)

**Colors look wrong:**
1. Test on actual device (not simulator)
2. Check color contrast with accessibility inspector
3. Verify dark/light mode system settings

**Build fails:**
1. Check `package.json` dependencies match
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Check EAS build logs for specific error

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Guide](https://reactnative.dev/docs/getting-started)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design 3](https://m3.material.io/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)

---

**Last updated:** September 2026  
**Version:** 1.0.0  
**Maintained by:** AngelOs Team
