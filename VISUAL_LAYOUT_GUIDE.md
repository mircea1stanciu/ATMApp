# Visual Layout Guide - Community Dashboard

## 🖥️ Desktop Layout (≥ 1024px)

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                           Header (Logo, Navigation, User Menu)                        │
├────────────────────────────────────────────────────────┬──────────────────────────────┤
│                                                        │                              │
│  Dashboard Area (Scrollable)                           │  Chat Panel (420px)          │
│  ┌──────────────────────────────────────────────────┐ │  ┌────────────────────────┐ │
│  │  📋 Business System Analysts Dashboard           │ │  │ 📋 AI Assistant    ✕  │ │
│  │  Welcome back, John Doe! 👋                       │ │  │ Business System       │ │
│  └──────────────────────────────────────────────────┘ │  │ Analysts              │ │
│                                                        │  ├────────────────────────┤ │
│  ┌──────────────┬──────────────┬──────────────────┐  │  │ 💡 Examples │ 🗑️ Clear │ │
│  │ 💬 Total     │ 📊 This Week │ ⚡ Active        │  │  ├────────────────────────┤ │
│  │    24        │     8        │     1            │  │  │                        │ │
│  └──────────────┴──────────────┴──────────────────┘  │  │  [Messages Area]       │ │
│                                                        │  │                        │ │
│  🚀 Quick Actions                                      │  │  User: Question?       │ │
│  ┌────────────┬────────────┬────────────┐            │  │  👤                     │ │
│  │ 📋 Req.    │ 📊 Process │ 🎯 Stories │            │  │                        │ │
│  │ Analysis   │ Mapping    │ Creation   │            │  │  📋 Agent: Response    │ │
│  └────────────┴────────────┴────────────┘            │  │                        │ │
│  ┌────────────┬────────────┬────────────┐            │  │  Thinking...           │ │
│  │ 🔄 Process │ 🔍 Gap     │ 📈 Business│            │  │  ● ● ●                 │ │
│  │ Optimize   │ Analysis   │ Cases      │            │  │                        │ │
│  └────────────┴────────────┴────────────┘            │  ├────────────────────────┤ │
│                                                        │  │ [Ask me anything...]   │ │
│  📜 Recent Activity                                    │  │              [Send ⏎] │ │
│  ┌────────────────────────────────────────────────┐  │  └────────────────────────┘ │
│  │ 💬 Started conversation    2 hours ago         │  │                              │
│  │ ✅ Completed task           Yesterday           │  │                              │
│  │ ❓ Asked question           2 days ago          │  │                              │
│  │ 🎯 Received help            3 days ago          │  │                              │
│  └────────────────────────────────────────────────┘  │                              │
│                                                        │                              │
│  📚 Resources & Guides                                 │                              │
│  ┌─────────────────────┬─────────────────────────┐   │                              │
│  │ 📖 Getting Started  │ 🎓 Best Practices       │   │                              │
│  │ 💡 Example Projects │ ❓ FAQ                   │   │                              │
│  └─────────────────────┴─────────────────────────┘   │                              │
│                                                        │                              │
└────────────────────────────────────────────────────────┴──────────────────────────────┘
```

---

## 📱 Mobile Layout (< 640px)

### With Chat Closed
```
┌────────────────────────────────┐
│   Header (Compact)             │
├────────────────────────────────┤
│                                │
│  Dashboard (Stacked)           │
│  ┌──────────────────────────┐ │
│  │  📋 Dashboard            │ │
│  │  Welcome, John! 👋        │ │
│  └──────────────────────────┘ │
│                                │
│  💬 Total Conversations        │
│       24                       │
│                                │
│  📊 This Week                  │
│       8                        │
│                                │
│  ⚡ Active Sessions            │
│       1                        │
│                                │
│  🚀 Quick Actions              │
│  ┌──────────────────────────┐ │
│  │ 📋 Requirements Analysis │ │
│  │ 📊 Process Mapping       │ │
│  │ 🎯 User Stories          │ │
│  └──────────────────────────┘ │
│                                │
│  📜 Recent Activity            │
│  📚 Resources                  │
│                                │
│                          ┌───┐ │
│                          │💬 │ │ ← Floating Button
│                          └───┘ │
└────────────────────────────────┘
```

### With Chat Open
```
┌────────────────────────────────┐
│ [Dark Backdrop Overlay]        │
│  ┌──────────────────────────┐ │
│  │ 📋 AI Assistant      ✕  │ │ ← Full-width Panel
│  │ Business System Analysts│ │
│  ├──────────────────────────┤ │
│  │ 💡 Examples │ 🗑️ Clear   │ │
│  ├──────────────────────────┤ │
│  │                          │ │
│  │  Messages                │ │
│  │                          │ │
│  │  User: Question?     👤  │ │
│  │                          │ │
│  │  📋 Agent response       │ │
│  │                          │ │
│  │                          │ │
│  ├──────────────────────────┤ │
│  │ [Ask me anything...]     │ │
│  │                [Send ⏎]  │ │
│  └──────────────────────────┘ │
└────────────────────────────────┘
```

---

## 💻 Tablet Layout (640px - 1023px)

```
┌─────────────────────────────────────────────────────────┐
│            Header (Medium)                              │
├───────────────────────────────────┬─────────────────────┤
│                                   │                     │
│  Dashboard (2-3 columns)          │  Chat (384px)       │
│  ┌─────────────────────────────┐ │  Slides over        │
│  │  📋 Welcome Header          │ │  dashboard          │
│  └─────────────────────────────┘ │                     │
│                                   │  When open,         │
│  ┌───────────┬───────────────┐  │  backdrop           │
│  │ 💬 Total  │ 📊 This Week  │  │  dims main          │
│  │    24     │     8         │  │  area               │
│  └───────────┴───────────────┘  │                     │
│  ┌─────────────────────────┐    │                     │
│  │ ⚡ Active Sessions       │    │                     │
│  │     1                    │    │                     │
│  └─────────────────────────┘    │                     │
│                                   │                     │
│  Quick Actions (2 columns)        │                     │
│  Recent Activity                  │                     │
│  Resources (2 columns)            │                     │
│                                   │                     │
│                            ┌───┐  │                     │
│                            │💬 │  │                     │
│                            └───┘  │                     │
└───────────────────────────────────┴─────────────────────┘
```

---

## 🎨 Interactive Elements

### Floating Action Button (FAB)
```
┌──────┐
│  💬  │  ← Blue gradient circle
│   ●  │  ← Green pulse indicator
└──────┘
  ↑
