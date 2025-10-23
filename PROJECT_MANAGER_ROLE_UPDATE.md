# Project Management Permissions - Stricter Access Control

## ✅ Update Complete

Updated project management permissions to require **BOTH** role and community assignment.

---

## 🔒 New Permission Requirements

### To Create/Edit/Delete Projects:

Users must meet **ONE** of the following criteria:

1. **Super Admin or Org Admin**: Full access regardless of community
2. **Any user with "product" community**: Must have `"product"` in their `assigned_communities` (can be `user` or `community_lead` role)

### To View Projects:

- Any user belonging to an organization can view projects

### Important Note:

- Users with `"product"` community can be either regular `user` role or `community_lead` role
- The user creation context matters: Product Managers should be created from within the "Product Managers" community page

---

## 📊 Permission Matrix

| User Type | Role | Communities | View | Create | Edit | Delete |
|-----------|------|-------------|------|--------|------|--------|
| **Super Admin** | `super_admin` | Any | ✅ | ✅ | ✅ | ✅ |
| **Org Admin** | `org_admin` | Any | ✅ | ✅ | ✅ | ✅ |
| **Product Manager (Lead)** | `community_lead` | `["product"]` | ✅ | ✅ | ✅ | ✅ |
| **Product Manager (User)** | `user` | `["product"]` | ✅ | ✅ | ✅ | ✅ |
| **QA Lead** | `community_lead` | `["qa"]` | ✅ | ❌ | ❌ | ❌ |
| **Backend Lead** | `community_lead` | `["backend"]` | ✅ | ❌ | ❌ | ❌ |
| **Regular User** | `user` | `["qa"]` or other | ✅ | ❌ | ❌ | ❌ |

**Key Point**: Any user (regardless of role) with `"product"` in their communities can manage projects.

---

## 🔧 Implementation Details

### Backend (`backend/api/project_routes.py`)

```python
def check_product_manager_access(current_user):
    """Check if user has Product Manager access
    
    Requirements:
    - Must have "product" in assigned_communities (any role), OR
    - Super Admin or Org Admin
    """
    # Super admins and org admins have full access
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN]:
        return True
    
    # Check if user has "product" in assigned communities (works for any role)
    if current_user.assigned_communities:
        try:
            communities = json.loads(current_user.assigned_communities)
            if "product" in communities:
                return True
        except:
            pass
    
    raise HTTPException(
        status_code=403, 
        detail="Access denied. Only users assigned to Product Management community can create, edit, or delete projects."
    )
```

### Frontend (`frontend/src/components/projects/ProjectList.tsx`)

```typescript
const checkPermissions = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      
      // Super admins and org admins can manage
      if (user.role === 'super_admin' || user.role === 'org_admin') {
        setCanManageProjects(true);
        return;
      }
      
      // Check if user has "product" in assigned communities (works for any role)
      if (user.assigned_communities) {
        const communities = Array.isArray(user.assigned_communities) 
          ? user.assigned_communities 
          : JSON.parse(user.assigned_communities || '[]');
        setCanManageProjects(communities.includes('product'));
      }
    }
  } catch (error) {
    console.error('Failed to check permissions:', error);
  }
};
```

---

## 📝 Creating a Product Manager

To create a user who can manage projects:

### Via Admin Dashboard

1. Navigate to **Admin Dashboard** → **Users** (or **Product Managers Community Page**)
2. Click **"Create User"**
3. Fill in user details
4. **Important**: Set the following:
   - **Role**: Select `User` or `Community Lead` (both work)
   - **Assigned Communities**: Check `📊 Product Managers`
5. Click **"Create User"**

**Note**: Users are typically created from within the "Product Managers" community page for better organization.

### Via API

```bash
curl -X POST http://localhost:8000/api/organizations/1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "product_manager",
    "email": "pm@example.com",
    "password": "secure123",
    "full_name": "Product Manager",
    "role": "user",
    "assigned_communities": ["product"]
  }'
```

**Note**: Role can be either `"user"` or `"community_lead"` - both work as long as they have `"product"` community.

---

## 🧪 Testing Scenarios

