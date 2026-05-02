# Canvas View Settings & Lock Feature

## Overview
Added the ability to save canvas view positions (pan, zoom, rotation, canvas size) with each floor plan and a toggle to lock/unlock canvas dragging.

## Features Implemented

### 1. **Save View Settings with Floor Plans**
- Canvas view settings (zoom, rotation, pan, canvas size) are now saved as part of each floor plan
- When switching between floors, the view settings are automatically restored
- View settings persist across browser sessions via localStorage

### 2. **Canvas Lock/Unlock Toggle**
- Added a lock/unlock button in the canvas toolbar
- When **locked** (🔒 Red button):
  - Canvas panning is disabled
  - You can still interact with and drag floor plan elements
  - Prevents accidental canvas movement
- When **unlocked** (🔓 Green button):
  - Canvas panning is enabled (normal behavior)
  - Click and drag empty space to pan the canvas

### 3. **Persistent Settings**
- Lock preference is saved to localStorage
- Lock state persists across page reloads
- Each floor can have its own saved view position

## Technical Changes

### Updated Interface
```typescript
interface FloorPlan {
  // ...existing fields...
  viewSettings?: {
    zoom: number;
    rotation: number;
    pan: Position;
    canvasSize: { width: number; height: number };
  };
}
```

### New State Variable
```typescript
const [isCanvasLocked, setIsCanvasLocked] = useState(false);
```

### Modified Functions

1. **`saveCurrentFloor()`**
   - Now saves current view settings along with floor data
   
2. **`switchToFloor(floorNumber)`**
   - Saves current floor's view settings before switching
   - Restores view settings when loading a different floor
   - Resets to defaults if no view settings exist

3. **`loadSavedFloors()`**
   - Loads and restores view settings for the current floor
   - Loads canvas lock preference from localStorage

4. **`handleMouseDown(e)`**
   - Checks `isCanvasLocked` state before allowing panning
   - Still allows element dragging when canvas is locked

### UI Components

**Canvas Toolbar - Lock Toggle Button**
- Location: Between Rotation controls and Canvas Size controls
- Visual feedback:
  - 🔒 **Locked**: Red background (bg-red-600)
  - 🔓 **Unlocked**: Green background (bg-green-600)
- Hover effects for better UX

## Usage

### Saving View Position
1. Adjust canvas view (pan, zoom, rotate)
2. Click the **"Save"** button in the left sidebar
3. View settings are automatically saved with the floor plan

### Switching Floors
- View settings automatically restore when switching between floors
- Each floor remembers its own view position

### Locking Canvas
1. Click the **Lock/Unlock** button in the canvas toolbar
2. When locked:
   - Canvas panning is disabled
   - Green button turns red with lock icon
3. When unlocked:
   - Canvas panning is enabled
   - Red button turns green with unlock icon

### Keyboard Shortcuts (unchanged)
- `+/-`: Zoom in/out
- `R`: Rotate 90°
- `Esc`: Reset rotation
- Drag: Pan canvas (when unlocked)

## Benefits

✅ **Consistent Workflow**: Each floor maintains its own view position
✅ **Prevent Accidental Movement**: Lock canvas when editing elements
✅ **Better Precision**: Lock canvas to avoid panning while placing objects
✅ **Persistent State**: All settings saved across sessions
✅ **User-Friendly**: Clear visual feedback with color-coded lock button

## Backward Compatibility

- Existing floor plans without view settings will use default values
- No breaking changes to existing functionality
- All existing features continue to work normally
