# Floor Plan Editor - Visual Guide

## 🎨 New Visual Design

### Elevator Square Layout

```
┌─────────────────────────────────┐
│                                 │
│         🚪 NORTH LANE           │  ← Entrance lane (toggle)
│       ┌─────────────┐           │
│       │             │           │
│   🚪  │             │  🚪       │  ← West & East lanes
│  WEST │  [ELEVATOR] │ EAST      │
│       │             │           │
│       │             │           │
│       └─────────────┘           │
│         🚪 SOUTH LANE           │  ← South lane (toggle)
│                                 │
└─────────────────────────────────┘

Elevator Core: 2x2 cells (40x40px) - Dark gray
Outer Square: 4x4 cells (80x80px) - Light gray
Entrance Lanes: 1.5 cells wide - Green (when enabled)
```

## 🎮 User Interactions

### 1. Entrance Control

**Left Sidebar Controls:**
```
Building Regions
├─ ☑ 🟦 North
│  └─ ☑ 🚪 Has Entrance  ← Click to toggle
├─ ☑ 🟩 South
│  └─ ☐ 🚪 Has Entrance  ← Disabled
├─ ☑ 🟧 East
│  └─ ☑ 🚪 Has Entrance
└─ ☑ 🟪 West
   └─ ☑ 🚪 Has Entrance
```

**Effect on Canvas:**
- ✅ Enabled entrance → Green lane + 🚪 icon
- ❌ Disabled entrance → No lane, no door

### 2. Drag and Drop

**Step-by-Step:**

```
Step 1: Click on Item
┌──────────┐
│ 🏝️ Team A│ ← Click here
└──────────┘

Step 2: Hold & Drag
┌──────────┐
│ 🏝️ Team A│ ← Dragging...
└──────────┘
     ↓

Step 3: Release to Drop
         ┌──────────┐
         │ 🏝️ Team A│ ← New position!
         └──────────┘
```

**Constraints:**
- ✅ Snaps to grid automatically
- ✅ Can't go outside canvas
- ✅ Position updates in real-time
- ✅ Cursor shows move icon

## 🖼️ Canvas States

### State 1: All Entrances Enabled
```
┌────────────────────────────────┐
│          🚪 NORTH              │
│                                │
│                                │
│  🚪  ←  [ELEVATOR]  →  🚪     │
│ WEST                    EAST  │
│                                │
│                                │
│          🚪 SOUTH              │
└────────────────────────────────┘
```

### State 2: North & East Only
```
┌────────────────────────────────┐
│          🚪 NORTH              │
│                                │
│                                │
│        [ELEVATOR]  →  🚪       │
│                       EAST     │
│                                │
│                                │
│       (no entrance)            │
└────────────────────────────────┘
```

### State 3: Single Entrance (West)
```
┌────────────────────────────────┐
│       (no entrance)            │
│                                │
│                                │
│  🚪  ←  [ELEVATOR]             │
│ WEST                           │
│                                │
│                                │
│       (no entrance)            │
└────────────────────────────────┘
```

## 📋 Common Workflows

### Workflow 1: Create Secure Zone
1. Enable North, South, East, West regions
2. Disable South entrance (back door locked)
3. Disable West entrance (side door locked)
4. Keep North entrance (main lobby)
5. Keep East entrance (employee parking)

**Result**: 4 regions visible, only 2 access points

### Workflow 2: Arrange Team Layout
1. Add "QA Team" island
2. Drag to North region (top-left area)
3. Add "Backend Team" island
4. Drag to East region (right side)
5. Add "Conference Room A"
6. Drag to center (near elevator)

**Result**: Custom positioned items for optimal workflow

### Workflow 3: Construction Mode
1. Enable all 4 regions (show full building)
2. Disable West entrance (under construction)
3. Add temporary meeting room
4. Drag to North region (safe area)
5. Add warning sign visual

**Result**: Visible layout with restricted West access

## 🎯 Visual Indicators

