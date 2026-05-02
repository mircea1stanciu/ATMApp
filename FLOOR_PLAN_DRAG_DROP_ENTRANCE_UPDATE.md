# Floor Plan Editor - Drag & Drop + Manual Entrance Control

## Summary of Updates

This update adds **drag-and-drop functionality** and **manual entrance control** to the Floor Plan Editor, making it more interactive and flexible.

## New Features

### 1. 🎯 Manual Entrance Control

**Previously**: Entrances were automatically shown for all enabled regions
**Now**: You can independently toggle entrances for each region

#### How It Works:
- Each region has two controls:
  1. **Enable/Disable Region** - Shows/hides the region on the floor plan
  2. **Has Entrance** - Shows/hides the entrance door for that region

#### Visual Design:
```
Left Sidebar:
┌─────────────────────────┐
│ Building Regions        │
├─────────────────────────┤
│ ☑ 🟦 North              │
│   ☑ 🚪 Has Entrance     │
├─────────────────────────┤
│ ☑ 🟩 South              │
│   ☐ 🚪 Has Entrance     │  ← Can disable entrance
├─────────────────────────┤
│ ☑ 🟧 East               │
│   ☑ 🚪 Has Entrance     │
└─────────────────────────┘
```

#### Use Cases:
- **Security Zones**: Region enabled but entrance blocked for security
- **Construction**: Region visible but entrance temporarily closed
- **Access Control**: Show wing but restrict entry points
- **Emergency**: Quickly close specific entrances

### 2. 🖱️ Elevator Square with Entrance Lanes

**New Design**: Elevator is now inside a **4x4 grid square** with entrance lanes on each side

#### Visual Layout:
```
┌────────────────────┐
│    🚪 (North)      │  ← Entrance lane (if enabled)
│                    │
│  🚪 [ELEVATOR] 🚪  │  ← West & East lanes
│                    │
│    🚪 (South)      │  ← South lane
└────────────────────┘
```

#### Components:
- **Outer Square**: 4x4 grid cells (80x80px) - light gray background
- **Elevator Core**: 2x2 grid cells (40x40px) - dark gray, centered
- **Entrance Lanes**: 1.5 cells wide on each side - green if enabled
- **Door Icons**: 🚪 visible on lanes with entrances

#### Features:
- Elevator always centered at (50%, 50%)
- Square provides visual boundary
- Lanes clearly show access points
- Each lane can be toggled independently

### 3. 📦 Drag and Drop Items

**New Capability**: Islands and meeting rooms can now be dragged to any position on the floor plan

#### How to Use:
1. **Click** on an island or meeting room
2. **Hold mouse button** and drag
3. **Move** to desired position
4. **Release** to drop

#### Features:
- **Snap to Grid**: Items align to grid cells automatically
- **Boundary Detection**: Can't drag outside canvas
- **Visual Feedback**: Cursor changes to move icon
- **Real-time Update**: Position updates as you drag
- **Selection Sync**: Dropped item becomes selected

#### Technical Details:
```typescript
// Drag states
const [isDragging, setIsDragging] = useState(false);
const [draggedItem, setDraggedItem] = useState<PlaceableItem | null>(null);
const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

// Mouse handlers
onMouseDown  → Start drag (record offset)
onMouseMove  → Update position (constrained to bounds)
onMouseUp    → End drag (finalize position)
onMouseLeave → Cancel drag (cleanup)
```

#### Benefits:
- **Flexible Layout**: Arrange items exactly where you want
- **Visual Planning**: See real-time positioning
- **Easy Adjustments**: Quickly reorganize floor plan
- **No Manual Input**: No need to type coordinates

## Updated UI Controls

### Left Sidebar - Building Regions

```tsx
Building Regions:
┌─────────────────────────────┐
│ ☑ 🟦 North (Region)         │
│   ☑ 🚪 Has Entrance         │  ← NEW: Entrance toggle
├─────────────────────────────┤
│ ☑ 🟩 South (Region)         │
│   ☑ 🚪 Has Entrance         │
├─────────────────────────────┤
│ ☑ 🟧 East (Region)          │
│   ☐ 🚪 Has Entrance         │  ← Can be disabled
├─────────────────────────────┤
│ ☑ 🟪 West (Region)          │
│   ☑ 🚪 Has Entrance         │
└─────────────────────────────┘
```

### Canvas - Interactive

```
Before (Static):
- Click to select
- No movement

After (Dynamic):
- Click to select
- Drag to move ✨
- Drop to position
```

## Code Changes

### 1. Updated Types

```typescript
interface RegionConfig {
  enabled: boolean;
  color: string;
  label: string;
  entrancePosition: 'top' | 'bottom' | 'left' | 'right';
  hasEntrance: boolean; // ← NEW
}
```

### 2. New State Variables

```typescript
const [isDragging, setIsDragging] = useState(false);
const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
```

### 3. New Functions

```typescript
// Entrance control
const toggleEntrance = (region: Region) => {
  // Toggle hasEntrance flag for region
};

// Drag handlers
const handleMouseDown = (e) => { /* Start drag */ };
const handleMouseMove = (e) => { /* Update position */ };
const handleMouseUp = () => { /* End drag */ };
```

### 4. Updated Canvas

```typescript
<canvas
  onMouseDown={handleMouseDown}    // ← NEW
  onMouseMove={handleMouseMove}    // ← NEW
  onMouseUp={handleMouseUp}        // ← NEW
  onMouseLeave={handleMouseUp}     // ← NEW
  className="cursor-move"          // ← Changed from cursor-crosshair
/>
```

