# Community Lead Role Feature

## Overview
Added a new **Community Lead** role to the UnifiedWork platform. This role sits between Organization Admin and regular User, allowing designated users to manage and moderate specific communities.

## Role Hierarchy
```
Super Admin (Platform-wide)
    ↓
Organization Admin (Organization-wide)
    ↓
Community Lead (Specific communities)
    ↓
User (Standard access)
```

## Features

### 1. Role Definition
- **Role Name**: `COMMUNITY_LEAD`
- **Role Value**: `community_lead`
- **Permission Level**: Can access admin features for assigned communities only

### 2. Community Assignment
- Community Leads can be assigned to one or more communities:
  - `qa` - QA Engineers community
  - `backend` - Backend Developers community
  - `frontend` - Frontend Developers community
  - `design` - UI/UX Designers community
  - `product` - Product Managers community
  - `devops` - DevOps Engineers community
  - `docs` - Technical Writers community

### 3. User Creation & Management

#### Who Can Create Community Leads
- **Super Admins**: Can create Community Leads in any organization
- **Organization Admins**: Can create Community Leads within their organization

#### Creating a Community Lead
```bash
POST /api/organizations/{org_id}/users
```

**Request Body**:
```json
{
  "username": "qa_lead",
  "email": "qa.lead@company.com",
  "password": "secure_password",
  "full_name": "QA Community Lead",
  "role": "community_lead",
  "assigned_communities": ["qa", "backend"]
}
```

**Response**:
```json
{
  "message": "User created successfully",
  "user": {
    "id": 123,
    "username": "qa_lead",
    "email": "qa.lead@company.com",
    "full_name": "QA Community Lead",
    "role": "community_lead",
    "assigned_communities": "[\"qa\", \"backend\"]",
    "organization_id": 1,
    "is_active": true
  }
}
```

### 4. Updating Users

#### Update User Role and Communities
```bash
PATCH /api/organizations/{org_id}/users/{user_id}
```

**Request Body** (Update to Community Lead):
```json
{
  "role": "community_lead",
  "assigned_communities": ["qa", "frontend", "backend"]
}
```

**Request Body** (Change assigned communities):
```json
{
  "assigned_communities": ["design", "product"]
}
```

### 5. Listing Users
The user list endpoint now includes `assigned_communities` field:

```bash
GET /api/organizations/{org_id}/users
```

**Response**:
```json
[
  {
    "id": 123,
    "username": "qa_lead",
    "email": "qa.lead@company.com",
    "full_name": "QA Community Lead",
    "role": "community_lead",
    "assigned_communities": "[\"qa\", \"backend\"]",
    "is_active": true,
    "created_at": "2025-01-15T10:30:00",
    "last_login": "2025-01-20T14:22:00"
  }
]
```

## Backend Changes

### Database Schema
**File**: `backend/core/database.py`

1. **Added to UserRole enum**:
   ```python
   class UserRole(enum.Enum):
       SUPER_ADMIN = "super_admin"
       ORG_ADMIN = "org_admin"
       COMMUNITY_LEAD = "community_lead"  # NEW
       USER = "user"
   ```

2. **Added to User model**:
   ```python
   assigned_communities = Column(String, nullable=True)  # JSON string: ["qa", "backend"]
   ```

### Authentication
**File**: `backend/core/auth.py`

Added new authentication helper:
```python
def get_community_lead_user(current_user = Depends(get_current_user)):
    """Require COMMUNITY_LEAD, ORG_ADMIN, or SUPER_ADMIN role"""
    if current_user.role not in [UserRole.COMMUNITY_LEAD, UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Community lead access required"
        )
    return current_user
```

### API Endpoints
**File**: `backend/main.py`

#### Updated Endpoints:
1. **POST `/api/organizations/{org_id}/users`**
   - Now accepts `role: "community_lead"`
   - Now accepts `assigned_communities: ["qa", "backend"]`
   - Org Admins and Super Admins can create Community Leads

2. **PATCH `/api/organizations/{org_id}/users/{user_id}`** ✨ NEW
   - Update user role
   - Update assigned communities
   - Update full_name and is_active status

3. **GET `/api/organizations/{org_id}/users`**
   - Now returns `assigned_communities` field

## Permission Rules

