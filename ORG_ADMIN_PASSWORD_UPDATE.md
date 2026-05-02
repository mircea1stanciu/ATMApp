# Organization Admin Password Update Feature

## Overview
Organization admins can now change passwords for users in their organization through the admin dashboard.

## Feature Status
✅ **FULLY IMPLEMENTED** - No additional changes required

## How It Works

### Backend (`/api/organizations/{org_id}/users/{user_id}`)
- **Endpoint:** `PATCH /api/organizations/{org_id}/users/{user_id}`
- **Authentication:** Requires `get_org_admin_user` (org admin or super admin)
- **Permission Verification:**
  - Super Admins: Can update ANY user in ANY organization
  - Org Admins: Can only update users in their own organization
- **Password Field:**
  - Optional field in request body
  - Only updated if provided
  - Validated for UTF-8 length (max 72 bytes for bcrypt)
  - Securely hashed with bcrypt before storage

### Frontend (Admin Dashboard)
- **Access:** Organization admins see "Organization Users" tab in the dashboard
- **Edit User Modal:**
  - Shows all user details including username, email, full name
  - Contains password field (optional - "Leave empty to keep current")
  - Contains confirm password field
  - Validates password match before submission
  - Only sends password if it's been changed (not empty)

### Request Format
```json
{
  "role": "user",
  "assigned_communities": [],
  "full_name": "User Name",
  "username": "username",
  "email": "user@example.com",
  "is_active": true,
  "password": "NewPassword123"  // Optional - only if changing password
}
```

### Response Format
```json
{
  "message": "User updated successfully",
  "user": {
    "id": 9,
    "username": "updated_user",
    "email": "user@org.com",
    "full_name": "Updated Name",
    "role": "user",
    "assigned_communities": [],
    "organization_id": 3,
    "is_active": true
  }
}
```

## Security Features
1. **Password Validation:**
   - Minimum 8 characters (frontend validation)
   - Maximum 72 bytes UTF-8 encoded (bcrypt limit)
   - Required confirmation to prevent typos

2. **Authorization:**
   - Org admins can only modify users in their organization
   - Super admins can modify any user
   - Org admins cannot change role to org_admin (super admin only)

3. **Password Hashing:**
   - Uses bcrypt with passlib
   - Passwords never stored in plain text
   - Each password individually salted

4. **Error Handling:**
   - Clear error messages if password too long
   - Password mismatch validation
   - Organization authorization checks
   - User not found handling

## Testing Steps

### For Org Admin:
1. Login as an org admin (e.g., `raiff_orgadmin01`)
2. Navigate to "Organization Users" tab
3. Click edit button on any user in your organization
4. Scroll to "Password" field
5. Enter new password (8+ characters)
6. Enter confirm password (must match)
7. Click "Update User" button
8. Success message confirms password changed

### For Super Admin:
1. Login as super admin (e.g., `admin`)
2. Navigate to "Users Management" tab
3. Users from all organizations are visible
4. Click edit on any user
5. Change password and confirm
6. Click "Update User" button
7. Password updated for any organization's user

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Not authorized to update users in this organization` | Org admin trying to update user from different org | Use correct organization context |
| `Password cannot exceed 72 bytes when encoded as UTF-8` | Password too long | Use shorter password (< 72 bytes) |
| `Passwords do not match. Please confirm your password.` | Password fields don't match | Retype password correctly |
| `Failed to update user: Could not validate credentials` | Invalid or expired JWT token | Re-login to get new token |

## Database Impact
- User's `hashed_password` field updated with new bcrypt hash
- All other user fields remain unchanged
- No audit logging (can be added in future)

## Files Involved
- **Backend:** `/backend/main.py` - PATCH endpoint with error handling
- **Frontend:** `/frontend/src/components/AdminDashboard.tsx` - Edit user form
- **Auth:** `/backend/core/auth.py` - Password hashing with bcrypt

## Dependencies
- `passlib` - Password hashing framework
- `bcrypt==4.0.1` - Bcrypt implementation (version critical for compatibility)
- `cryptography` - Required by passlib

## Notes
- Password change is optional when editing user
- If password field left empty, current password is preserved
- Both org admins and super admins have same password update capability
- Org admins cannot see/change password for users in other organizations