### ✅ Scenario 1: Product Manager - Regular User (Should Have Access)

**User Data:**
```json
{
  "role": "user",
  "assigned_communities": "[\"product\"]"
}
```

**Expected Behavior:**
- Can view all projects ✅
- Can create new projects ✅
- Can edit projects ✅
- Can delete projects ✅
- Create/Delete buttons visible in UI ✅

### ✅ Scenario 1b: Product Manager - Community Lead (Should Have Access)

**User Data:**
```json
{
  "role": "community_lead",
  "assigned_communities": "[\"product\", \"backend\"]"
}
```

**Expected Behavior:**
- Can view all projects ✅
- Can create new projects ✅
- Can edit projects ✅
- Can delete projects ✅
- Create/Delete buttons visible in UI ✅

### ❌ Scenario 2: QA Lead (Should NOT Have Access)

**User Data:**
```json
{
  "role": "community_lead",
  "assigned_communities": "[\"qa\"]"
}
```

**Expected Behavior:**
- Can view all projects ✅
- Cannot create projects ❌
- Cannot edit projects ❌
- Cannot delete projects ❌
- Create/Delete buttons NOT visible ❌
- API returns: `403 Forbidden` with message: "Access denied. Only users assigned to Product Management..."

### ❌ Scenario 3: Regular User without Product Community (Should NOT Have Access)

**User Data:**
```json
{
  "role": "user",
  "assigned_communities": "[\"qa\", \"backend\"]"
}
```

**Expected Behavior:**
- Can view all projects ✅
- Cannot create projects ❌ (No "product" community)
- Cannot edit projects ❌
- Cannot delete projects ❌
- Create/Delete buttons NOT visible ❌
- API returns: `403 Forbidden`

### ✅ Scenario 4: Super Admin (Should Have Access)

**User Data:**
```json
{
  "role": "super_admin",
  "assigned_communities": null
}
```

**Expected Behavior:**
- Full access regardless of community assignments ✅

---

## 🔍 Troubleshooting

### "I have 'product' in communities but can't create projects"

**Check your configuration:**
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('Role:', user.role);
console.log('Communities:', user.assigned_communities);
```

**Required:**
- `assigned_communities` must include `"product"`
- Role can be any (`user`, `community_lead`, etc.)

**Common issues:**
- Communities not saved properly in localStorage
- Need to logout and login again after role/community change

### "Access denied" error message

The new error message is:
> "Access denied. Only users assigned to Product Management community can create, edit, or delete projects."

This means you don't have `"product"` in your assigned communities.

### Updating an Existing User

If you have a user who should be a Product Manager:

1. Go to **Admin Dashboard** → **Users** (or **Product Managers Community Page**)
2. Find the user and click **"Edit"**
3. Check **📊 Product Managers** in assigned communities (role doesn't need to change)
4. Click **"Update User"**
5. User should logout and login again to refresh permissions

---

## 📋 Summary of Changes

### Files Modified:

1. **`backend/api/project_routes.py`**
   - Updated `check_product_manager_access()` to only check for `"product"` community (no role restriction)
   - Updated error message to be more specific

2. **`frontend/src/components/projects/ProjectList.tsx`**
   - Updated `checkPermissions()` to check for `"product"` community regardless of role
   - Ensures UI buttons show for any user with "product" community

3. **`PROJECT_PERMISSIONS_COMPLETE.md`**
   - Updated documentation to reflect dual requirements
   - Updated permission matrix
   - Updated test scenarios
   - Updated troubleshooting guide

---

## ✨ Benefits of This Approach

1. **Flexible**: Users with any role can be Product Managers as long as they have the "product" community
2. **Community-Based**: Leverages community assignments for access control
3. **Scalable**: Easy to add other specialized communities (e.g., QA community for test management)
4. **Secure**: Backend enforces community check, frontend provides better UX
5. **Simple**: Only one requirement - have "product" in assigned communities

---

**Status**: ✅ COMPLETE  
**Date**: October 23, 2025  
**Version**: 3.0 (Community-Based Permissions - Role Agnostic)
