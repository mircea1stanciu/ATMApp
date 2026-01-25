# Flexible Region Entrance System for Elevator Zone

## Overview
Completely redesigned the elevator zone entrance system to allow **independent, configurable entrances** that can connect to any building region from any position on the elevator zone borders. Entrances are no longer tied to specific regions, giving complete flexibility in designing floor plan access routes and hallways.

## Implementation Date
*Completed: January 25, 2026*

---

## Key Concept: Independent Entrances

### Previous System (Limitations)
- ❌ Fixed entrance positions per region
- ❌ Simple on/off toggles per zone side
- ❌ Could only have one entrance per side
- ❌ Entrances tied directly to elevator exits

### New System (Flexible)
- ✅ **Multiple entrances per zone side** (north, south, east, west)
- ✅ **Positioned anywhere** along each side (0-100%)
- ✅ **Connect to any region** (independent of elevator exits)
- ✅ **Customizable width** (1-4 grid cells)
- ✅ **Color-coded by target region**
- ✅ **Future: Hallway paths** around elevator zone

---

## Features

### 1. **Independent Entrance Configuration**

Each entrance is a separate entity with:

```typescript
interface RegionEntrance {
  id: string;                    // Unique identifier
  side: 'north' | 'south' | 'east' | 'west'; // Zone border
  position: number;              // 0-1 (0=left/top, 1=right/bottom)
  width: number;                 // 1-4 grid cells
  targetRegion: Region | null;   // Which region this connects to
  hasHallway: boolean;           // For future hallway feature
  hallwayPath?: 'clockwise' | 'counterclockwise';
}
```

### 2. **Visual Design**

#### Entrance Rendering
- **Color**: Uses target region's color (or green if no target)
- **Opacity**: Semi-transparent (40% normal, 60% when selected)
- **Border**: Colored outline (green when selected)
- **Icon**: Door emoji 🚪 centered in entrance
- **Label**: Region name displayed below entrance
- **Selection**: Green highlight when entrance is selected

#### Example Configurations

**Scenario 1: South entrance wraps around to North-West region**
```
     [NW Region]
    ┌─────────┐
    │         │
    │   🛗    │
    │         │
    └─────────┘
        🚪 ← Entrance connects to NW via hallway
     (South side, connects to North-West)
```

**Scenario 2: Multiple entrances on same side**
```
    🚪        🚪
  (to NW)  (to NE)
    ┌─────────┐
    │         │
    │   🛗    │
    │         │
    └─────────┘
```

**Scenario 3: Asymmetric access**
```
        🚪
      (to SW)
    ┌─────────┐
 🚪 │         │
(NW)│   🛗    │
    │         │
    └─────────┘
              🚪
            (to SE)
```

### 3. **Entrance Management UI**

#### Add/Remove Entrances
```
┌─────────────────────────────┐
│ Region Entrances: 4          │
│ [+ Add Entrance] [- Remove]  │
└─────────────────────────────┘
```

- **Add Entrance**: Creates new entrance at north/center by default
- **Remove**: Deletes currently selected entrance
- **No Limit**: Can add unlimited entrances (practical limit ~10)

#### Entrance List (Scrollable)
```
┌─────────────────────────────┐
│ ● Entrance #1        North  │
│   → North-West               │
├─────────────────────────────┤
│   Entrance #2        South  │
│   → South-East               │
├─────────────────────────────┤
│   Entrance #3        East   │
│   → (None)                   │
└─────────────────────────────┘
```

- **Selection**: Click to select entrance
- **Color**: Green background when selected
- **Info**: Shows side and target region
- **Scrollable**: Max height to prevent overflow

#### Selected Entrance Configuration Panel

```
┌─────────────────────────────┐
│ Entrance #1                  │
├─────────────────────────────┤
│ Zone Side:     [North ▼]    │
│                               │
│ Position: 25%                │
│ [====●---------------]        │
│ Left/Top      Right/Bottom   │
│                               │
│ Connects To:                 │
│ [North-West ▼]               │
│                               │
│ Width: 2 cells               │
│ [=====●=====]                │
└─────────────────────────────┘
```

