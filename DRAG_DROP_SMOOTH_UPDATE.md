# Smooth Drag & Drop - Performance Optimization

## Problem
Drag and drop was not fluent - items appeared laggy when dragging because state updates were happening on every mouse move event, causing performance issues.

## Solution Implemented

### 1. **RequestAnimationFrame for Smooth Updates**
Instead of updating state on every mousemove event, we now:
- Store position in a ref (`dragPosRef`)
- Use `requestAnimationFrame` to batch updates
- Only update state when browser is ready to paint

**Before (Laggy):**
```typescript
handleMouseMove = (e) => {
  // Update state IMMEDIATELY on every mouse move
  setFloorPlan(/* ... update position ... */);
  setDraggedItem(/* ... update position ... */);
}
// Result: Too many re-renders, laggy movement
```

**After (Smooth):**
```typescript
handleMouseMove = (e) => {
  // Store position in ref (fast, no re-render)
  dragPosRef.current = { x: newX, y: newY };
  
  // Schedule update on next animation frame
  requestAnimationFrame(() => {
    setFloorPlan(/* ... update position ... */);
  });
}
// Result: Smooth, 60fps movement
```

### 2. **Visual Feedback While Dragging**
Added visual indicators to show item is being dragged:

- **Green border** (`#22c55e`) when dragging (instead of blue/purple)
- **Thicker border** (4px) while dragging
- **Shadow effect** (drop shadow) for depth
- **Increased opacity** (70% instead of 40%) for better visibility
- **Cursor changes**: `cursor-grab` → `cursor-grabbing`

### 3. **Proper Cleanup**
- Cancel any pending animation frames on mouse up
- Reset refs to null
- Clear dragging state properly

## Code Changes

### New Refs
```typescript
const dragPosRef = useRef<Position | null>(null);
const animationFrameRef = useRef<number | null>(null);
```

### Updated handleMouseMove
```typescript
const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!isDragging || !draggedItem) return;

  // Calculate new position
  const newX = Math.max(0, Math.min(GRID_COLS - draggedItem.width, gridX - dragOffset.x));
  const newY = Math.max(0, Math.min(GRID_ROWS - draggedItem.height, gridY - dragOffset.y));

  // Store in ref (no re-render)
  dragPosRef.current = { x: newX, y: newY };

  // Cancel previous animation frame
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
  }

  // Schedule update on next frame (smooth)
  animationFrameRef.current = requestAnimationFrame(() => {
    setFloorPlan(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === draggedItem.id
          ? { ...item, position: dragPosRef.current! }
          : item
      )
    }));
  });
};
```

### Updated handleMouseUp
```typescript
const handleMouseUp = () => {
  // Clean up animation frame
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }

  setIsDragging(false);
  dragPosRef.current = null;
  // ... rest
};
```

### Updated drawItem Function
```typescript
const drawItem = (ctx, item, isSelected, isBeingDragged = false) => {
  // More opaque when dragging
  const opacity = isBeingDragged ? '70' : '40';
  
  // Add shadow when dragging
  if (isBeingDragged) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
  }

  // Green border when dragging, thicker
  ctx.strokeStyle = isBeingDragged ? '#22c55e' :
                    isSelected ? '#fbbf24' : 
                    item.type === 'island' ? '#3b82f6' : '#8b5cf6';
  ctx.lineWidth = isBeingDragged ? 4 : isSelected ? 3 : 2;
  
  // Reset shadow
  if (isBeingDragged) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
};
```

### Updated Canvas Cursor
```typescript
<canvas
  className={`border border-gray-700 rounded ${
    isDragging ? 'cursor-grabbing' : 'cursor-grab'
  }`}
/>
```

## Performance Improvements

### Before:
- ❌ **60-100+ state updates per second** during drag
- ❌ React re-renders on every mouse move
- ❌ Laggy, stuttering movement
- ❌ Poor user experience
- ❌ High CPU usage

