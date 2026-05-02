# Quadrant-Based Regions - Floor Plan Update

## Overview

Updated the floor plan editor to use **4 quadrant-based regions** positioned around the central elevator, instead of the previous 4-directional regions (North, South, East, West).

## New Region System

### Before (Directional):
- North (top half)
- South (bottom half)
- East (right half)
- West (left half)

### After (Quadrants):
- **North-West** (top-left quadrant)
- **North-East** (top-right quadrant)
- **South-West** (bottom-left quadrant)
- **South-East** (bottom-right quadrant)

## Visual Layout

```
┌─────────────────────────────────┐
│ NW Quadrant  │  NE Quadrant     │
│ (Blue)       │  (Green)         │
│              │                  │
│──────────────┼──────────────────│
│              │                  │
│   ELEVATOR (Center)             │
│              │                  │
│──────────────┼──────────────────│
│              │                  │
│ SW Quadrant  │  SE Quadrant     │
│ (Orange)     │  (Purple)        │
└─────────────────────────────────┘
```

## Key Changes

### 1. **Quadrant Layout**
- Canvas divided into 4 equal quadrants
- Each quadrant surrounds the central elevator
- Clear visual separation with dashed lines

### 2. **Greyed Out Disabled Regions**
When a region is disabled:
- ❌ Semi-transparent grey overlay (`#1f293740`)
- ❌ Dashed grey border (`#4b5563`)
- ❌ No colored tint
- ❌ No entrance access
- ✅ Still visible but clearly inactive

### 3. **Entrance Positioning**
Each quadrant has entrances at:
- **North-West**: Top-left corner of canvas
- **North-East**: Top-right corner of canvas
- **South-West**: Bottom-left corner of canvas
- **South-East**: Bottom-right corner of canvas

### 4. **Elevator Square Entrances**
Entrance lanes now appear at the **corners** of the elevator square:
- **NW Lane**: Top-left corner of square
- **NE Lane**: Top-right corner of square
- **SW Lane**: Bottom-left corner of square
- **SE Lane**: Bottom-right corner of square

## Region Colors

| Region | Color | Hex Code |
|--------|-------|----------|
| **North-West** | 🟦 Blue | #3b82f6 |
| **North-East** | 🟩 Green | #10b981 |
| **South-West** | 🟧 Orange | #f59e0b |
| **South-East** | 🟪 Purple | #8b5cf6 |
| **Disabled** | ⬜ Grey | #1f293740 |

## UI Controls

### Left Sidebar:
```
Building Regions
├─ ☑ 🟦 North-West
│  └─ ☑ 🚪 Has Entrance
├─ ☑ 🟩 North-East
│  └─ ☑ 🚪 Has Entrance
├─ ☑ 🟧 South-West
│  └─ ☑ 🚪 Has Entrance
└─ ☑ 🟪 South-East
   └─ ☑ 🚪 Has Entrance
```

## Visual States

### All Regions Enabled

```
┌─────────────────────────────────┐
│ 🟦 NW    🚪    │  🚪    🟩 NE   │
│                │                │
│                │                │
│──────🚪────────┼────────🚪──────│
│                │                │
│          [ELEVATOR]             │
│                │                │
│──────🚪────────┼────────🚪──────│
│                │                │
│ 🟧 SW    🚪    │  🚪    🟪 SE   │
└─────────────────────────────────┘

All quadrants: Colored tint + solid borders
All entrances: Visible (🚪)
Elevator lanes: All 4 corners active
```

### North-West Disabled

```
┌─────────────────────────────────┐
│ ░░ NW (grey) │  🚪    🟩 NE   │
│ (disabled)   │                │
│              │                │
│───────────────┼────────🚪──────│
│               │                │
│          [ELEVATOR]             │
│               │                │
│──────🚪────────┼────────🚪──────│
│                │                │
│ 🟧 SW    🚪    │  🚪    🟪 SE   │
└─────────────────────────────────┘

NW quadrant: Grey + dashed border
NW entrance: Hidden (no 🚪)
NW elevator lane: No corner entrance
```

### Only South-East Enabled

```
┌─────────────────────────────────┐
│ ░░ NW (grey) │  ░░ NE (grey)  │
│              │                │
│              │                │
│──────────────┼─────────────────│
│              │                │
│          [ELEVATOR]             │
│              │                │
│──────────────┼────────🚪──────│
│              │                │
│ ░░ SW (grey) │  🚪    🟪 SE   │
└─────────────────────────────────┘

SE quadrant: Colored (purple)
All others: Greyed out
Only SE entrance visible
```

## Code Changes

### Type Updates
```typescript
// OLD
type Region = 'north' | 'south' | 'east' | 'west';

// NEW
type Region = 'north-west' | 'north-east' | 'south-west' | 'south-east';
```

### Region Configuration
```typescript
regions: {
  'north-west': { 
    enabled: true, 
    color: '#3b82f6', 
    label: 'North-West', 
    entrancePosition: 'top-left',
    hasEntrance: true 
  },
  'north-east': { 
    enabled: true, 
    color: '#10b981', 
    label: 'North-East', 
    entrancePosition: 'top-right',
    hasEntrance: true 
  },
  'south-west': { 
    enabled: true, 
    color: '#f59e0b', 
    label: 'South-West', 
    entrancePosition: 'bottom-left',
    hasEntrance: true 
  },
  'south-east': { 
    enabled: true, 
    color: '#8b5cf6', 
    label: 'South-East', 
    entrancePosition: 'bottom-right',
    hasEntrance: true 
  }
}
```