### Colors
- **North**: 🟦 Blue (#3b82f6)
- **South**: 🟩 Green (#10b981)
- **East**: 🟧 Orange (#f59e0b)
- **West**: 🟪 Purple (#8b5cf6)
- **Entrance**: 🟩 Green (#10b981) - Active lane
- **Elevator**: ⬜ Gray (#374151) - Core
- **Selected**: 🟨 Yellow (#fbbf24) - Border

### Icons
- **Region**: 🏝️ Island, 📹 Meeting Room
- **Entrance**: 🚪 Door
- **Features**: 🖥️ Monitor, 🔌 Docking, ⬆️ Standing
- **Equipment**: 📽️ Projector, 📹 Video, 📝 Whiteboard, 📞 Phone

### Status
- **Available**: 🟢 Green tint
- **Booked**: 🟠 Orange tint
- **Maintenance**: 🔴 Red tint

## 🔧 Keyboard & Mouse

### Mouse Actions
| Action | Result |
|--------|--------|
| **Click** item | Select item (properties panel) |
| **Click** + **Hold** | Start drag |
| **Move** while holding | Drag item |
| **Release** | Drop item |
| **Click** canvas | Deselect item |

### No Keyboard Shortcuts (Yet)
- Ctrl+Z for undo (future)
- Ctrl+C/V for copy/paste (future)
- Arrow keys for nudge (future)
- Delete key for remove (future)

## 📊 Information Display

### Left Sidebar Stats
```
Items: 5
Islands: 3
Rooms: 2
```

### Right Sidebar (Selected Item)
```
Type: 🏝️ Island
Name: QA Team
Region: NORTH (blue)
Status: AVAILABLE (green)
Desks: 8
Features:
  🖥️ Monitors
  🔌 Docking Stations
```

## 🎬 Animation Flow

### Entrance Toggle Animation
```
Before:           After:
┌───┐            ┌───┐
│ 🚪│   →→→      │   │  (Door disappears)
└───┘            └───┘

OR

┌───┐            ┌───┐
│   │   →→→      │ 🚪│  (Door appears)
└───┘            └───┘
```

### Drag Animation
```
Start:           During:          End:
┌───┐            ┌───┐            ┌───┐
│ 🏝️│   →→→      │ 🏝️│ (cursor)   │ 🏝️│
└───┘            └───┘            └───┘
Position: 5,5    Position: 8,7    Position: 10,8
```

## 🚀 Quick Start Guide

### For Office Managers

**Step 1: Set Up Regions**
1. Go to Floor Plan tab
2. Check which regions you need (North, South, East, West)
3. Uncheck unused regions
4. Toggle entrances based on access policy

**Step 2: Add Items**
1. Click "Add Island/Room"
2. Select region
3. Choose island or meeting room
4. Click to add

**Step 3: Arrange Layout**
1. Click on an item
2. Drag to desired position
3. Release to drop
4. Repeat for all items

**Step 4: Review & Save**
1. Check all positions are correct
2. Verify entrance configuration
3. Click "Save Layout"

### For Security Personnel

**Restrict Access:**
1. Keep regions enabled (visible)
2. Disable specific entrances:
   - Uncheck "Has Entrance" for side doors
   - Keep main entrance checked
3. Result: Building visible, limited access

**Emergency Lockdown:**
1. Disable all entrances except main
2. Monitor via floor plan
3. Re-enable when safe

## 📱 Responsive Behavior

**Desktop (1920x1080):**
- Full canvas visible
- Sidebars 256px wide
- Smooth drag and drop

**Laptop (1366x768):**
- Canvas scales down
- Sidebars remain functional
- Zoom controls available

**Tablet (iPad):**
- Touch drag supported
- Larger touch targets
- Simplified controls

## ✨ Pro Tips

1. **Quick Positioning**: Use zoom out to see full floor, zoom in for precision
2. **Region Planning**: Enable region before adding items to it
3. **Entrance Strategy**: Main entrances always ON, side doors toggleable
4. **Visual Balance**: Distribute items evenly across regions
5. **Color Coding**: Use region colors to quickly identify item locations

## 🎨 Design Philosophy

**Elevator Square Rationale:**
- Real buildings have fixed elevator cores (not moving)
- Square provides clear visual boundary
- Lanes show access points at a glance
- Easy to understand and control

**Drag & Drop Rationale:**
- Natural interaction (click, drag, drop)
- Immediate visual feedback
- No need to learn coordinate system
- Matches physical world metaphor

**Independent Entrance Control Rationale:**
- Security: Show layout but control access
- Flexibility: Different policies per entrance
- Realism: Real buildings have multiple doors
- Safety: Quick emergency lockdown

Perfect for modern office management! 🏢✨