**Controls**:
1. **Zone Side**: Dropdown (North, South, East, West)
2. **Position**: Slider (0-100%, 5% increments)
3. **Connects To**: Dropdown (None, NW, NE, SW, SE)
4. **Width**: Slider (1-4 cells, 0.5 increments)

---

## Usage Guide

### Create a Custom Entrance Layout

#### Example: "L-Shaped Building with Wrap-Around Hallway"

**Goal**: South entrance connects to North-West region via hallway

**Steps**:
1. **Add Entrance**: Click "+ Add Entrance"
2. **Set Side**: Select "South"
3. **Set Position**: Move slider to 30% (left side of south edge)
4. **Set Target**: Select "North-West" from Connects To dropdown
5. **Adjust Width**: Set to 2 cells (standard hallway width)

**Result**: Entrance appears on south side of elevator zone, color-coded blue (North-West color), labeled "North-West"

#### Example: "Central Hub with Four Regional Entrances"

**Configuration**:
```
Entrance 1: North side, 25%, → North-West
Entrance 2: North side, 75%, → North-East
Entrance 3: South side, 25%, → South-West
Entrance 4: South side, 75%, → South-East
```

**Result**: Four entrances, two on north, two on south, each connecting to adjacent region

#### Example: "Single Corridor Building"

**Configuration**:
```
Entrance 1: West side, 50% (center), → South-West (all regions accessible from this corridor)
```

**Result**: Single entrance on west side connecting to main corridor region

### Position Entrance Precisely

**Position Values**:
- `0.0` (0%): Far left (north/south) or top (east/west)
- `0.25` (25%): Quarter position
- `0.5` (50%): Center (default)
- `0.75` (75%): Three-quarter position
- `1.0` (100%): Far right (north/south) or bottom (east/west)

**Tips**:
- Use 0.5 for centered entrances
- Use 0.25/0.75 for symmetrical dual entrances
- Use 0.0/1.0 for corner-adjacent entrances
- Adjust by 5% increments for fine-tuning

### Width Guidelines

**1 cell (20px)**: Emergency exit, service entrance
**1.5 cells (30px)**: Narrow corridor
**2 cells (40px)**: Standard hallway (default, recommended)
**2.5 cells (50px)**: Wide corridor
**3-4 cells (60-80px)**: Grand entrance, lobby connection

---

## Use Cases

### 1. **Wrap-Around Hallway**
```
North-West Region ←─┐
                    │ (hallway)
    ┌─────────┐     │
    │   🛗    │     │
    └─────────┘     │
        🚪 ←────────┘
    South entrance
```
- Entrance on south connects to North-West region
- Represents hallway that wraps around elevator zone
- Common in L-shaped or complex buildings

### 2. **Asymmetric Access**
```
    🚪 (to NW, wide entrance)
    ┌─────────┐
    │   🛗    │
    └─────────┘
          🚪 (to SE, service entrance)
```
- Different entrance widths
- Different target regions
- Reflects real building layouts

### 3. **Multiple Entrances to Same Region**
```
 🚪 (West, to SW)
    ┌─────────┐
    │   🛗    │
    └─────────┘
        🚪 (South, also to SW)
```
- Two entrances connect to same region
- Represents multiple access points to one area
- Common in open-plan offices

### 4. **Through-Corridor Configuration**
```
 🚪 (West, to corridor)
    ┌─────────┐
    │   🛗    │   🚪 (East, to corridor)
    └─────────┘
```
- Entrances on opposite sides
- Represents corridor passing through building
- Elevator zone is in the middle of hallway

---

## Technical Implementation

### Data Structure

**FloorPlan.elevatorZone.entrances**:
```typescript
elevatorZone: {
  size: 14,
  entrances: [
    {
      id: '1',
      side: 'north',
      position: 0.25,
      width: 2,
      targetRegion: 'north-west',
      hasHallway: false
    },
    {
      id: '2',
      side: 'south',
      position: 0.75,
      width: 2,
      targetRegion: 'south-east',
      hasHallway: false
    }
  ]
}
```

### Rendering Algorithm

