# Elevator Zone Size and Entrances Feature

## Overview
Enhanced the Floor Plan Editor V2 with **dynamic elevator zone sizing** and **configurable entrances on the elevator zone borders**. Users can now adjust the size of the elevator zone (10×10 to 20×20 cells) and enable/disable entrance lanes on any of the four sides (north, south, east, west).

## Implementation Date
*Completed: January 25, 2026*

---

## Features

### 1. **Dynamic Elevator Zone Size**

#### Size Range
- **Minimum**: 10×10 cells (200px × 200px)
- **Maximum**: 20×20 cells (400px × 400px)
- **Default**: 14×14 cells (280px × 280px)
- **Increment**: 2 cells per step
- **Available Sizes**: 10, 12, 14, 16, 18, 20 cells

#### UI Control
- **Slider Control**: Smooth adjustment from 10 to 20 cells
- **Live Display**: Shows current size (e.g., "14×14 cells")
- **Real-time Update**: Canvas updates immediately when size changes
- **Visual Feedback**: Zone border and grid scale dynamically

#### Benefits
- **Flexibility**: Accommodate different building layouts
- **Scalability**: Support more elevators with larger zones
- **Planning**: Better space utilization for various configurations
- **Optimization**: Right-size the zone for actual needs

### 2. **Elevator Zone Entrances**

#### Entrance Positions
Four configurable entrance positions on the elevator zone borders:
- **North**: Top edge of the zone (connects to upper floors/corridors)
- **South**: Bottom edge of the zone (connects to lower areas)
- **East**: Right edge of the zone (connects to east wing)
- **West**: Left edge of the zone (connects to west wing)

