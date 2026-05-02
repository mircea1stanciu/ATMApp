# Hide Communities Column Feature

## Overview
Implemented a feature to hide the Communities column in the Users Management dashboard when no users have assigned communities.

## Problem Statement
The Communities column was always visible in the Users Management table, even when no regular users or community leads had any assigned communities. This created visual clutter and was not useful for users who didn't have communities assigned.

## Solution
Added conditional logic to:
1. Check if any user in the system has assigned communities
2. Only show the Communities column header when at least one user has communities
3. Only show the Communities cell for each row when at least one user has communities

## Implementation Details

### New Helper Function: `hasAnyCommunitiesAssigned()`
Located in `/frontend/src/components/AdminDashboard.tsx`

```typescript
const hasAnyCommunitiesAssigned = () => {
  return users.some(user => {
    if (user.role === 'community_lead' || user.role === 'user') {
      return user.assigned_communities && 
             Array.isArray(user.assigned_communities) && 
             user.assigned_communities.length > 0;
    }
    return false;
  });
};
```

**Logic:**
- Iterates through all users
- Only checks users with roles: `community_lead` or `user`
- Returns `true` if any user has a non-empty `assigned_communities` array
- Returns `false` if no users have communities

### Modified Table Header
```tsx
{hasAnyCommunitiesAssigned() && (
  <th className="text-left py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Communities</th>
)}
```

The Communities column header now conditionally renders based on whether any user has communities.

### Modified Table Body
```tsx
{hasAnyCommunitiesAssigned() && (
  <td className="py-3">
    {/* Communities display logic */}
  </td>
)}
```

Each Communities cell conditionally renders based on the global state.

## User Experience

### When NO users have communities assigned:
- Communities column is hidden
- Table only shows: Username | Email | Organization | Role | Status | Last Login | Actions
- Cleaner, less cluttered interface

### When ANY user has communities assigned:
- Communities column is visible
- Shows badges for users with assigned communities
- Shows "-" for users without communities (regular users/leads that weren't assigned any)

## Files Modified
- `/frontend/src/components/AdminDashboard.tsx` (36 insertions, 20 deletions)

## Commit Information
- **Commit Hash**: 49af973
- **Commit Message**: "Hide Communities column when no users have assigned communities"

## Testing
To verify this feature:
1. Create users without assigning any communities → Communities column should be hidden
2. Create a user with assigned communities → Communities column should appear
3. Try filtering by organization → Column visibility should update based on visible users
4. Toggle dark/light mode → Column visibility should persist

## Backward Compatibility
✅ No breaking changes. The feature gracefully degrades:
- If data doesn't have `assigned_communities` field, column is hidden
- If `assigned_communities` is null/undefined, it's treated as no communities
- Existing functionality remains unchanged

## Related Features
- Community assignment for regular users (implemented in commit ce75e96)
- Community assignment for community leads (existing functionality)
- Organization slug display (implemented in commit 8c92e86)