```typescript
floorPlan.elevatorZone.entrances.forEach((entrance) => {
  // Calculate entrance position based on side and position
  const entranceWidth = GRID_SIZE * entrance.width;
  const entranceDepth = GRID_SIZE * 1.5;
  
  let x, y, w, h;
  switch (entrance.side) {
    case 'north':
      x = centerX - zoneSize/2 + (zoneSize * entrance.position) - entranceWidth/2;
      y = centerY - zoneSize/2 - entranceDepth;
      w = entranceWidth;
      h = entranceDepth;
      break;
    // ...similar for south, east, west
  }
  
  // Draw with region color
  const color = entrance.targetRegion 
    ? floorPlan.regions[entrance.targetRegion].color 
    : '#10b981';
  
  ctx.fillStyle = `${color}40`; // Semi-transparent
  ctx.fillRect(x, y, w, h);
  
  // Draw border, icon, label
});
```

### State Management

**Selection State**:
```typescript
const [selectedEntranceId, setSelectedEntranceId] = useState<string | null>(null);
```

**Add Entrance**:
```typescript
const newId = String(Math.max(...entrances.map(e => parseInt(e.id)), 0) + 1);
setFloorPlan(prev => ({
  ...prev,
  elevatorZone: {
    ...prev.elevatorZone,
    entrances: [...prev.elevatorZone.entrances, newEntrance]
  }
}));
```

**Update Entrance Property**:
```typescript
setFloorPlan(prev => ({
  ...prev,
  elevatorZone: {
    ...prev.elevatorZone,
    entrances: prev.elevatorZone.entrances.map(e =>
      e.id === selectedEntranceId
        ? { ...e, position: newPosition }
        : e
    )
  }
}));
```

---

## Design Decisions

### Why Independent Entrances?
**Problem**: Old system forced entrances to match elevator exits
**Solution**: Entrances are now separate entities that can connect anywhere
**Benefit**: Represents real buildings where hallways wrap around elevator cores