#### Entrance Design
Each entrance lane:
- **Width**: 2 grid cells (40px) - centered on the zone edge
- **Depth**: 1.5 grid cells (30px) - extends outward from zone
- **Color**: Semi-transparent green (#10b98140)
- **Border**: Green outline (#10b981)
- **Icon**: Door emoji 🚪 centered in the lane
- **Visibility**: Only shown when enabled

#### UI Controls
- **Checkboxes**: One for each direction (North, South, East, West)
- **Toggle**: Enable/disable entrances independently
- **Default State**: All four entrances enabled
- **Live Update**: Canvas reflects changes immediately

#### Use Cases
- **Single Entrance**: Office with one main access point
- **Dual Entrances**: Opposite sides (e.g., North-South corridor)
- **Triple Entrances**: Three access points for high-traffic areas
- **Quad Entrances**: All four sides for central elevator hubs

---

## Technical Implementation

### Data Model

#### ElevatorZoneConfig Interface
```typescript
interface ElevatorZoneConfig {
  size: number; // Size in grid cells (10-20)
  entrances: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
}
```

#### Updated FloorPlan Interface
```typescript
interface FloorPlan {
  building: string;
  floor: string;
  regions: Record<Region, RegionConfig>;
  items: PlaceableItem[];
  elevators: Elevator[];
  elevatorZone: ElevatorZoneConfig; // NEW
}
```

### Initial State
```typescript
elevatorZone: {
  size: 14, // 14×14 cells (280px × 280px)
  entrances: {
    north: true,
    south: true,
    east: true,
    west: true
  }
}
```

### Rendering Logic

#### Dynamic Zone Size
```typescript
const drawElevator = (ctx: CanvasRenderingContext2D, pos: Position) => {
  const centerX = pos.x * GRID_SIZE;
  const centerY = pos.y * GRID_SIZE;
  const zoneSize = GRID_SIZE * floorPlan.elevatorZone.size; // Dynamic!
  
  // Zone scales based on configuration
  ctx.fillRect(centerX - zoneSize / 2, centerY - zoneSize / 2, zoneSize, zoneSize);
  // ...
};
```

#### Entrance Rendering
Each enabled entrance is drawn with this pattern:
```typescript
// Example: North entrance
if (floorPlan.elevatorZone.entrances.north) {
  const entranceWidth = GRID_SIZE * 2;     // 40px wide
  const entranceDepth = GRID_SIZE * 1.5;   // 30px deep
  const entranceX = centerX - entranceWidth / 2;
  const entranceY = centerY - zoneSize / 2 - entranceDepth;
  
  // Draw entrance lane
  ctx.fillStyle = '#10b98140'; // Semi-transparent green
  ctx.fillRect(entranceX, entranceY, entranceWidth, entranceDepth);
  
  // Draw border
  ctx.strokeStyle = '#10b981';
  ctx.strokeRect(entranceX, entranceY, entranceWidth, entranceDepth);
  
  // Draw door icon
  ctx.fillText('🚪', entranceX + entranceWidth / 2, entranceY + entranceDepth / 2 + 5);
}
```

Similar logic for South, East, and West entrances with adjusted coordinates.

---

## UI Components

### Elevator Zone Configuration Panel

Located in the sidebar after Elevator Management section:

```tsx
{/* Elevator Zone Configuration */}
<div className="mb-6">
  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
    <Building2 size={16} />
    Elevator Zone
  </h4>
  
  <div className="space-y-3">
    {/* Zone Size Slider */}
    <div>
      <label className="text-xs text-gray-400 block mb-1">
        Zone Size: {size}×{size} cells
      </label>
      <input
        type="range"
        min="10"
        max="20"
        step="2"
        value={size}
        onChange={handleSizeChange}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>10</span>
        <span>20</span>
      </div>
    </div>

    {/* Zone Entrances Checkboxes */}
    <div>
      <label className="text-xs text-gray-400 block mb-2">Zone Entrances</label>
      <div className="grid grid-cols-2 gap-1">
        {['north', 'south', 'east', 'west'].map((direction) => (
          <label key={direction} className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={entrances[direction]}
              onChange={handleEntranceToggle}
              className="w-3 h-3"
            />
            <span className="text-gray-300 capitalize">{direction}</span>
          </label>
        ))}
      </div>
    </div>
  </div>
</div>
```

---

## Usage Guide

### Adjust Elevator Zone Size

1. **Locate Slider**: Find "Elevator Zone" section in sidebar
2. **Read Current Size**: Display shows current dimensions (e.g., "14×14 cells")
3. **Drag Slider**: Move left (smaller) or right (larger)
4. **View Update**: Canvas updates in real-time
5. **Available Sizes**: 10, 12, 14, 16, 18, 20 cells

**When to Increase Size**:
- Adding more elevators (need more space)
- Larger building layout
- More complex elevator arrangements
- Better visual separation

**When to Decrease Size**:
- Fewer elevators
- Compact floor plans
- Maximize workspace area for desks/rooms
- Smaller buildings

### Configure Zone Entrances

1. **Locate Checkboxes**: "Zone Entrances" section below size slider
2. **Select Directions**: Check/uncheck North, South, East, West
3. **View Results**: Entrance lanes appear/disappear on canvas
4. **Plan Access**: Enable entrances where people enter the zone

**Common Configurations**:

**Single Entrance** (e.g., South only):
- ☐ North
- ☑ South
- ☐ East
- ☐ West

**Opposite Entrances** (e.g., North-South corridor):
- ☑ North
- ☑ South
- ☐ East
- ☐ West

**All Entrances** (Central hub):
- ☑ North
- ☑ South
- ☑ East
- ☑ West

---

## Visual Examples

### Size Comparison

**10×10 Zone** (Compact):
```
┌─────────────┐
│             │
│    🛗 🛗    │
│             │
└─────────────┘
```

**14×14 Zone** (Default - Balanced):
```
┌───────────────────┐
│                   │
│                   │
│      🛗 🛗        │
│                   │
│                   │
└───────────────────┘
```

**20×20 Zone** (Spacious):
```
┌─────────────────────────────┐
│                             │
│                             │
│                             │
│          🛗 🛗              │
│                             │
│                             │
│                             │
└─────────────────────────────┘
```

### Entrance Configurations

**North Entrance Only**:
```
        🚪
    ┌─────────┐
    │         │
    │   🛗    │
    │         │
    └─────────┘
```

**North & South Entrances**:
```
        🚪
    ┌─────────┐
    │         │
    │   🛗    │
    │         │
    └─────────┘
        🚪
```

**All Four Entrances**:
```
         🚪
    ┌─────────┐
 🚪 │         │ 🚪
    │   🛗    │
    └─────────┘
         🚪
```

---

## Integration Points

### State Management
All zone configuration is part of the `floorPlan` state:
```typescript
const [floorPlan, setFloorPlan] = useState<FloorPlan>({
  // ...other properties
  elevatorZone: {
    size: 14,
    entrances: { north: true, south: true, east: true, west: true }
  }
});
```

### Canvas Dependency
The canvas re-renders when elevator zone configuration changes:
```typescript
useEffect(() => {
  // ...canvas setup
  drawElevator(ctx, elevatorPosition);
  // drawElevator now uses floorPlan.elevatorZone
}, [floorPlan.elevatorZone, floorPlan.elevators, /* other deps */]);
```

### Backend Persistence
When saving floor plan:
```json
{
  "building": "Main Building",
  "floor": "1",
  "elevatorZone": {
    "size": 14,
    "entrances": {
      "north": true,
      "south": true,
      "east": false,
      "west": true
    }
  },
  "elevators": [...]
}
```

---

## Design Decisions

### Why 10-20 Cell Range?
- **Minimum (10)**: Accommodates at least 4-5 elevators comfortably
- **Maximum (20)**: Prevents zone from dominating entire floor plan
- **Step (2)**: Even increments maintain grid alignment
- **Default (14)**: Balanced size for most use cases

### Why 2-Cell Wide Entrances?
- **Width**: Matches typical corridor width in floor plans
- **Visibility**: Wide enough to see door icon clearly
- **Proportion**: Looks balanced on various zone sizes
- **Accessibility**: Represents realistic entrance dimensions

### Why Outward-Extending Entrances?
- **Visual Clarity**: Clearly shows connection to external areas
- **Grid Alignment**: Doesn't interfere with internal elevator grid
- **Realism**: Represents actual corridor/hallway connections
- **Flexibility**: Works with any zone size

---

## Best Practices

### Zone Sizing Guidelines

**Small Buildings (1-3 Elevators)**:
- Recommended: 10-12 cells
- Compact, efficient layout
- Maximizes desk/room space

**Medium Buildings (4-6 Elevators)**:
- Recommended: 12-14 cells (default)
- Balanced layout
- Good spacing between elevators

**Large Buildings (7-10 Elevators)**:
- Recommended: 16-20 cells
- Spacious layout
- Allows complex arrangements

### Entrance Planning

**Consider Building Layout**:
- Enable entrances where corridors/hallways connect
- Match actual building access points
- Think about foot traffic flow

**Typical Patterns**:
- **L-shaped building**: Two adjacent sides (e.g., North + East)
- **Rectangular building**: Opposite sides (e.g., North + South)
- **Cross-shaped building**: All four sides
- **Dead-end corridor**: One side only

**Accessibility**:
- Ensure at least one entrance is enabled
- Multiple entrances improve accessibility
- Consider emergency exit requirements

---

## Performance Considerations

### Rendering Optimization
- Zone size change triggers single canvas redraw
- Entrance toggles are lightweight (boolean checks)
- No performance impact with larger zones
- Smooth real-time updates

### Memory Usage
- Minimal: Two additional properties (size: number, entrances: object)
- No impact on existing elevator or item data
- Efficient state updates (immutable)

---

## Testing Scenarios

### Zone Size Testing
1. ✅ Set zone to minimum (10 cells) - verify all elevators visible
2. ✅ Set zone to maximum (20 cells) - verify zone doesn't overlap items
3. ✅ Drag slider smoothly - verify real-time updates
4. ✅ Add 10 elevators in 20×20 zone - verify adequate spacing

### Entrance Testing
1. ✅ Enable all entrances - verify four lanes visible
2. ✅ Disable all entrances - verify no entrance lanes shown
3. ✅ Toggle each entrance - verify correct position (N/S/E/W)
4. ✅ Change zone size with entrances - verify lanes scale correctly

### Integration Testing
1. ✅ Zoom in/out - verify zone and entrances scale
2. ✅ Rotate canvas - verify entrances rotate correctly
3. ✅ Resize canvas - verify zone remains centered
4. ✅ Add/remove elevators - verify zone sizing remains consistent

---

## Known Limitations

1. **Fixed Grid**: 5×5 elevator positioning grid doesn't scale with zone size
   - Larger zones have same number of elevator positions
   - Future: Dynamic grid scaling based on zone size
   
2. **Entrance Width**: Fixed at 2 cells regardless of zone size
   - May look narrow on very large zones
   - Future: Scale entrance width with zone size
   
3. **No Collision Detection**: Entrance lanes can overlap with items
   - Items can be placed over entrance lanes
   - Future: Prevent item placement in entrance areas

4. **Manual Entrance Positioning**: Cannot adjust entrance position along edge
   - Entrances always centered on zone edge
   - Future: Allow entrance position adjustment (e.g., left, center, right)

---

## Future Enhancements

### Short-Term
- [ ] Dynamic grid scaling (6×6, 7×7, etc. for larger zones)
- [ ] Entrance width scales with zone size
- [ ] Visual warnings for entrance-item overlaps
- [ ] Entrance position presets (center, left, right)

### Medium-Term
- [ ] Multiple entrances per side (e.g., two north entrances)
- [ ] Entrance width customization
- [ ] Entrance lane styling options (colors, patterns)
- [ ] Templates for common zone configurations

### Long-Term
- [ ] Auto-suggest zone size based on elevator count
- [ ] Entrance placement based on building layout
- [ ] 3D visualization of elevator zone
- [ ] Traffic flow simulation through entrances
- [ ] Smart entrance recommendations based on foot traffic

---

## Migration Notes

### Breaking Changes
None. This is an additive feature.

### Data Migration
Existing floor plans without `elevatorZone` will need default values:
```typescript
// Migration function (apply in backend if needed)
function migrateFloorPlan(oldPlan) {
  if (!oldPlan.elevatorZone) {
    return {
      ...oldPlan,
      elevatorZone: {
        size: 14, // Default size
        entrances: {
          north: true,
          south: true,
          east: true,
          west: true
        }
      }
    };
  }
  return oldPlan;
}
```

---

## Files Modified

### Primary File
- **frontend/src/components/FloorPlanEditorV2.tsx**
  - Added `ElevatorZoneConfig` interface
  - Updated `FloorPlan` interface
  - Updated initial state with `elevatorZone`
  - Modified `drawElevator()` to use dynamic zone size
  - Added entrance rendering logic
  - Added UI controls for zone size and entrances

### Dependencies
No new dependencies. Uses existing:
- React hooks (useState, useEffect)
- Lucide React icons (Building2)
- HTML5 Canvas API
- Tailwind CSS

---

## Summary

✅ **Complete**: Dynamic elevator zone sizing (10-20 cells) with configurable entrances on all four sides (north, south, east, west).

✅ **Features**:
- Slider control for zone size with live preview
- Checkbox toggles for four entrance positions
- Real-time canvas updates
- Entrance lanes with door icons
- Flexible building layout support

✅ **UI Integration**: Complete with sidebar controls
✅ **TypeScript Compilation**: No errors
✅ **Performance**: Optimized rendering
✅ **Documentation**: Comprehensive guide

**Ready for production use!**