Hover: Scales to 110%
Position: Fixed bottom-right (24px from edges)
Size: 56px × 56px
```

### Quick Action Card
```
┌────────────────────────────────┐
│  📋  Requirements Analysis     │  ← Icon + Title
│      Business requirements     │  ← Description
└────────────────────────────────┘
  ↑
Hover: Background changes to gray-100
Click: Opens chat with pre-filled query
```

### Chat Message Bubble
```
User Message (Right-aligned):
                    ┌─────────────────┐
                    │ How do I start? │  ← Blue bg
                    │ 2:30 PM         │  ← Timestamp
                👤  └─────────────────┘  ← Avatar

Agent Message (Left-aligned):
┌─────────────────────────────┐
│ Here's how to get started:  │  ← Gray bg
│ 1. First step               │  ← Markdown
│ 2. Second step              │
│ 2:31 PM                     │  ← Timestamp
└─────────────────────────────┘  📋  ← Avatar
```

---

## 🔄 Animation Flow

### Opening Chat Panel

**Desktop:**
```
1. Click FAB (💬)
2. Panel slides in from right → 
3. Panel width expands 0 → 420px
4. FAB fades out
5. Duration: 300ms
```

**Mobile:**
```
1. Click FAB (💬)
2. Dark backdrop fades in (opacity 0 → 0.5)
3. Panel slides in from right →
4. Panel covers full screen
5. Duration: 300ms
```

### Quick Action Flow
```
1. User clicks "📋 Requirements Analysis" card
2. Card background changes (hover state)
3. Event fires: openChatWithQuery
4. If chat closed:
   - FAB disappears
   - Chat panel slides in
   - Input pre-filled with query
5. If chat open:
   - Input updates with query
   - Focus moves to textarea
