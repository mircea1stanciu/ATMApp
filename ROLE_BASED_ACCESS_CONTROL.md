# 🔐 Role-Based Access Control (RBAC) Implementation

## Overview

UnifiedWork now implements strict role-based access control where users can only access communities based on their assigned roles within their organization. This ensures proper isolation and security.

## Access Control Rules

### 1. **Organization Isolation**
- Users can only access resources within their own organization
- Cross-organization access is prevented
- Organization admins manage their own organization's users

### 2. **Community Access Control**

#### **Super Admin** (`super_admin`)
- ✅ Full access to all communities across all organizations
- ✅ Can create/manage organizations  
- ✅ Can access admin panel
- ✅ No community restrictions

#### **Organization Admin** (`org_admin`)
- ✅ Access to all communities within their organization
- ✅ Can manage users in their organization
- ✅ Can access admin panel
- ✅ No community restrictions within their org

#### **Community Lead** (`community_lead`)
- ✅ Access to communities assigned in `assigned_communities` field
- ✅ Can manage projects if assigned to "product" community
- ❌ Cannot access non-assigned communities
- ❌ Limited to their organization

#### **Regular User** (`user`)
- ✅ Access only to communities assigned in `assigned_communities` field
- ❌ Cannot access non-assigned communities
- ❌ Cannot manage users or organizations
- ❌ Limited to their organization

## Protected Endpoints

### Community Chat API
```http
POST /api/communities/{community_id}/chat
```
**Access Control:**
- Requires authentication
- Checks `assigned_communities` field for regular users and community leads
- Super admins and org admins have full access

### Community Examples API
```http
GET /api/communities/{community_id}/examples
```
**Access Control:**
- Requires authentication
- Same community assignment rules as chat API

### Project Management API
```http
POST|PUT|DELETE /api/projects/*
```
**Access Control:**
- Requires "product" in `assigned_communities` for create/update/delete
- Users can only access projects within their organization

## Database Schema

### User Table Fields
```sql
users.role                    -- super_admin, org_admin, community_lead, user
users.assigned_communities   -- JSON array: ["qa", "backend", "frontend", ...]
users.organization_id        -- Links user to their organization
```

### Community IDs
- `qa` - QA Engineers (QualityGPT)
- `backend` - Backend Developers (BackendGPT)
- `frontend` - Frontend Developers (FrontendGPT)
- `design` - UI/UX Designers (DesignGPT)
- `product` - Product Managers (ProductGPT)
- `devops` - DevOps Engineers (OpsGPT)
- `analyst` - Data Analysts (AnalystGPT)

## Example Access Scenarios

### Scenario 1: QA Engineer
```json
{
  "role": "user",
  "assigned_communities": ["qa", "backend"],
  "organization_id": 3
}
```
**Access:**
- ✅ Can chat with QualityGPT in `/community/qa`
- ✅ Can chat with BackendGPT in `/community/backend`
- ❌ Cannot access `/community/product` (403 Forbidden)
- ❌ Cannot access other organization's communities

### Scenario 2: Product Manager
```json
{
  "role": "community_lead",
  "assigned_communities": ["product", "design"],
  "organization_id": 3
}
```
**Access:**
- ✅ Can chat with ProductGPT in `/community/product`
- ✅ Can manage projects (create/edit/delete)
- ✅ Can chat with DesignGPT in `/community/design`
- ❌ Cannot access QA or Backend communities

### Scenario 3: Organization Admin
```json
{
  "role": "org_admin",
  "assigned_communities": null,
  "organization_id": 3
}
```
**Access:**
- ✅ Can access ALL communities within organization 3
- ✅ Can manage users in organization 3
- ✅ Can access admin panel
- ❌ Cannot access other organizations

## Error Messages

### 403 Forbidden - Community Access Denied
```json
{
  "detail": "Access denied. You are not assigned to the product community. Contact your organization administrator for access."
}
```

### 403 Forbidden - Project Management
```json
{
  "detail": "Access denied. Only users assigned to Product Management community can create, edit, or delete projects."
}
```

## Frontend Implementation

The frontend already implements proper access control:

### Community Page Access Check
```typescript
// Check if user has access to this community
if (userData.role === 'super_admin' || userData.role === 'org_admin') {
  setHasAccess(true);
  return;
}

// Regular users need assigned access
const assignedCommunities = userData.assigned_communities || [];
const hasAccessToCommunity = assignedCommunities.includes(communityId);
setHasAccess(hasAccessToCommunity);
```

### Dashboard Community Display
- Only shows communities the user has access to
- Filters based on `assigned_communities` field

## Security Benefits

1. **Principle of Least Privilege**: Users only get access to what they need
2. **Organization Isolation**: Prevents cross-organization data access
3. **Role-Based Restrictions**: Different access levels based on job function
4. **Community Specialization**: Users focus on their relevant AI agents
5. **Audit Trail**: All access attempts are logged with user context

## Migration Impact

- ✅ Existing super admins and org admins: No change (full access)
- ✅ Existing users: Access controlled by `assigned_communities` field
- ✅ Backward compatible: Existing API calls work with new access control
- ✅ Frontend: Already implements proper access control

## Admin Management

Organization admins can assign communities to users through:
1. **Admin Panel** → Users section
2. **API Endpoint**: `POST /api/organizations/{org_id}/users`
3. **Update User**: Modify `assigned_communities` field

---

**Status**: ✅ **IMPLEMENTED AND ACTIVE**
**Impact**: All community access is now properly restricted based on user roles and assignments.