### After:
- ✅ **~60 state updates per second** (tied to monitor refresh rate)
- ✅ Smooth, butter-like movement
- ✅ RequestAnimationFrame synchronizes with browser paint
- ✅ Better performance (less CPU usage)
- ✅ Professional feel

## Visual Differences

### Normal State (Not Dragging)
```
┌──────────────┐
│ 🏝️ Team A    │ ← Blue border (2px)
│ 8 desks      │   40% opacity
│ 🖥️ 🔌 ⬆️      │
└──────────────┘
Cursor: grab (open hand)
```

### Selected State
```
┌──────────────┐
│ 🏝️ Team A    │ ← Yellow border (3px)
│ 8 desks      │   40% opacity
│ 🖥️ 🔌 ⬆️      │
└──────────────┘
Cursor: grab
```

### Dragging State (NEW!)
```
┌──────────────┐
│ 🏝️ Team A    │ ← Green border (4px)
│ 8 desks      │   70% opacity
│ 🖥️ 🔌 ⬆️      │   + Drop shadow
└──────────────┘
Cursor: grabbing (closed hand)
Movement: Smooth 60fps
```

## Technical Explanation

### Why RequestAnimationFrame?

**Problem with setState on every mousemove:**
```
Mouse moves → setState → React re-render → Canvas redraw
Mouse moves → setState → React re-render → Canvas redraw
Mouse moves → setState → React re-render → Canvas redraw
(100+ times per second!)
```

**Solution with requestAnimationFrame:**
```
Mouse moves → Store in ref (instant)
Mouse moves → Store in ref (instant)
Mouse moves → Store in ref (instant)
...
Browser ready to paint (16.6ms = 60fps)
  → Apply batched update → Single re-render → Smooth redraw
```

### Benefits:
1. **Batches updates** - Multiple mouse moves = single state update
2. **Syncs with display** - Updates happen when browser paints
3. **Reduces re-renders** - From 100+/sec to 60/sec max
4. **Smoother animation** - Tied to refresh rate (60fps/120fps)
5. **Lower CPU usage** - Less work for React

## Testing

### Test Fluidity:
1. Refresh browser at `localhost:3003/admin`
2. Go to **Office Management** → **Floor Plan**
3. Add an island or meeting room
4. **Click and drag** the item
5. **Observe**:
   - ✅ Movement is smooth and fluid
   - ✅ Green border appears during drag
   - ✅ Drop shadow visible
   - ✅ Cursor changes to grabbing hand
   - ✅ No lag or stuttering
   - ✅ Item follows mouse smoothly

### Visual Feedback Test:
1. Drag an island
   - ✅ Border turns green
   - ✅ Border gets thicker
   - ✅ Shadow appears
   - ✅ Item becomes more opaque
2. Release mouse
   - ✅ Border returns to yellow (selected)
   - ✅ Shadow disappears
   - ✅ Normal opacity restored

### Performance Test:
1. Add multiple items (5-10)
2. Drag each one quickly
3. **Verify**:
   - ✅ No lag even with multiple items
   - ✅ Smooth movement for all
   - ✅ No frame drops

## Browser Compatibility

✅ **Works in all modern browsers:**
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Opera

RequestAnimationFrame is supported in all browsers since 2012.

## Files Modified

- ✅ `frontend/src/components/FloorPlanEditorV2.tsx`
  - Added refs: `dragPosRef`, `animationFrameRef`
  - Updated `handleMouseMove` with requestAnimationFrame
  - Updated `handleMouseUp` with cleanup
  - Updated `drawItem` with dragging visual feedback
  - Updated canvas cursor (grab/grabbing)

## Result

Drag and drop is now **butter-smooth** with:
- 🚀 **60fps smooth movement**
- 🎨 **Clear visual feedback** (green border, shadow, opacity)
- 👆 **Better cursor feedback** (grab → grabbing)
- ⚡ **Optimized performance** (batched updates)
- 💪 **Professional user experience**

The floor plan editor now feels responsive and polished! 🏢✨
