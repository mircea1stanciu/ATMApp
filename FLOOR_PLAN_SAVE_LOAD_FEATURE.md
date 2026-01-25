# Floor Plan Save/Load & Multi-Floor Management Feature

## Overview
Added comprehensive save/load functionality and multi-floor management to the FloorPlanEditorV2 component. Users can now save floor plans locally, export/import them as JSON files, and manage multiple floors within the same building.

## Features Implemented

### 1. Save Current Floor
- **Button**: "Save Floor [X]" (green button in sidebar)
- **Functionality**: Saves the current floor plan to browser localStorage
- **Storage Key**: `floorPlans`
- **Auto-load**: Previously saved floors are automatically loaded on page refresh

### 2. Export Floor Plans
- **Export Current Floor**: Downloads the current floor as a JSON file
  - Filename format: `floor-[building]-[floor].json`
- **Export All Floors**: Downloads all saved floors as a single JSON file
  - Filename format: `all-floors-[building].json`

### 3. Import Floor Plans
- **Import Button**: Purple "Import" button
- **Supports**:
  - Single floor JSON files
  - Multi-floor JSON files (exports from "Export All")
- **Auto-detection**: Automatically detects file format and loads appropriately

### 4. Multi-Floor Management
- **Floor Manager**: Toggle panel showing all available floors
- **Features**:
  - **View All Floors**: Grid display of all saved floors
  - **Switch Floors**: Click any floor number to switch to it
  - **Current Floor Indicator**: Blue highlight on active floor
  - **Add New Floor**: Input field + button to create new floors
  - **Delete Floors**: Red × button on each floor (except current)
  - **Auto-save**: Current floor is auto-saved when switching

### 5. Floor Switching
- Automatically saves current floor before switching
- Loads existing floor data if available
- Creates new default floor layout if floor doesn't exist

## User Interface

### Sidebar Layout (Top to Bottom)
```
┌─────────────────────────────┐
│ Floor Plan Settings         │
├─────────────────────────────┤
│ [Save Floor X]              │ ← Green button
│ [Export] [All]              │ ← Blue buttons
│ [Import]                    │ ← Purple button
├─────────────────────────────┤
│ [Manage Floors (N)]         │ ← Gray toggle button
│   [1] [2] [3] [4] ...      │ ← Floor grid (when expanded)
│   [Floor #] [+]            │ ← Add new floor
├─────────────────────────────┤
│ Building Name - Floor X     │ ← Info display
└─────────────────────────────┘
```

## Data Structure

### Storage Format (localStorage)
```json
{
  "1": {
    "building": "Main Building",
    "floor": "1",
    "regions": { ... },
    "items": [ ... ],
    "elevators": [ ... ],
    "staircases": [ ... ],
    "elevatorZone": { ... }
  },
  "2": {
    "building": "Main Building",
    "floor": "2",
    ...
  }
}
```

### FloorPlan Interface
```typescript
interface FloorPlan {
  building: string;
  floor: string;
  regions: Record<Region, RegionConfig>;
  items: PlaceableItem[];
  elevators: Elevator[];
  staircases: Staircase[];
  elevatorZone: ElevatorZoneConfig;
}
```

## Usage Instructions

### Saving Your Work
1. Make changes to your floor plan (add regions, items, elevators, etc.)
2. Click "Save Floor X" button (green) to save to localStorage
3. Optionally export as JSON for backup using "Export" button

### Managing Multiple Floors
1. Click "Manage Floors" to expand the floor manager
2. See all available floors in the grid
3. Click any floor number to switch to that floor
4. Current floor is highlighted in blue
5. To add a new floor:
   - Enter floor number in the input field
   - Click the "+" button
6. To delete a floor:
   - Click the red "×" on any floor (except current)

### Creating a New Floor
1. Click "Manage Floors"
2. Enter desired floor number (e.g., "2", "B1", "Mezzanine")
3. Click "+" button
4. New floor is created with default layout
5. Customize the new floor as needed
6. Click "Save Floor X" to save

### Exporting Floor Plans
1. **Single Floor**: Click "Export" to download current floor only
2. **All Floors**: Click "All" to download all saved floors
3. Files are saved as JSON in your Downloads folder

