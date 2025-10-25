# User Update Permissions - PATCH Endpoint

## Fixed Issue

**Problem:** When an org admin tried to change a user's role to `org_admin`, the API returned `500 Internal Server Error` with misleading error message.

**Cause:** HTTPException was being caught and re-wrapped by the generic exception handler.

**Solution:** Added explicit HTTPException handler to re-raise without wrapping, allowing proper HTTP status codes.

## Permission Rules for User Updates

### Who Can Update Users?
- **Super Admins**: Can update ANY user in ANY organization
- **Org Admins**: Can update users ONLY in their own organization

### What Can Each Role Change?

| Field | Super Admin | Org Admin | Notes |
|-------|-----------|----------|-------|
| `username` | ✅ Yes | ✅ Yes | Any value |
| `email` | ✅ Yes | ✅ Yes | Must be valid email |
| `full_name` | ✅ Yes | ✅ Yes | Any value |
| `password` | ✅ Yes | ✅ Yes | 8+ chars, max 72 bytes UTF-8 |
| `is_active` | ✅ Yes | ✅ Yes | Boolean |
| `role` | ✅ Yes (any role) | ❌ No (`org_admin` role forbidden) | Org admins can only set `user` or `community_lead` |
| `organization_id` | ✅ Yes | ❌ No | Only super admins can move users between organizations |
| `assigned_communities` | ✅ Yes | ✅ Yes | For `community_lead` and `user` roles |

## Error Responses

### 403 Forbidden - Not Authorized

**When you get it:**
- Org admin trying to update user from different organization
- Org admin trying to set user role to `org_admin`
- Org admin trying to change `organization_id`

**Response:**
```json
{
  "detail": "Only super admins can create org admins"
}
```

**Fix:** Only super admins can perform these operations.

### 404 Not Found - User Not Found

**When you get it:**
- User doesn't exist
- Org admin looking for user in different organization

**Response:**
```json
{
  "detail": "User not found"
}
```

### 400 Bad Request - Invalid Data

**When you get it:**
- Password exceeds 72 bytes
- Invalid email format
- Other validation errors

**Response:**
```json
{
  "detail": "Invalid data: [reason]"
}
```

## Example Requests

### ✅ Org Admin - Update User Password (Allowed)
```json
PATCH /api/organizations/3/users/9

{
  "password": "NewPassword123",
  "role": "user",
  "assigned_communities": [],
  "full_name": "Mircea Stanciu",
  "username": "raiff_orgadmin01",
  "email": "orgadmin@raiffeisen.ro",
  "is_active": true
}
```

**Response:** 200 OK ✅

### ❌ Org Admin - Promote to Org Admin (NOT Allowed)
```json
PATCH /api/organizations/3/users/9

{
  "role": "org_admin"  // ❌ Forbidden!
}
```

**Response:** 403 Forbidden
```json
{
  "detail": "Only super admins can create org admins"
}
```

### ✅ Super Admin - Promote to Org Admin (Allowed)
```json
PATCH /api/organizations/3/users/9

{
  "role": "org_admin"  // ✅ Allowed for super admin
}
```

**Response:** 200 OK ✅

### ❌ Org Admin - Move User to Different Org (NOT Allowed)
```json
PATCH /api/organizations/3/users/9

{
  "organization_id": 5  // ❌ Forbidden!
}
```

**Response:** 403 Forbidden
```json
{
  "detail": "Organization ID can only be changed by super admins"
}
```

## Implementation Details

### Error Handling Priority
1. **HTTPException** - Re-raised as-is (preserves status code)
2. **ValueError** - Converted to 400 Bad Request
3. **Other Exceptions** - Converted to 500 Internal Server Error

### Code Flow
```python
try:
    # Authorization check
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.organization_id != org_id:
            raise HTTPException(status_code=403, ...)  # ← Caught here
    
    # Role change check
    if new_role == UserRole.ORG_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, ...)  # ← Caught here
        
except HTTPException:
    raise  # ← Re-raise without wrapping
except ValueError as e:
    raise HTTPException(status_code=400, ...)
except Exception as e:
    raise HTTPException(status_code=500, ...)
```

## Testing the Fix

### Test 1: Org Admin Cannot Promote to Org Admin
```bash
curl -X PATCH http://localhost:8002/api/organizations/3/users/9 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ORG_ADMIN_TOKEN]" \
  -d '{"role": "org_admin"}'
```

**Expected Response:** 403 Forbidden (not 500!)
```json
{
  "detail": "Only super admins can create org admins"
}
```

### Test 2: Super Admin CAN Promote to Org Admin
```bash
curl -X PATCH http://localhost:8002/api/organizations/3/users/9 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [SUPER_ADMIN_TOKEN]" \
  -d '{"role": "org_admin"}'
```

**Expected Response:** 200 OK ✅

## Summary

✅ **Fixed:** HTTPException now returns correct status code (403 instead of 500)
✅ **Security:** Org admins cannot promote users to org_admin role
✅ **Security:** Org admins cannot move users between organizations
✅ **Feature:** Org admins CAN change passwords for their organization's users
✅ **Clear Errors:** Proper HTTP status codes and informative messages
