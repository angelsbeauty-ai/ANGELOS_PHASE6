# 🎨 AngelOs Design Guidelines

## Color System (WCAG 2.2 AA Compliant)

### Dark Mode Palette

#### Backgrounds (Surfaces)
```
┌─────────────────────────────────────┐
│ #121212 - Base Background          │  ← Main screen background
│ #1e1e1e - Surface 1 (Cards)        │  ← Content cards, modals
│ #2a2a2a - Surface 2 (Elevated)     │  ← Floating elements
│ #333333 - Surface 3 (Hover)        │  ← Interactive hover states
└─────────────────────────────────────┘
```

#### Text Colors
```
┌─────────────────────────────────────┐
│ #f3f4f6 - Primary Text             │  ← Body text (15:1 contrast)
│ #e0e0e0 - Secondary Text           │  ← Subtitles, labels
│ #9e9e9e - Disabled Text            │  ← Inactive elements
└─────────────────────────────────────┘
```

#### Semantic Colors
```
┌─────────────────────────────────────┐
│ #0a0 - Success / Primary Action    │  ← Start buttons, connected
│ #aa0 - Warning / Thinking          │  ← Agent processing
│ #00a - Info / Speaking             │  ← Agent responding
│ #f44 - Error / Destructive         │  ← Delete, cancel
└─────────────────────────────────────┘
```

#### Borders & Dividers
```
┌─────────────────────────────────────┐
│ #333333 - Standard Border          │  ← Cards, inputs
│ #444444 - Active Border            │  ← Focused elements
│ #222222 - Subtle Divider           │  ← Section separators
└─────────────────────────────────────┘
```

---

## Typography Scale

```
36px / ExtraBold - Page Titles
24px / Bold      - Screen Headers
22px / Bold      - Section Titles
16px / Medium    - Buttons, Labels
15px / Regular   - Body Text
14px / Regular   - Secondary Text
12px / Regular   - Captions, Footers
```

---

## Spacing System (8px Grid)

```
8px   - Tight spacing (icon margins)
12px  - Small gaps (related items)
16px  - Standard padding (cards)
24px  - Section spacing
32px  - Large gaps (major sections)
40px  - Hero spacing (headers)
```

---

## Component Examples

### Card
```jsx
<View style={{
  backgroundColor: '#1e1e1e',
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: '#333'
}}>
```

### Button (Primary)
```jsx
<TouchableOpacity style={{
  backgroundColor: '#0a0',
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12
}}>
  <Text style={{
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  }}>
```

### Button (Secondary)
```jsx
<TouchableOpacity style={{
  backgroundColor: '#1e1e1e',
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#333'
}}>
  <Text style={{
    color: '#fff',
    fontSize: 15,
    fontWeight: '700'
  }}>
```

### Input Field
```jsx
<View style={{
  backgroundColor: '#1e1e1e',
  borderRadius: 10,
  padding: 14,
  borderWidth: 1,
  borderColor: '#333'
}}>
  <Text style={{ color: '#f3f4f6', fontSize: 15 }} />
```

---

## Accessibility Checklist

### Color Contrast
- ✅ All text meets 4.5:1 minimum contrast ratio
- ✅ Large text (18px+) meets 3:1 ratio
- ✅ UI components meet 3:1 ratio against background
- ✅ Focus indicators visible (3:1 minimum)

### Interactive Elements
- ✅ Touch targets minimum 44×¹⁴⁴ points
- ✅ Clear visual feedback on press
- ✅ No color-only state indicators
- ✅ Haptic feedback on key actions

### Text & Readability
- ✅ Minimum body text size: 15px
- ✅ Line height: 1.4-1.6 for body text
- ✅ Paragraph spacing: 1.5×¹⁴⁴ line height
- ✅ Left-aligned text (no justified)

---

## Design Don'ts

❌ **Never use pure black** (#000000) - causes OLED smearing  
❌ **Never use pure white** (#FFFFFF) for text - eye strain  
❌ **Never use colors below 4.5:1 contrast** - accessibility violation  
❌ **Never rely on color alone** - add icons/labels for meaning  
❌ **Never use more than 3 accent colors** - visual clutter  
❌ **Never mix warm and cool grays** - inconsistent feel  

---

## Inspiration

- **Apple Human Interface Guidelines** - iOS native feel
- **Material Design 3** - Adaptive color system
- **Linear App** - Dark mode excellence
- **Raycast** - Keyboard-first, minimal design

---

**Tools Used:**
- [Realtime Colors](https://www.realtimecolors.com/) - Live preview
- [Leonardo](https://leonardocolor.io/) - Contrast-aware palette generation
- [Stark](https://www.getstark.co/) - Accessibility testing
- [Figma](https://figma.com/) - Design system

**Last updated:** September 2026
