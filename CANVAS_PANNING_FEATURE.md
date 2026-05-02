# Canvas Panning Feature

## Overview
Added canvas panning functionality to the Floor Plan Editor V2, allowing users to drag and move around the canvas - especially useful when zoomed in to view details or work with large floor plans.

## Implementation Date
January 25, 2026

## Features Added

### 1. Canvas Panning
- **Drag to Pan**: Click and drag anywhere on the canvas (not on items) to move the viewport
- **Smooth Movement**: Real-time pan updates for fluid navigation
- **Visual Feedback**: Cursor changes to indicate panning state:
  - `cursor-grab`: Default state (can grab to pan)
  - `cursor-grabbing`: While panning the canvas
  - `cursor-move`: While dragging an item

### 2. State Management
Added two new state variables:
- `isPanning`: Boolean tracking whether canvas is being panned
- `panStart`: Position object storing the initial pan start coordinates

### 3. Mouse Event Handling
Enhanced mouse event handlers to support both panning and item dragging:

#### `handleMouseDown`
- **Item Dragging**: If clicking on an item, starts item drag mode
- **Canvas Panning**: If clicking on empty space, starts canvas pan mode

#### `handleMouseMove`
- **Panning Priority**: If panning, updates pan position and returns early
- **Item Dragging**: Otherwise, handles item dragging as before

#### `handleMouseUp`
- **Cleanup**: Stops both panning and item dragging
- **State Reset**: Clears panning flags

### 4. UI Controls

#### Reset Pan Button
Added in Zoom Controls section:
```tsx
<button
  onClick={() => setPan({ x: 0, y: 0 })}
  className="w-full mt-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
>
  Reset Pan Position
</button>
```

#### Keyboard Shortcuts
Updated help section to include:
- `Drag` - Pan Canvas (new)
- `+/-` - Zoom
- `R` - Rotate CW
- `Shift+R` - Rotate CCW
- `Esc` - Reset Rotation
- `Ctrl+0` - Reset Zoom

## Technical Details

### Pan Calculation
```tsx
if (isPanning) {
  setPan({
    x: e.clientX - panStart.x,
    y: e.clientY - panStart.y
  });
  return;
}
```

### Cursor State Logic
```tsx
className={`border border-gray-700 rounded ${
  isPanning ? 'cursor-grabbing' :    // Active panning
  isDragging ? 'cursor-move' :       // Active item dragging
  'cursor-grab'                       // Default (can pan)
}`}
```

### Pan Start Position
```tsx
setPanStart({
  x: e.clientX - pan.x,
  y: e.clientY - pan.y
});
```

## User Experience

### When to Use Panning
1. **Zoomed In**: Navigate to different areas when zoomed in
2. **Large Canvas**: Move around large floor plans (1500×1000px default)
3. **Precise Positioning**: Center specific areas for detailed work
4. **Multi-Region Work**: Quickly move between different building regions

### How It Works
1. **Click** on empty canvas area (not on items)
2. **Hold** mouse button and drag in any direction
3. **Release** to stop panning
4. **Click "Reset Pan Position"** button to center the view

### Interaction Priority
The system intelligently handles:
- **Click on Item** → Drag item to reposition it
- **Click on Empty Space** → Pan the canvas
- **Both work smoothly** without conflicts

## Canvas Size Support
Works seamlessly with the dynamic canvas size feature:
- Default: 1500px × 1000px
- Range: 500-2500px width, 300-2000px height
- Pan adapts to any canvas size

## Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ All modern browsers with canvas support

## Performance
- **Efficient**: Pan updates use React state (no requestAnimationFrame overhead)
- **Smooth**: Real-time position updates during drag
- **Responsive**: Immediate visual feedback
- **Clean**: Proper cleanup on mouse up/leave events

## Future Enhancements

### Potential Additions
1. **Mouse Wheel Pan**: Hold Shift + scroll to pan horizontally
2. **Pan Limits**: Constrain panning to prevent going too far off-canvas
3. **Mini Map**: Small overview map showing current viewport position
4. **Pan Indicators**: Visual arrows showing pan direction
5. **Touch Support**: Two-finger pan for touch devices
6. **Zoom to Cursor**: Zoom centered on cursor position (not canvas center)
7. **Keyboard Pan**: Arrow keys to pan (e.g., hold Alt + arrows)

### Advanced Features
1. **Auto-Center**: Button to center on specific items or regions
2. **Fit to View**: Automatically adjust zoom/pan to show entire floor plan
3. **Pan Animation**: Smooth animated transitions between pan positions
4. **Pan History**: Back/forward navigation through pan positions
5. **Region Focus**: Quick buttons to pan to each region (NW, NE, SW, SE)

## Code Files Modified
- `frontend/src/components/FloorPlanEditorV2.tsx`
  - Added `isPanning` and `panStart` state variables
  - Updated `handleMouseDown` to detect empty space clicks
  - Updated `handleMouseMove` to handle panning
  - Updated `handleMouseUp` to stop panning
  - Updated canvas cursor className logic
  - Added "Reset Pan Position" button
  - Updated keyboard shortcuts help section

## Testing Checklist
- [x] ✅ Click and drag on empty canvas pans the view
- [x] ✅ Click and drag on items still works (drags item)
- [x] ✅ Cursor changes correctly (grab/grabbing/move)
- [x] ✅ Reset Pan Position button centers view
- [x] ✅ Mouse up/leave stops panning
- [x] ✅ Works with zoom (can pan while zoomed)
- [x] ✅ Works with rotation (can pan rotated canvas)
- [x] ✅ No TypeScript errors
- [x] ✅ Smooth performance

## Usage Example

### Scenario: Working on Large Floor Plan
1. **Open** Floor Plan Editor V2
2. **Zoom In** to 150% for detailed work
3. **Drag canvas** to move to north-west region
4. **Position** desk islands precisely
5. **Drag canvas** to south-east region
6. **Continue** working on other areas
7. **Reset Pan** when done to recenter view

### Scenario: Multi-Region Layout
1. **Start** with default zoom and pan
2. **Add items** to north-west region
3. **Drag canvas** to see south-east region
4. **Add items** to south-east region
5. **Drag canvas** back to center
6. **Zoom out** to see full layout
7. **Save** floor plan

## Benefits
✅ **Better Navigation**: Easy movement around large canvases  
✅ **Zoom Friendly**: Essential for working when zoomed in  
✅ **Intuitive**: Natural drag-to-move interaction  
✅ **Non-Intrusive**: Doesn't interfere with item dragging  
✅ **Accessible**: Simple button to reset pan position  
✅ **Professional**: Matches behavior of design tools (Figma, Photoshop)  

## Conclusion
The canvas panning feature significantly improves the usability of the Floor Plan Editor, especially when working with large floor plans or when zoomed in. The implementation is clean, performant, and follows best UX practices for canvas-based editors.