### 5. Updated Elevator Drawing

```typescript
const drawElevator = (ctx, pos) => {
  // 1. Draw outer square (4x4 cells)
  // 2. Draw entrance lanes (based on hasEntrance)
  // 3. Draw elevator core (2x2 cells, centered)
  // 4. Add door icons on enabled lanes
};
```

### 6. Updated Entrance Drawing

```typescript
const drawEntrances = (ctx) => {
  Object.entries(floorPlan.regions).forEach(([region, config]) => {
    if (!config.enabled || !config.hasEntrance) return; // ← Added hasEntrance check
    // Draw entrance door
  });
};
```

## Testing Checklist

### Entrance Control
- [ ] Toggle North entrance on/off
- [ ] Toggle South entrance on/off
- [ ] Toggle East entrance on/off
- [ ] Toggle West entrance on/off
- [ ] Verify entrance checkbox only shows when region enabled
- [ ] Verify entrance lanes on elevator square update correctly
- [ ] Verify building edge entrances update correctly

### Drag and Drop
- [ ] Drag an island to new position
- [ ] Drag a meeting room to new position
- [ ] Verify item snaps to grid
- [ ] Verify can't drag outside canvas bounds
- [ ] Verify can't drag beyond top edge (y >= 0)
- [ ] Verify can't drag beyond bottom edge (y + height <= GRID_ROWS)
- [ ] Verify can't drag beyond left edge (x >= 0)
- [ ] Verify can't drag beyond right edge (x + width <= GRID_COLS)
- [ ] Verify cursor changes to move icon
- [ ] Verify dropped item becomes selected
- [ ] Verify dragging updates position in real-time

### Visual Design
- [ ] Elevator square is 4x4 cells
- [ ] Elevator core is 2x2 cells, centered
- [ ] Entrance lanes are visible on enabled sides
- [ ] Door icons (🚪) appear on active lanes
- [ ] Region checkboxes have proper hierarchy
- [ ] Entrance toggle shows door icon

### Integration
- [ ] All regions can be enabled/disabled
- [ ] All entrances can be toggled independently
- [ ] Items can be selected after drag
- [ ] Properties panel updates after drag
- [ ] Zoom works with drag and drop
- [ ] Multiple items can be dragged sequentially

## Example Scenarios

### Scenario 1: Security Zone
**Setup**: 
- North region enabled, entrance ON
- South region enabled, entrance OFF (secured)
- East region enabled, entrance ON
- West region enabled, entrance OFF (secured)

**Result**:
```
┌──────────────────────────┐
│      🚪 NORTH            │
│                          │
│      [ELEVATOR] → 🚪     │  ← Only East entrance
│                          │
│      (no entrance)       │  ← South blocked
└──────────────────────────┘
```

### Scenario 2: Construction Phase
**Setup**:
- All regions enabled
- West entrance OFF (under construction)
- Other entrances ON

**Result**: West wing visible but entrance blocked during construction

### Scenario 3: Custom Layout
**Setup**:
1. Add island "Team A" (default position 5,5)
2. Drag to North region (position 10,3)
3. Add meeting room "Conference" (default 5,5)
4. Drag to South region (position 15,20)

**Result**: Custom positioned items exactly where you want them

## Benefits

### For Users
✅ **Flexibility**: Place items exactly where needed
✅ **Control**: Independently manage region visibility and access
✅ **Intuitive**: Drag-and-drop is natural and easy
✅ **Visual**: See changes in real-time
✅ **Safety**: Can't accidentally place items outside canvas

### For Security
✅ **Access Control**: Show areas but restrict entrances
✅ **Emergency**: Quickly close specific doors
✅ **Zones**: Different access levels for different regions

### For Planning
✅ **Realistic**: Mirrors physical building with fixed elevator
✅ **Organized**: Clear entrance lanes around elevator core
✅ **Customizable**: Every entrance can be toggled
✅ **Professional**: Clean, modern UI design

## Migration Notes

- **No database changes** required
- **No backend changes** required
- **Frontend only** update
- **Backward compatible** - existing floor plans work unchanged
- **Zero breaking changes**
- **Default behavior**: All entrances enabled (maintains current behavior)

## Files Modified

- ✅ `frontend/src/components/FloorPlanEditorV2.tsx`
  - Added `hasEntrance` to RegionConfig
  - Added drag state variables
  - Added `toggleEntrance()` function
  - Added `handleMouseDown()`, `handleMouseMove()`, `handleMouseUp()` functions
  - Updated `drawElevator()` to show square with lanes
  - Updated `drawEntrances()` to check `hasEntrance`
  - Updated canvas event handlers
  - Updated sidebar with entrance toggles

## Next Steps

To test the new features:

1. **Refresh browser** at `localhost:3003/admin`
2. Go to **Office Management** → **Floor Plan** tab
3. **Test Entrance Control**:
   - Toggle "Has Entrance" for any region
   - Verify elevator square lanes update
   - Verify building edge entrances update
4. **Test Drag & Drop**:
   - Add an island to the floor plan
   - Click and drag it to a new position
   - Release to drop
   - Verify it snaps to grid and stays in bounds

## Result

The floor plan editor now offers:
- 🎨 **Visual Elevator Square** with clear entrance lanes
- 🚪 **Independent Entrance Control** for each region
- 🖱️ **Drag & Drop** for flexible item placement
- 🎯 **Snap to Grid** for precise positioning
- 🛡️ **Boundary Protection** prevents invalid placements
- ⚡ **Real-time Updates** show changes instantly

Perfect for creating realistic, professional office floor plans with full control over layout and access! 🏢✨