6. Duration: <100ms for instant feel
```

---

## 📊 Stat Cards Layout

### Desktop (3 columns)
```
┌──────────────┬──────────────┬──────────────┐
│ 💬 Total     │ 📊 This Week │ ⚡ Active    │
│              │              │              │
│    24        │     8        │     1        │
│ Conversations│ Conversations│ Sessions     │
└──────────────┴──────────────┴──────────────┘
```

### Tablet (2-3 columns)
```
┌──────────────┬──────────────┐
│ 💬 Total     │ 📊 This Week │
│    24        │     8        │
└──────────────┴──────────────┘
┌──────────────────────────────┐
│ ⚡ Active Sessions            │
│     1                        │
└──────────────────────────────┘
```

### Mobile (1 column)
```
┌──────────────────────────────┐
│ 💬 Total Conversations       │
│          24                  │
└──────────────────────────────┘
┌──────────────────────────────┐
│ 📊 This Week                 │
│          8                   │
└──────────────────────────────┘
┌──────────────────────────────┐
│ ⚡ Active Sessions            │
│          1                   │
└──────────────────────────────┘
```

---

## 🎯 Color Coding

### Community Colors
```
QA:       ████ Blue      (bg-blue-500)
Backend:  ████ Green     (bg-green-500)
Frontend: ████ Purple    (bg-purple-500)
Design:   ████ Pink      (bg-pink-500)
Product:  ████ Orange    (bg-orange-500)
DevOps:   ████ Red       (bg-red-500)
Analyst:  ████ Indigo    (bg-indigo-500)
```

### UI Elements
```
Primary Action:  ████ Blue 600/700
Success:         ████ Green 500
Warning:         ████ Orange 500
Error:           ████ Red 500
Neutral:         ████ Gray 50-900
Dark Mode BG:    ████ Gray 800-900
```

---

## 📐 Spacing & Sizing

### Panel Widths
```
Mobile:  Full width (100%)
Tablet:  384px (sm:w-96)
Desktop: 420px (w-[420px])
```

### Card Padding
```
Compact:  p-3  (12px)
Normal:   p-4  (16px)
Spacious: p-6  (24px)
```

### Grid Gaps
```
Tight:   gap-2  (8px)
Normal:  gap-3  (12px)
Loose:   gap-4  (16px)
```

### Font Sizes
```
Tiny:    text-xs   (12px) - timestamps, labels
Small:   text-sm   (14px) - descriptions, body
Base:    text-base (16px) - normal text
Large:   text-lg   (18px) - section headers
XL:      text-xl   (20px) - page titles
2XL:     text-2xl  (24px) - main headers
3XL:     text-3xl  (30px) - welcome message
```

---

## 🔔 State Indicators

### Chat Panel States

**Empty (No Messages)**
```
┌────────────────────────┐
│        📋              │
│   How can I help?      │
│                        │
│ Ask me anything about  │
│ business analysis      │
│                        │
│ View example questions │
└────────────────────────┘
```

**Loading**
```
┌────────────────────────┐
│ 📋 Thinking...         │
│    ● ● ●               │
└────────────────────────┘
```

**Error**
```
┌────────────────────────┐
│ ❌ Error: Failed to... │
└────────────────────────┘
```

### FAB States

**Available**
```
┌────┐
│ 💬 │ ← Blue bg
│  ● │ ← Green pulse (animate)
└────┘
```

**Hover**
```
┌────┐
│ 💬 │ ← Blue 700 bg
│  ● │ ← Scale 110%
└────┘
```

---

## 🎬 User Journey Map

### First Visit
```
1. User navigates to /community/analyst
2. Sees dashboard with welcome header
3. Reads stats (0 conversations yet)
4. Sees 6 quick action cards
5. Clicks "📋 Requirements Analysis"
6. Chat panel slides in from right
7. Input pre-filled with relevant question
8. User edits and sends first message
9. Agent responds with helpful info
10. User continues conversation
```

### Return Visit
```
1. User returns to /community/analyst
2. Dashboard shows updated stats (5 chats this week)
3. Recent activity shows last 4 actions
4. User clicks FAB to continue previous chat
5. Chat panel opens with history preserved
6. User asks follow-up question
7. Quick access to examples via 💡 button
```

---

## 📱 Touch Gestures (Mobile)

### Supported Gestures
```
Tap FAB          → Open chat panel
Tap backdrop     → Close chat panel
Tap ✕ button     → Close chat panel
Tap message      → (No action)
Scroll messages  → Vertical scroll
Swipe panel      → (No action, could add swipe-to-close)
```

---

## 🌙 Dark Mode Comparison

### Light Mode
```
Background:  White / Gray-50
Text:        Gray-900
Borders:     Gray-200
Cards:       White
Shadows:     Gray-200
```

### Dark Mode
```
Background:  Gray-900 / Gray-800
Text:        White / Gray-100
Borders:     Gray-700
Cards:       Gray-800
Shadows:     Black / Transparent
```

---

## ✨ Accessibility Features

### Keyboard Navigation
```
Tab              → Focus next element
Shift + Tab      → Focus previous element
Enter            → Activate button / Send message
Escape           → Close modal / Close panel
Space            → Activate button
```

### Screen Reader Support
```
Landmarks:       header, main, aside
ARIA labels:     All interactive elements
Alt text:        All icons have text fallbacks
Focus visible:   Blue ring on keyboard focus
```

### Color Contrast
```
All text meets WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text:  3:1 minimum
- Icons:       3:1 minimum
```

---

This visual guide shows exactly how the new layout works across all screen sizes and states!
