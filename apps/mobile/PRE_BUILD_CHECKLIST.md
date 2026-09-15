# ✅ Pre-Build Checklist

## Before Building iOS/Android App

### 1. Core Screens Work
- [ ] Home screen loads (no "AI setup" errors)
- [ ] Hermes Voice screen opens
- [ ] AI Settings opens (no fetch timeout)
- [ ] Approvals screen opens (shows empty state)
- [ ] History screen opens
- [ ] Settings screen opens

### 2. Design Correct
- [ ] Slate theme (dark blue-gray #0f172a)
- [ ] Professional look (not feminine)
- [ ] All text readable (#f1f5f9)
- [ ] Buttons work (#0ea5e9)

### 3. No Console Errors
- [ ] No "fetch failed" errors
- [ ] No "timeout" errors
- [ ] No "AI setup needs attention"
- [ ] No red error screens

### 4. Navigation Works
- [ ] Can go Home → Hermes Voice
- [ ] Can go Home → AI Settings
- [ ] Can go Home → Approvals
- [ ] Back buttons work
- [ ] All routes defined in _layout.tsx

### 5. AsyncStorage Works
- [ ] AI Settings can save/load
- [ ] No Supabase calls failing
- [ ] No API timeouts

---

## If Everything Passes:

### Build iOS:
```bash
cd apps/mobile
eas build --profile development --platform ios
```

### Build Android:
```bash
cd apps/mobile
eas build --profile development --platform android
```

---

## Known Issues (OK to Ignore):

⚠️ Voice recording doesn't work in Expo Go (needs dev build)  
⚠️ Some screens show empty state (no backend connected yet)  

These are EXPECTED and will be fixed by the dev build.

---

**Status:** Ready for build when all checkboxes pass ✅
