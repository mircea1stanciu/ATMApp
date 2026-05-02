# Project Access Control - Product Managers Only

## ✅ Implementation Complete

Access control has been implemented to restrict project management features to **Product Managers only**.

---

## 🔐 Access Control Rules

### Who Can Access Projects?
- ✅ **Super Admins** - Full access (bypass all restrictions)
- ✅ **Organization Admins** - Full access (bypass all restrictions)  
- ✅ **Product Managers** - Users with "product" in their `assigned_communities`
- ❌ **Other Community Leads** - No access (QA, Backend, Frontend, etc.)
- ❌ **Regular Users** - No access

### Protected Endpoints

All project-related endpoints now require Product Manager access:

#### Project Endpoints
- `POST /api/projects/` - Create project
- `GET /api/projects/community/{community_id}` - List projects
- `GET /api/projects/{project_id}` - Get project details
- `PATCH /api/projects/{project_id}` - Update project
- `DELETE /api/projects/{project_id}` - **NEW** Delete project

#### Issue Endpoints
- `POST /api/projects/{project_id}/issues` - Create issue
- `GET /api/projects/{project_id}/issues` - List issues
- `GET /api/projects/{project_id}/issues/{issue_id}` - Get issue details
- `PATCH /api/projects/{project_id}/issues/{issue_id}` - Update issue
- `POST /api/projects/{project_id}/issues/{issue_id}/move` - Move issue (Kanban)
- `POST /api/projects/{project_id}/issues/{issue_id}/comments` - Add comment

---

## 🛠️ Backend Changes

### File: `backend/api/project_routes.py`

#### 1. Added Access Control Helper
```python
import json
from core.database import get_db, UserRole

def check_product_manager_access(current_user):
    """Check if user has access to Product Managers community"""
    # Super admins and org admins have full access
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN]:
        return True
    
    # Check if user has "product" in their assigned communities
    if current_user.assigned_communities:
        try:
            communities = json.loads(current_user.assigned_communities)
            if "product" in communities:
                return True
        except:
            pass
    
    raise HTTPException(
        status_code=403, 
        detail="Access denied. Only Product Managers can manage projects."
    )
```

#### 2. Updated All Endpoints
Every endpoint now calls `check_product_manager_access(current_user)` before processing.

#### 3. Added DELETE Endpoint
```python
@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete project - Only Product Managers"""
    check_product_manager_access(current_user)
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    
    return {"message": "Project deleted successfully"}
```

---

## 🎨 Frontend Changes

### File: `frontend/src/components/projects/ProjectList.tsx`

#### 1. Added Delete Functionality
```typescript
const [deletingId, setDeletingId] = useState<number | null>(null);

const handleDeleteProject = async (projectId: number, event: React.MouseEvent) => {
  event.stopPropagation(); // Prevent triggering onProjectClick
  
  if (!confirm('Are you sure you want to delete this project?')) {
    return;
  }

  try {
    setDeletingId(projectId);
    const token = localStorage.getItem('token');
    const response = await fetch(
      `http://localhost:8000/api/projects/${projectId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      setProjects(projects.filter(p => p.id !== projectId));
    } else {
      const error = await response.json();
      alert(error.detail || 'Failed to delete project');
    }
  } catch (error) {
    alert('Failed to delete project');
  } finally {
    setDeletingId(null);
  }
};
```

#### 2. Added Delete Button to Project Cards
Each project card now has a delete button (trash icon) in the top-right corner:
- Shows loading spinner while deleting
- Prevents card click when delete button is clicked
- Confirms before deletion
- Shows error message if deletion fails (e.g., no permission)

---

## 📊 How It Works

### User Assignment Flow

1. **Super Admin/Org Admin** assigns users to Product Managers community:
   ```json
   {
     "role": "community_lead",
     "assigned_communities": ["product"]
   }
   ```

2. **Database Storage** - `users.assigned_communities`:
   ```
   ["product"]  → JSON string in database
   ```

3. **Access Check** - On every API call:
   ```python
   # Parse JSON
   communities = json.loads(current_user.assigned_communities)
   
   # Check if "product" is in the list
   if "product" in communities:
       return True  # Access granted
   ```

### Error Handling

When a non-Product Manager tries to access projects:

**Backend Response:**
```json
{
  "detail": "Access denied. Only Product Managers can manage projects."
}
```

**HTTP Status:** `403 Forbidden`

**Frontend Behavior:**
- Project list won't load
- Create project button won't work
- Direct API calls will show error message

---

## 🧪 Testing Instructions

### 1. Create a Product Manager User

```bash
# Login as Super Admin
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@unifiedwork.com&password=admin123" \
  | jq -r '.access_token')

# Create Product Manager
curl -X POST http://localhost:8000/api/organizations/1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "pm_user",
    "email": "pm@example.com",
    "password": "pm123",
    "full_name": "Product Manager",
    "role": "community_lead",
    "assigned_communities": ["product"]
  }'
```

### 2. Test Access Control

**As Product Manager:**
- ✅ Can view Projects tab
- ✅ Can create projects
- ✅ Can edit projects
- ✅ Can delete projects (new!)
- ✅ Can manage issues

**As QA Engineer (assigned to "qa"):**
- ❌ GET /api/projects/community/product → 403 Forbidden
- ❌ POST /api/projects/ → 403 Forbidden
- ❌ DELETE /api/projects/1 → 403 Forbidden

### 3. Test Delete Functionality

1. Login as Product Manager at http://localhost:3001
2. Navigate to Product Managers community
3. Click "📋 Projects" tab
4. Hover over a project card
5. Click the trash icon in top-right corner
6. Confirm deletion
7. Project should be removed from list

---

## 🔒 Security Notes

### Database-Level Protection
- Cascade deletes ensure related data is cleaned up
- Foreign key constraints prevent orphaned records

### API-Level Protection
- All endpoints check authentication first
- Then check Product Manager access
- Returns 403 if access denied

### Frontend Protection
- Delete button available to all users (UI-only)
- Backend enforces actual access control
- Error messages shown if unauthorized

---

## 📁 Files Modified

### Backend
- ✅ `backend/api/project_routes.py` - Added access control + DELETE endpoint

### Frontend
- ✅ `frontend/src/components/projects/ProjectList.tsx` - Added delete button + handler
- ✅ `frontend/src/components/projects/ProjectList.tsx` - Fixed projects data extraction

---

## 🎯 User Experience

### Product Managers See:
```
┌─────────────────────────────────┐
│ 📊 Test Project         [🗑️]   │
│ TEST                            │
│                                 │
│ Test description                │
│                                 │
│ 📋 0 issues    👤 Admin         │
└─────────────────────────────────┘
```

### Other Users See:
- Access Denied message when trying to view projects
- 403 error if they attempt direct API calls

---

## ✅ Summary

**Restrictions Implemented:**
- ✅ Only Product Managers can create projects
- ✅ Only Product Managers can view projects
- ✅ Only Product Managers can edit projects
- ✅ Only Product Managers can delete projects
- ✅ Only Product Managers can manage issues
- ✅ Super Admins and Org Admins bypass all restrictions

**New Features:**
- ✅ DELETE endpoint for projects
- ✅ Delete button in UI with confirmation
- ✅ Loading state during deletion
- ✅ Error handling for failed deletions

**Ready for use!** 🚀