### Creating Users
| Current Role    | Can Create          | Notes                                    |
|-----------------|---------------------|------------------------------------------|
| Super Admin     | All roles           | Full permissions                         |
| Org Admin       | Community Lead, User| Cannot create other Org Admins           |
| Community Lead  | No                  | Cannot create users                      |
| User            | No                  | Cannot create users                      |

### Updating Users
| Current Role    | Can Update          | Notes                                    |
|-----------------|---------------------|------------------------------------------|
| Super Admin     | All roles           | Full permissions                         |
| Org Admin       | Community Lead, User| Cannot promote users to Org Admin        |
| Community Lead  | No                  | Cannot update users                      |
| User            | No                  | Cannot update users                      |

## Frontend Integration

### User Management Page
The frontend admin dashboard should be updated to:

1. **Show Community Lead role** in user lists
2. **Display assigned communities** for Community Leads
3. **Provide Community selector** when creating/editing Community Leads
4. **Filter/search** by role and assigned communities

### Suggested UI Components

#### Create Community Lead Form
```tsx
<form>
  <input type="text" placeholder="Username" />
  <input type="email" placeholder="Email" />
  <input type="password" placeholder="Password" />
  <input type="text" placeholder="Full Name" />
  
  <select name="role">
    <option value="user">User</option>
    <option value="community_lead">Community Lead</option>
    {isSuperAdmin && <option value="org_admin">Org Admin</option>}
  </select>
  
  {role === 'community_lead' && (
    <div>
      <label>Assigned Communities:</label>
      <Checkbox value="qa" label="QA Engineers" />
      <Checkbox value="backend" label="Backend Developers" />
      <Checkbox value="frontend" label="Frontend Developers" />
      <Checkbox value="design" label="UI/UX Designers" />
      <Checkbox value="product" label="Product Managers" />
      <Checkbox value="devops" label="DevOps Engineers" />
      <Checkbox value="docs" label="Technical Writers" />
    </div>
  )}
  
  <button type="submit">Create User</button>
</form>
```

#### User List Display
```tsx
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Role</th>
      <th>Communities</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {users.map(user => (
      <tr key={user.id}>
        <td>{user.full_name}</td>
        <td>{user.email}</td>
        <td>
          <Badge color={getRoleColor(user.role)}>
            {user.role}
          </Badge>
        </td>
        <td>
          {user.role === 'community_lead' && (
            <div>
              {JSON.parse(user.assigned_communities || '[]').map(comm => (
                <Badge key={comm}>{comm}</Badge>
              ))}
            </div>
          )}
        </td>
        <td>
          <button onClick={() => editUser(user)}>Edit</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

## Testing

### Test Scenarios

1. **Create Community Lead**
   - As Org Admin, create a Community Lead with QA and Backend communities
   - Verify user is created with correct role
   - Verify assigned_communities are saved correctly

2. **Update Community Lead**
   - Change assigned communities from [qa, backend] to [frontend, design]
   - Verify communities are updated
   - Verify old communities are replaced

3. **Promote User to Community Lead**
   - Create regular User
   - Update user role to Community Lead
   - Assign communities
   - Verify promotion works correctly

4. **Demote Community Lead to User**
   - Update Community Lead role to User
   - Verify assigned_communities are cleared
   - Verify user has User permissions

5. **Permission Checks**
   - Verify Org Admin cannot create Org Admin
   - Verify Community Lead cannot create users
   - Verify Super Admin can perform all operations

## Migration Notes

### Database Migration
If you have an existing database, you'll need to add the new column:

```sql
ALTER TABLE users ADD COLUMN assigned_communities VARCHAR;
```

### Existing Users
- All existing users will have `assigned_communities = NULL`
- Only Community Leads should have this field populated

## Future Enhancements

1. **Community-specific permissions**: Allow Community Leads to moderate content, pin messages, etc.
2. **Analytics**: Track Community Lead activity and community health
3. **Auto-assignment**: Suggest communities based on user expertise
4. **Multi-level leads**: Allow senior and junior Community Leads
5. **Community dashboard**: Dedicated dashboard for Community Leads to manage their communities

## API Documentation

All endpoints are documented in the Swagger UI at `/docs` when the backend server is running.

## Support

For issues or questions about the Community Lead role:
1. Check the Swagger documentation at `/docs`
2. Review the code in `backend/core/database.py` and `backend/core/auth.py`
3. Test with the provided curl/Postman examples

---

**Version**: 1.0  
**Date**: January 2025  
**Status**: ✅ Implemented and Tested