### drawRegions Function
```typescript
// For each quadrant:
if (region.enabled) {
  // Draw colored tint + solid border
  ctx.fillStyle = region.color + '10';
  ctx.fillRect(/* quadrant bounds */);
  ctx.strokeStyle = region.color;
} else {
  // Draw grey overlay + dashed border
  ctx.fillStyle = '#1f293740';
  ctx.fillRect(/* quadrant bounds */);
  ctx.strokeStyle = '#4b5563';
  ctx.setLineDash([5, 5]);
}
```

### drawElevator Function
```typescript
// Entrance lanes at corners
if (floorPlan.regions['north-west'].hasEntrance) {
  // Top-left corner lane
  ctx.fillRect(x - squareSize/2, y - squareSize/2, laneSize, laneSize);
}
// ... similar for other 3 corners
```

### drawEntrances Function
```typescript
switch (region) {
  case 'north-west':
    x = 0; y = 0; // Top-left corner
    break;
  case 'north-east':
    x = (GRID_COLS - 3) * GRID_SIZE; y = 0; // Top-right
    break;
  case 'south-west':
    x = 0; y = (GRID_ROWS - 1) * GRID_SIZE; // Bottom-left
    break;
  case 'south-east':
    x = (GRID_COLS - 3) * GRID_SIZE; 
    y = (GRID_ROWS - 1) * GRID_SIZE; // Bottom-right
    break;
}
```

## Use Cases

### 1. **Four Distinct Departments**
- NW: Sales Team
- NE: Engineering Team
- SW: Marketing Team
- SE: Operations Team

Each team gets their own quadrant around the elevator.

### 2. **Phased Building Access**
- Enable only SE and SW (South side)
- Disable NE and NW (North side under renovation)
- Clear visual: North side greyed out

### 3. **Security Zones**
- High security: Only SE enabled with entrance
- All others: Disabled (greyed out)
- Visual clarity of restricted access

### 4. **Multi-Tenant Building**
- Each tenant gets a quadrant
- Disable unoccupied quadrants
- Clear visual occupancy map

## Testing

### Test 1: All Enabled
1. Refresh browser
2. All 4 quadrants should be colored
3. All 4 corner entrances visible
4. All 4 elevator corner lanes active

### Test 2: Disable North-West
1. Uncheck "North-West" checkbox
2. **Verify**:
   - ✅ NW quadrant turns grey
   - ✅ NW has dashed border
   - ✅ NW entrance disappears
   - ✅ NW elevator lane disappears
   - ✅ Other 3 quadrants remain colored

### Test 3: Toggle Entrance
1. Keep NW enabled
2. Uncheck "Has Entrance" for NW
3. **Verify**:
   - ✅ NW quadrant still colored (enabled)
   - ✅ NW entrance disappears (no access)
   - ✅ NW elevator lane disappears

### Test 4: Only SE Enabled
1. Disable NW, NE, SW
2. Keep SE enabled
3. **Verify**:
   - ✅ SE quadrant: Purple color
   - ✅ All others: Grey
   - ✅ Only SE entrance visible
   - ✅ Clear visual contrast

### Test 5: Drag Items Across Quadrants
1. Add an island
2. Drag from NW quadrant to SE quadrant
3. **Verify**:
   - ✅ Item moves smoothly
   - ✅ Can be placed in any enabled quadrant
   - ✅ Item region label updates

## Benefits

### Visual Clarity
✅ **Quadrant layout** mirrors real office buildings
✅ **Greyed out regions** immediately show disabled areas
✅ **Corner positioning** around elevator is intuitive
✅ **Color coding** makes each quadrant distinct

### Realistic Layout
✅ **Elevator at center** (industry standard)
✅ **4 quadrants** around elevator (common floor plan)
✅ **Independent access** for each quadrant
✅ **Disabled areas** still visible but inactive

### Flexibility
✅ **Enable/disable** any combination of quadrants
✅ **Independent entrances** for each quadrant
✅ **Clear visual feedback** for all states
✅ **Easy to understand** layout

## Files Modified

- ✅ `frontend/src/components/FloorPlanEditorV2.tsx`
  - Updated Region type: 4 quadrants
  - Updated RegionConfig with new entrance positions
  - Updated initial state with 4 quadrants
  - Updated drawRegions() for quadrant layout + grey overlay
  - Updated drawElevator() for corner entrance lanes
  - Updated drawEntrances() for corner positions

## Migration Notes

- **No database changes** required
- **No backend changes** required
- **Frontend only** update
- **Existing items** will work (region field updates automatically)
- **Default state**: All 4 quadrants enabled

## Result

The floor plan editor now has a **realistic quadrant-based layout** with:
- 🏢 **4 quadrants** positioned around central elevator
- 🎨 **Greyed out disabled regions** for clear visual feedback
- 🚪 **Corner-based entrances** matching quadrant positions
- ✨ **Professional office building** design

Perfect for managing modern office buildings with quadrant-based layouts! 🏢✨