### Why Position as 0-1 Range?
**Reason**: Scales with any elevator zone size
**Alternative**: Absolute pixel positions (doesn't scale)
**Example**: Position 0.5 always centers, whether zone is 10×10 or 20×20

### Why Color-Code by Region?
**Benefit**: Instant visual feedback on which region an entrance connects to
**UX**: User can see at a glance where entrance leads
**Accessibility**: Color + text label for clarity

### Why Allow Unlimited Entrances?
**Flexibility**: Complex buildings may need many access points
**Practical Limit**: UI becomes crowded beyond ~10 entrances
**Future**: Could add pagination or filtering if needed

---

## Future Enhancements

### Short-Term
- [ ] **Hallway Visualization**: Draw hallway paths around elevator zone
  - Clockwise/counterclockwise routing
  - Curved or right-angle paths
  - Hallway width indicator
  
- [ ] **Entrance Templates**: Pre-configured layouts
  - "Four Corner Entrances"
  - "Through Corridor" (east-west)
  - "L-Shaped Building"
  - "Single Lobby Entrance"

- [ ] **Snap to Grid**: Option to snap entrance positions to grid cells
  - Ensures alignment with floor plan grid
  - Toggle for precise vs. snapped positioning

### Medium-Term
- [ ] **Drag-and-Drop Entrances**: Reposition by dragging on canvas
- [ ] **Entrance Groups**: Link multiple entrances as a set
- [ ] **Entrance Rotation**: Angled entrances (not just perpendicular)
- [ ] **Access Control**: Mark entrances as restricted/public
- [ ] **Traffic Flow**: Visualize foot traffic through entrances

### Long-Term
- [ ] **3D Hallway Rendering**: Show hallway paths in 3D
- [ ] **Evacuation Planning**: Mark emergency exits
- [ ] **Entrance Scheduling**: Time-based entrance availability
- [ ] **Security Integration**: Badge readers, access logs
- [ ] **Capacity Tracking**: Monitor entrance congestion

---

## Migration Notes

### Breaking Changes
- ✅ **elevatorZone.entrances** changed from boolean object to array
- ✅ **RegionConfig.entrancePosition** removed (entrances now independent)
- ✅ **RegionConfig** simplified (only enabled, color, label, hasEntrance)

### Data Migration
Old floor plans will need entrance conversion:

```typescript
// Migration function
function migrateEntrances(oldPlan) {
  const oldEntrances = oldPlan.elevatorZone.entrances;
  const newEntrances: RegionEntrance[] = [];
  
  let idCounter = 1;
  
  // Convert old boolean entrances to new array format
  if (oldEntrances.north) {
    newEntrances.push({
      id: String(idCounter++),
      side: 'north',
      position: 0.5,
      width: 2,
      targetRegion: 'north-west', // Guess based on proximity
      hasHallway: false
    });
  }
  
  // Similar for south, east, west...
  
  return {
    ...oldPlan,
    elevatorZone: {
      ...oldPlan.elevatorZone,
      entrances: newEntrances
    }
  };
}
```

---

## Best Practices

### Entrance Placement
1. **Align with building corridors**: Match real hallway positions
2. **Space evenly for symmetry**: Use 0.25, 0.5, 0.75 for balanced layouts
3. **Consider foot traffic**: Place entrances where people will walk
4. **Mark primary entrance**: Use wider width (3-4 cells) for main access

### Region Connections
1. **Match physical layout**: Connect entrances to actual adjacent regions
2. **Use wrap-around for corners**: South entrance can connect to North-West
3. **Label clearly**: Always set targetRegion for clarity
4. **Test accessibility**: Ensure all regions are reachable

### Width Selection
1. **Standard hallways**: 2 cells (40px)
2. **Main entrances**: 3-4 cells (60-80px)
3. **Service entries**: 1-1.5 cells (20-30px)
4. **Emergency exits**: 1.5 cells minimum

### Visual Organization
1. **Limit entrances per side**: 2-3 maximum for clarity
2. **Use color coding**: Let region colors guide navigation
3. **Space out positions**: Avoid clustering (use 0.2+ spacing)
4. **Select to configure**: Always select entrance before editing

---

## Troubleshooting

### Entrance Not Visible
- **Check side**: Ensure entrance is on correct zone border
- **Check position**: Value should be 0-1 range
- **Check canvas**: May be off-screen if position is 0 or 1
- **Zoom out**: Entrance may be outside viewport

### Wrong Color
- **Check targetRegion**: Entrance uses region's color
- **If null**: Shows default green (#10b981)
- **Update connection**: Select region from "Connects To" dropdown

### Overlapping Entrances
- **Adjust positions**: Increase spacing between entrances
- **Reduce width**: Make narrower to fit more entrances
- **Use different sides**: Distribute across north/south/east/west

### Can't Delete Entrance
- **Select first**: Click entrance in list to select
- **Then delete**: "- Remove" button activates when selected
- **No minimum**: Can delete all entrances (unlike elevators)

---

## Files Modified

### Primary File
- **frontend/src/components/FloorPlanEditorV2.tsx**
  - Added `RegionEntrance` interface
  - Added `ElevatorZoneSide` type
  - Updated `ElevatorZoneConfig.entrances` to array
  - Simplified `RegionConfig` (removed entrancePosition)
  - Added `selectedEntranceId` state
  - Rewrote entrance rendering in `drawElevator()`
  - Completely replaced entrance UI controls
  - Added entrance management panel

### Dependencies
No new dependencies. Uses existing:
- React hooks (useState)
- HTML5 Canvas API
- Tailwind CSS

---

## Summary

✅ **Complete**: Flexible, independent entrance system for elevator zone with unlimited configurability

✅ **Features**:
- Multiple entrances per zone side
- Positioned anywhere (0-100%)
- Connect to any region
- Customizable width (1-4 cells)
- Color-coded by target region
- Full add/edit/delete controls
- Selection highlighting

✅ **Benefits**:
- Represents real building layouts
- Supports wrap-around hallways
- Enables asymmetric access patterns
- Future-proof for hallway visualization

✅ **TypeScript**: No errors
✅ **UI**: Complete with comprehensive controls
✅ **Visual**: Color-coded with region labels

**Ready for complex floor plan designs!**
