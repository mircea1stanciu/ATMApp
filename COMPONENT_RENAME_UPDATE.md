# Component Rename: FloorPlanEditorV2 → FloorPlanEditor

## Overview
Renamed the floor plan editor component from `FloorPlanEditorV2` back to `FloorPlanEditor` for cleaner naming conventions.

## Changes Made

### 1. **Component Function Name**
**File:** `frontend/src/components/FloorPlanEditorV2.tsx` (line 129)

```typescript
// Before
export default function FloorPlanEditorV2() {

// After
export default function FloorPlanEditor() {
```

### 2. **Import Statement**
**File:** `frontend/src/components/OfficeManagement.tsx` (line 5)

```typescript
// Before
import FloorPlanEditorV2 from './FloorPlanEditorV2';

// After
import FloorPlanEditor from './FloorPlanEditorV2';
```

### 3. **Component Usage**
**File:** `frontend/src/components/OfficeManagement.tsx` (line 635)

```typescript
// Before
<FloorPlanEditorV2 />

// After
<FloorPlanEditor />
```

## Files Updated
- ✅ `frontend/src/components/FloorPlanEditorV2.tsx` - Function name
- ✅ `frontend/src/components/OfficeManagement.tsx` - Import and usage

## Notes
- The filename remains `FloorPlanEditorV2.tsx` (only the component name changed)
- This is a cosmetic change that improves code readability
- All functionality remains unchanged
- The component is still exported as default, so imports work the same way
