# Org Admin Password Update Fix

## Issue
Organization admins were getting 403 Forbidden when trying to update user passwords because the frontend was sending the `role` field in the PATCH request, and when set to the current role (e.g., `org_admin`), it triggered the "Only super admins can create org admins" error.

## Root Cause
The Edit User form was always including the `role` field in the PATCH payload, regardless of whether the user's role was being changed. When an org admin tried to update a password while the role field still contained the user's current role (`org_admin`), the backend treated it as an attempt to promote to org_admin, which is forbidden for org admins.

## Solution
Modified the frontend to conditionally include the `role` field based on user permissions:
- **Super Admins**: Can change role and organization_id (role included in payload)
- **Org Admins**: Cannot change role (role excluded from payload) - they can only update:
  - ✅ Password
  - ✅ Username
  - ✅ Email
  - ✅ Full Name
  - ✅ Active/Inactive Status
  - ✅ Assigned Communities (for community leads/users)

## Code Changes

### File: `/frontend/src/components/AdminDashboard.tsx`

**Before:**
```typescript
const updateData = {
  role: editUserForm.role,  // ← Always included, causes 403 for org admins
  assigned_communities: editUserForm.assigned_communities,
  full_name: editUserForm.full_name,
  username: editUserForm.username,
  email: editUserForm.email,
  is_active: editUserForm.is_active,
  ...(editUserForm.password && { password: editUserForm.password }),
  ...(editUserForm.role === 'org_admin' && editUserForm.organization_id && { organization_id: editUserForm.organization_id })
};
```

**After:**
```typescript
// Build update data based on user role
// Super admins can update all fields including role
// Org admins can only update certain fields, but NOT change to org_admin role
const updateData: any = {
  full_name: editUserForm.full_name,
  username: editUserForm.username,
  email: editUserForm.email,
  is_active: editUserForm.is_active,
  assigned_communities: editUserForm.assigned_communities,
  ...(editUserForm.password && { password: editUserForm.password })
};

// Only super admins can change role
if (currentUser?.role === 'super_admin') {
  updateData.role = editUserForm.role;
  // Only super admins can set organization_id
  if (editUserForm.role === 'org_admin' && editUserForm.organization_id) {
    updateData.organization_id = editUserForm.organization_id;
  }
}
```

## PATCH Payload Examples

### Org Admin Updating User Password (Now Works ✅)
```json
{
  "full_name": "Mircea Stanciu",
  "username": "raiff_orgadmin01",
  "email": "orgadmin@raiffeisen.ro",
  "is_active": true,
  "assigned_communities": [],
  "password": "PAROLA12@"
}
```

**Note:** `role` field is NOT included, so no 403 error!

### Super Admin Updating User Role
```json
{
  "full_name": "Mircea Stanciu",
  "username": "raiff_orgadmin01",
  "email": "orgadmin@raiffeisen.ro",
  "is_active": true,
  "assigned_communities": [],
  "password": "PAROLA12@",
  "role": "org_admin",
  "organization_id": 3
}
```

**Note:** `role` and `organization_id` included for super admin

## Testing

### Test 1: Org Admin Password Update (Should work now ✅)
1. Login as org admin: `raiff_orgadmin01` / password
2. Go to "Organization Users" tab
3. Click Edit on any user
4. Change the password field
5. Click "Update User"
6. ✅ Should show "User updated successfully!"

### Test 2: Super Admin Can Still Change Roles
1. Login as super admin: `admin` / password
2. Go to "Users Management" tab
3. Click Edit on any user
4. Change the role dropdown to different role
5. Click "Update User"
6. ✅ Role updated successfully

## Security Implications

✅ **Maintains Security:**
- Org admins still cannot promote users to `org_admin` role
- Org admins still cannot move users to different organizations
- Role change operations remain restricted to super admins only

✅ **Enables Functionality:**
- Org admins CAN now update user passwords
- Org admins CAN update other user details (name, email, username, status)
- Simple password resets work without triggering authorization errors

## Files Modified
- `/frontend/src/components/AdminDashboard.tsx` - Updated `handleUpdateUser()` function

## Status
✅ Frontend code updated and ready to test in browser
✅ Backend already supports org admin password updates
✅ No backend changes needed

## Next Steps
1. Refresh the browser (or restart frontend dev server if needed)
2. Login as org admin
3. Try updating a user's password
4. Should now succeed with proper response message
