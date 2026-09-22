# 🎨 AngelOs Professional Design Mockups

## Design Direction: **Neutral, Professional, Enterprise**

Not feminine, not playful — clean, modern, business-grade.

---

## Color Palette (Gender-Neutral, Professional)

### Primary Palette
```
┌────────────────────────────────────────────┐
│ #0f172a - Slate 900 (Primary Background)  │  ← Deep navy-charcoal
│ #1e293b - Slate 800 (Surface/Cards)       │  ← Blue-gray cards
│ #334155 - Slate 700 (Borders/Dividers)    │  ← Neutral gray
│ #475569 - Slate 600 (Secondary Text)      │  ← Muted text
│ #94a3b8 - Slate 400 (Tertiary Text)       │  ← Disabled text
│ #f1f5f9 - Slate 100 (Primary Text)        │  ← Crisp white-gray
└────────────────────────────────────────────┘
```

### Accent Colors (Professional, Not Playful)
```
┌────────────────────────────────────────────┐
│ #0ea5e9 - Sky 500 (Primary Action)        │  ← Professional blue
│ #10b981 - Emerald 500 (Success)           │  ← Clean green
│ #f59e0b - Amber 500 (Warning)             │  ← Subtle amber
│ #ef4444 - Red 500 (Error)                 │  ← Standard red
│ #8b5cf6 - Violet 500 (Secondary Action)   │  ← Deep purple
└────────────────────────────────────────────┘
```

---

## Screen Mockups

### 1. Home Screen

```
┌─────────────────────────────────┐
│  [Status Bar: 9:41  🔋  📶]    │
│                                 │
│  AngelOs                        │  ← 36px Bold, #f1f5f9
│  AI Operating System            │  ← 14px Regular, #94a3b8
│                                 │
│  ┌─────────────┬─────────────┐  │
│  │             │             │  │
│  │   🤖        │   📅        │  │
│  │  Hermes     │  Planner    │  │
│  │   Voice     │             │  │
│  │             │             │  │
│  │  [Blue]     │  [Teal]     │  │
│  └─────────────┴─────────────┘  │
│                                 │
│  ┌─────────────┬─────────────┐  │
│  │             │             │  │
│  │   📋        │   ⚙️        │  │
│  │  History    │  Settings   │  │
│  │             │             │  │
│  │             │             │  │
│  │  [Purple]   │  [Gray]     │  │
│  └─────────────┴─────────────┘  │
│                                 │
│                                 │
│  Built for Angels Beauty        │
│  Academy                        │
└─────────────────────────────────┘

Background: #0f172a (Slate 900)
Cards: Gradient with accent colors (subtle, 10% opacity)
Text: #f1f5f9 (Slate 100)
```

### 2. Hermes Voice Screen

```
┌─────────────────────────────────┐
│  [Status Bar: 9:41  🔋  📶]    │
│                                 │
│  ←  Hermes            ⚙️  📋   │  ← Header with icons
│                                 │
│                                 │
│           ┌───────┐             │
│           │       │             │
│           │  🤖   │  ← Draggable │
│           │       │    Avatar   │
│           │Hermes │             │
│           └───────┘             │
│                                 │
│    ● Connected                  │  ← Status indicator
│                                 │
│  ┌─────────────────────────┐    │
│  │   Start / End Session   │    │  ← Button: #0ea5e9
│  └─────────────────────────┘    │
│                                 │
│  You: こんにちは                │  ← Transcript box
│  Hermes: 予約を確認します       │    Background: #1e293b
│                                 │
└─────────────────────────────────┘

Background: #0f172a
Avatar: #334155 (inactive), #0ea5e9 (listening)
Text: #f1f5f9
```

### 3. Settings Screen

```
┌─────────────────────────────────┐
│  [Status Bar: 9:41  🔋  📶]    │
│                                 │
│  ←  Settings                    │
│                                 │
│  Language / 言語                │  ← Section title: #94a3b8
│  ┌──────────────┬────────────┐  │
│  │   日本語     │  English   │  │
│  │  [Active]    │            │  │
│  └──────────────┴────────────┘  │
│                                 │
│  Avatar Size                    │
│  ┌────┬────┬────┐               │
│  │ S  │ M  │ L  │               │
│  │    │[Active]│ │               │
│  └────┴────┴────┘               │
│                                 │
│  Haptic Feedback                │
│  ┌──────────────────────────┐   │
│  │ Enable vibration  [ON]   │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │   Reset Tutorial         │   │  ← Button: #ef4444
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │   Save Settings          │   │  ← Button: #0ea5e9
│  └──────────────────────────┘   │
│                                 │
└─────────────────────────────────┘

Background: #0f172a
Cards: #1e293b with #334155 borders
Active state: #0ea5e9 (blue)
Destructive: #ef4444 (red)
```

---

## Typography (Professional, Clean)

```
Font Family: Inter / SF Pro (system default)

36px / 700 - Page Titles (AngelOs)
24px / 600 - Screen Headers (Hermes)
18px / 600 - Section Titles
16px / 500 - Buttons, Labels
15px / 400 - Body Text (default)
14px / 400 - Secondary Text
12px / 400 - Captions, Footers

Line Height: 1.5 for body, 1.3 for headers
Letter Spacing: -0.5px for headers, 0 for body
```

---

## Component Specifications

### Card (Home Screen)
```jsx
<LinearGradient
  colors={['#0ea5e915', '#10b98115']}  // 10% opacity accents
  style={{
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155'
  }}
>
```

### Button (Primary)
```jsx
<TouchableOpacity
  style={{
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center'
  }}
>
  <Text style={{
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }} />
```

### Button (Secondary)
```jsx
<TouchableOpacity
  style={{
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center'
  }}
>
  <Text style={{
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600'
  }} />
```

### Input Field
```jsx
<View
  style={{
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155'
  }}
>
  <Text style={{ color: '#f1f5f9', fontSize: 15 }} />
```

---

## Design Principles

✅ **Professional** — Enterprise-grade, not playful  
✅ **Neutral** — Gender-neutral, inclusive  
✅ **Accessible** — WCAG 2.2 AA compliant  
✅ **Modern** — Clean, minimalist, 2026 aesthetic  
✅ **Consistent** — 8px grid, systematic spacing  
✅ **Readable** — High contrast, legible typography  

---

## Inspiration

- **Linear** — Clean, professional dark mode
- **Vercel Dashboard** — Enterprise aesthetic
- **Raycast** — Keyboard-first, minimal
- **Supabase Dashboard** — Modern developer tools
- **Apple Human Interface** — Native iOS feel

---

## What We Avoided

❌ Pink, coral, rose gold (too feminine)  
❌ Pastels, soft gradients (too playful)  
❌ Rounded, bubbly UI (too casual)  
❌ Decorative elements, illustrations (unnecessary)  
❌ Bright, saturated colors (unprofessional)  

---

**Design Status:** Ready for implementation  
**Last Updated:** September 2026  
**Version:** 2.0 (Professional Neutral)
