# Project Permissions Impledef check_product_manager_access(current_user):
    """For WRITE operations - Product Managers only
    
    Requirements:
    - Must have "product" in assigned_communities (any role), OR
    - Super Admin or Org Admin
    """
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN]:
        return True
    if current_user.assigned_communities:
        try:
            communities = json.loads(current_user.assigned_communities)
            if "product" in communities:
                return True
        except:
            pass
    raise HTTPException(status_code=403, 
        detail="Access denied. Only users assigned to Product Management community can create, edit, or delete projects.")te

## Overview
Successfully implemented community-based access control for project management:
- **READ**: All organization members can view projects
- **WRITE**: Only users assigned to the **"Product Managers" community** can create/update/delete projects

## Requirements for Project Management

To create, edit, or delete projects, a user must have:
- **Community Assignment**: `"product"` in their `assigned_communities` (role doesn't matter)
- OR be a Super Admin / Org Admin (bypass all restrictions)

This is purely **community-based** - any user (regular `user` or `community_lead`) with the "product" community can manage projects.

## Backend Implementation ✅

### Access Control Functions (`backend/api/project_routes.py`)

```python
def check_organization_member(current_user):
    """For READ operations - all organization members"""
    if not current_user.organization_id:
        raise HTTPException(status_code=403, 
            detail="Access denied. User must belong to an organization.")
    return True

def check_product_manager_access(current_user):
    """For WRITE operations - Product Managers only
    
    Requirements:
    - Must be a Community Lead with "product" community assignment, OR
    - Super Admin or Org Admin
    """
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN]:
        return True
    if current_user.role == UserRole.COMMUNITY_LEAD and current_user.assigned_communities:
        try:
            communities = json.loads(current_user.assigned_communities)
            if "product" in communities:
                return True
        except:
            pass
    raise HTTPException(status_code=403, 
        detail="Access denied. Only Community Leads assigned to Product Management can create, edit, or delete projects.")
```

### Endpoint Protection

**READ Operations** (All organization members):
- `GET /api/projects/community/{community_id}` - List all projects
- `GET /api/projects/{project_id}` - Get project details
- `GET /api/projects/{project_id}/issues` - List issues
- `GET /api/projects/{project_id}/issues/{issue_id}` - Get issue details

**WRITE Operations** (Product Managers only):
- `POST /api/projects/` - Create project
- `PATCH /api/projects/{project_id}` - Update project
- `DELETE /api/projects/{project_id}` - Delete project (NEW)
- `POST /api/projects/{project_id}/issues` - Create issue
- `PATCH /api/projects/{project_id}/issues/{issue_id}` - Update issue
- `POST /api/projects/{project_id}/issues/{issue_id}/move` - Move issue
- `POST /api/projects/{project_id}/issues/{issue_id}/comments` - Add comment

## Frontend Implementation ✅

### Permission Checking (`frontend/src/components/projects/ProjectList.tsx`)

```typescript
const [canManageProjects, setCanManageProjects] = useState(false);

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
      
      // Check if user has "product" in assigned communities (any role)
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

### UI Features

1. **Create Project Button** - Only visible to Product Managers:
```tsx
{canManageProjects && (
  <button onClick={onCreateProject}>
    Create Project
  </button>
)}
```

2. **Delete Project Button** - Only visible to Product Managers:
```tsx
{canManageProjects && (
  <button onClick={(e) => handleDeleteProject(project.id, e)}>
    Delete
  </button>
)}
```

3. **Delete Confirmation** - Double-check before deletion:
```tsx
if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
  return;
}
```

## Permission Matrix

| User Role | View Projects | Create Projects | Edit Projects | Delete Projects |
|-----------|--------------|-----------------|---------------|-----------------|
| **Super Admin** | ✅ | ✅ | ✅ | ✅ |
| **Org Admin** | ✅ | ✅ | ✅ | ✅ |
| **User (Product)** | ✅ | ✅ | ✅ | ✅ |
| **Community Lead (Product)** | ✅ | ✅ | ✅ | ✅ |
| **Community Lead (QA)** | ✅ | ❌ | ❌ | ❌ |
| **Community Lead (Backend)** | ✅ | ❌ | ❌ | ❌ |
| **User (Other)** | ✅ | ❌ | ❌ | ❌ |

**Key**: The only requirement for write access is having `"product"` in `assigned_communities` - role doesn't matter.

## User Data Structure

User data is stored in `localStorage` with key `'user'`:

```json
{
  "id": 1,
  "username": "john.doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "role": "community_lead",
  "organization_id": 5,
  "assigned_communities": "[\"product\", \"backend\"]"
}
```

**Note**: 
- `assigned_communities` is a JSON string array
- To manage projects, user must have `role: "community_lead"` AND `"product"` in communities

## Testing Guide

### Test Cases

1. **Product Manager Access**:
   - Login with user having `role: "community_lead"` AND `"product"` in `assigned_communities`
   - Verify "Create Project" button is visible
   - Verify delete buttons appear on project cards
   - Create a new project successfully
   - Delete a project successfully

2. **Non-Product Manager Access**:
   - Login with Community Lead having only `["qa"]` or other communities (but NOT "product")
   - Verify projects are visible
   - Verify "Create Project" button is NOT visible
   - Verify delete buttons are NOT visible
   - Direct API call to create/delete returns 403

3. **Regular User Access**:
   - Login with `role: "user"` (even with `"product"` in communities)
   - Verify projects are visible
   - Verify NO create/delete buttons
   - API calls return 403

3. **Admin Override**:
   - Login as `super_admin` or `org_admin`
   - Verify full access regardless of assigned communities

4. **Error Handling**:
   - Try to delete project without permission → 403 error with clear message
   - Try to create project without permission → 403 error with clear message

### Test Commands

```bash
# Test as Product Manager
curl -X POST http://localhost:8000/api/projects/ \
  -H "Authorization: Bearer <product_manager_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","key":"TEST","community_id":1}'