### Importing Floor Plans
1. Click "Import" button
2. Select a JSON file:
   - Single floor file: Loads that floor
   - Multi-floor file: Loads all floors and switches to first one
3. Confirmation message appears on success

### Switching Between Floors
1. Open the floor manager
2. Click on any floor number
3. Current floor is auto-saved before switching
4. Selected floor loads immediately
5. If floor doesn't exist yet, default layout is created

## Backend Integration (Future)

A `saveToBackend()` function is included for future API integration:

```typescript
// Endpoint to create (POST):
POST /api/office/floor-plans
{
  building: string,
  floor: string,
  regions: { ... },
  items: [ ... ],
  elevators: [ ... ],
  staircases: [ ... ],
  elevatorZone: { ... }
}

// Endpoint to retrieve (GET):
GET /api/office/floor-plans?building={name}&floor={number}

// Endpoint to list all floors (GET):
GET /api/office/floor-plans?building={name}
```

Currently, the backend save attempts to use the API but falls back to localStorage if unavailable.

## Technical Details

### State Management
- **savedFloors**: Map<string, FloorPlan> - All saved floors
- **availableFloors**: string[] - Sorted list of floor numbers
- **floorPlan**: FloorPlan - Current active floor
- **showFloorManager**: boolean - Toggle floor manager visibility
- **newFloorNumber**: string - Input for new floor creation

### Functions Added
1. `loadSavedFloors()` - Load all floors from localStorage on mount
2. `saveCurrentFloor()` - Save current floor to localStorage
3. `switchToFloor(floorNumber)` - Switch to different floor
4. `addNewFloor()` - Create and switch to new floor
5. `deleteFloor(floorNumber)` - Delete a floor from storage
6. `exportFloorPlan()` - Export current floor as JSON
7. `exportAllFloors()` - Export all floors as JSON
8. `importFloorPlan(event)` - Import from JSON file
9. `saveToBackend()` - API integration (future)

### Icons Used
- **Save**: Save icon (green button)
- **Download**: Export icon (blue button)
- **Upload**: Import icon (purple button)
- **Layers**: Manage floors and export all (gray/blue buttons)
- **Plus**: Add new floor (green button)

## Testing Checklist

- [x] Save current floor to localStorage
- [x] Load saved floors on page refresh
- [x] Export single floor as JSON
- [x] Export all floors as JSON
- [x] Import single floor JSON
- [x] Import multi-floor JSON
- [x] Switch between floors
- [x] Create new floor
- [x] Delete floor
- [x] Floor manager UI toggle
- [x] Current floor highlighting
- [x] Auto-save on floor switch
- [x] Prevent deleting current floor
- [x] Floor number sorting (numeric)

## Known Limitations

1. **localStorage limits**: Browser localStorage is limited to ~5-10MB
   - Solution: Use backend API for large datasets
2. **No conflict resolution**: If same floor is edited in multiple tabs
   - Solution: Last save wins (implement backend locking if needed)
3. **No undo/redo across floors**: History is per-floor session
   - Solution: Can be added if needed

## Future Enhancements

1. **Backend API integration**: Full CRUD operations on server
2. **Floor templates**: Save/load floor layouts as templates
3. **Duplicate floor**: Copy existing floor to new floor number
4. **Bulk operations**: Copy regions/items between floors
5. **Version control**: Track changes and allow rollback
6. **Collaboration**: Multi-user editing with conflict resolution
7. **Auto-save**: Periodic auto-save every N seconds
8. **Floor preview**: Thumbnail view of each floor in manager

## Migration Notes

No breaking changes to existing functionality. All existing floor plan data structures remain compatible. New features are additive only.

## Files Modified

1. **FloorPlanEditorV2.tsx**
   - Added import: `Download, Upload, Layers` icons
   - Added state: `savedFloors`, `availableFloors`, `showFloorManager`, `newFloorNumber`
   - Added functions: Save/Load/Export/Import/Switch floor functions
   - Added UI: Save/Load controls and Floor Manager panel in sidebar

## Summary

Users can now:
✅ Save their floor plans locally
✅ Export floor plans as JSON files
✅ Import floor plans from JSON files
✅ Manage multiple floors within the same building
✅ Switch between floors seamlessly
✅ Create and delete floors
✅ Auto-load saved floors on page refresh

All data is persisted in localStorage with future backend API support planned.