# Expected: 200 OK

# Test as QA Lead
curl -X POST http://localhost:8000/api/projects/ \
  -H "Authorization: Bearer <qa_lead_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","key":"TEST","community_id":1}'
# Expected: 403 Forbidden

# Test viewing as any user
curl -X GET http://localhost:8000/api/projects/community/1 \
  -H "Authorization: Bearer <any_user_token>"
# Expected: 200 OK with project list
```

## Security Notes

1. **Backend Enforcement**: All security checks happen on the backend. Frontend only improves UX.
2. **Cannot Bypass**: Even if user modifies localStorage, backend will reject unauthorized requests.
3. **Role Hierarchy**: Super Admins and Org Admins bypass community checks.
4. **Community-Based**: Product Manager role determined by `"product"` in `assigned_communities`.

## Troubleshooting

### "Access denied" when trying to create project
- Check user's role is `community_lead` (not just `user`)
- Check user's `assigned_communities` includes `"product"`
- Verify user belongs to an organization (`organization_id` is set)
- Check if user is super_admin or org_admin (these bypass the requirement)

### Delete button not showing
- Check browser console for permission check errors
- Verify localStorage has valid user data
- Confirm `assigned_communities` is properly formatted JSON

### Projects not visible
- Verify user has `organization_id` set
- Check backend logs for database connection
- Ensure project's `community_id` matches user's organization

## Files Modified

### Backend
- `backend/api/project_routes.py` - Added access control functions and updated all endpoints

### Frontend
- `frontend/src/components/projects/ProjectList.tsx` - Added permission checking and conditional rendering

## Related Features

- User Management: See `USER_MANAGEMENT_FILTER_SORT.md`
- Community Assignment: See `USER_COMMUNITY_ASSIGNMENT_FEATURE.md`
- Organization Admin: See `ORG_ADMIN_ROLE_COMPLETE.md`

## Next Steps

1. ✅ Backend access control implemented
2. ✅ Frontend permission checks implemented
3. ✅ UI conditional rendering implemented
4. ⏭️ Add similar permissions to issue management
5. ⏭️ Add audit logging for project creation/deletion
6. ⏭️ Add bulk operations for Product Managers

---

**Status**: ✅ COMPLETE  
**Date**: 2024  
**Version**: 1.0
