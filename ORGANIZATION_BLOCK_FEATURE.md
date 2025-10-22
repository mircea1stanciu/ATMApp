# 🚫 Organization Block/Unblock Feature

## Overview

Super admins can now block and unblock organizations to control access to the platform. When an organization is blocked, all users from that organization are prevented from logging in or registering new accounts.

---

## 🎯 Features

### Backend API
- **Block Endpoint**: `PATCH /api/organizations/{org_id}/block`
- **Unblock Endpoint**: `PATCH /api/organizations/{org_id}/unblock`
- **Authorization**: Super Admin only
- **Login Protection**: Blocks authentication for users in blocked organizations
- **Registration Protection**: Prevents new user registration for blocked organizations

### Frontend UI
- **Dynamic Buttons**: Block/Unblock buttons in Organizations table
- **Visual Indicators**: 
  - 🚫 **Block** button (orange) - shown when org is active
  - ✅ **Unblock** button (green) - shown when org is blocked
- **Confirmation Dialog**: Prevents accidental blocking
- **Success Messages**: Clear feedback after actions

---

## 🔐 Security & Access Control

### Who Can Block/Unblock?

| Role | Can Block/Unblock? | Notes |
|------|-------------------|-------|
| **Super Admin** | ✅ Yes | Full control over all organizations |
| **Org Admin** | ❌ No | Cannot block their own organization |
| **User** | ❌ No | No access to organization management |

### Protected Organizations

- ✅ **Default Organization** (ID: 1) **cannot be blocked**
- ✅ Prevents platform lockout
- ✅ Ensures super admin access is maintained

---

## 🔧 API Usage

### Block Organization

**Endpoint:**
```http
PATCH /api/organizations/{org_id}/block
Authorization: Bearer <super_admin_token>
```

**Example:**
```bash
curl -X PATCH http://localhost:8000/api/organizations/2/block \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "message": "Organization blocked successfully",
  "organization": {
    "id": 2,
    "name": "Demo Company",
    "is_active": false
  }
}
```

### Unblock Organization

**Endpoint:**
```http
PATCH /api/organizations/{org_id}/unblock
Authorization: Bearer <super_admin_token>
```

**Example:**
```bash
curl -X PATCH http://localhost:8000/api/organizations/2/unblock \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "message": "Organization unblocked successfully",
  "organization": {
    "id": 2,
    "name": "Demo Company",
    "is_active": true
  }
}
```

### Error Responses

**403 - Cannot Block Default Organization**
```json
{
  "detail": "Cannot block default organization"
}
```

**404 - Organization Not Found**
```json
{
  "detail": "Organization not found"
}
```

**401 - Unauthorized**
```json
{
  "detail": "Not authenticated"
}
```

**403 - Not Super Admin**
```json
{
  "detail": "Super admin access required"
}
```

---

## 🚫 What Happens When Blocked?

### Login Attempts

**Before Blocking:**
```bash
POST /api/auth/login
{"username": "user@company.com", "password": "pass123"}

✅ Response: Access token granted
```

**After Blocking:**
```bash
POST /api/auth/login
{"username": "user@company.com", "password": "pass123"}

❌ Response: 403 Forbidden
{
  "detail": "Your organization has been blocked. Please contact support."
}
```

### Registration Attempts

**Before Blocking:**
```bash
POST /api/auth/register
{"username": "newuser", "email": "new@company.com", ...}

✅ Response: User created
```

**After Blocking:**
```bash
POST /api/auth/register
{"username": "newuser", "email": "new@company.com", ...}

❌ Response: 403 Forbidden
{
  "detail": "Organization is blocked. New registrations are not allowed."
}
```

### Existing Sessions

- ✅ **Current sessions remain active** until token expires
- ✅ Users can continue using the platform with valid tokens
- ❌ Cannot login again after logout
- ❌ Cannot refresh expired tokens

---

## 🖥️ User Interface

### Organizations Table - Actions Column

**Active Organization:**
```
┌──────────────────────────────────────────────┐
│ Actions                                      │
│ [📊 View] [💳 Change Plan] [🚫 Block] [🗑️ Delete] │
└──────────────────────────────────────────────┘
```

**Blocked Organization:**
```
┌──────────────────────────────────────────────┐
│ Actions                                      │
│ [📊 View] [💳 Change Plan] [✅ Unblock] [🗑️ Delete] │
└──────────────────────────────────────────────┘
```

### Button Styles

**Block Button:**
- Color: Orange (`bg-orange-100 text-orange-700`)
- Icon: 🚫
- Hover: Darker orange
- Text: "Block"

**Unblock Button:**
- Color: Green (`bg-green-100 text-green-700`)
- Icon: ✅
- Hover: Darker green
- Text: "Unblock"

### Confirmation Dialog

**Blocking:**
```
⚠️ Block "Demo Company"?

This will prevent all users from logging in 
and new registrations.

[Cancel]  [OK]
```

### Success Messages

**After Blocking:**
```
✅ Organization "Demo Company" has been blocked.
```

**After Unblocking:**
```
✅ Organization "Demo Company" has been unblocked.
```

---

## 📋 Use Cases

### Use Case 1: Suspend Non-Paying Customer

**Scenario:** Organization hasn't paid subscription

**Steps:**
1. Super admin logs in
2. Navigate to Organizations
3. Find the organization
4. Click **"🚫 Block"** button
5. Confirm the action
6. ✅ Organization blocked

**Result:**
- All users cannot login
- New registrations prevented
- Existing users see error message

### Use Case 2: Security Incident

**Scenario:** Suspicious activity detected in organization

**Steps:**
1. Immediately block organization
2. Investigate the issue
3. Contact organization admin
4. Resolve security issues
5. Unblock organization

**Benefit:** Quick response to security threats

### Use Case 3: Temporary Maintenance

**Scenario:** Organization requests temporary suspension

**Steps:**
1. Block during maintenance
2. Perform updates/migrations
3. Test thoroughly
4. Unblock when ready

**Benefit:** Controlled access during sensitive operations

### Use Case 4: Contract Violation

**Scenario:** Organization violates terms of service

**Steps:**
1. Block access immediately
2. Notify organization
3. Allow time for appeal
4. Unblock or delete based on resolution

**Benefit:** Enforce platform policies

---

## 🔄 Block/Unblock Flow

```
┌─────────────┐
│ Super Admin │
│ Views Orgs  │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ Sees Active  │
│ Organization │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Clicks       │
│ "🚫 Block"   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Confirmation │
│ Dialog       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ User Confirms│
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ API Call:        │
│ PATCH /block     │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Update DB:       │
│ is_active=false  │
└──────┬───────────┘
       │
       ▼
┌──────────────┐
│ Success      │
│ Message      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Reload Table │
│ Show Unblock │
└──────────────┘
```

---

## 🧪 Testing Guide

### Test Case 1: Block Active Organization

**Setup:**
1. Login as super_admin
2. Organization "Demo Company" is active
3. Organization has users

**Steps:**
1. Navigate to Organizations
2. Find "Demo Company"
3. Click "🚫 Block" button
4. Confirm dialog

**Expected:**
- ✅ Success message appears
- ✅ Button changes to "✅ Unblock"
- ✅ Status changes to "INACTIVE"

### Test Case 2: User Login Blocked

**Setup:**
1. Organization is blocked
2. User has valid credentials

**Steps:**
1. User tries to login
2. Enter username/password

**Expected:**
- ❌ Login fails with 403
- ❌ Error: "Your organization has been blocked. Please contact support."
- ✅ User sees clear error message

### Test Case 3: Registration Blocked

**Setup:**
1. Organization is blocked
2. New user tries to register

**Steps:**
1. Navigate to registration
2. Fill in details with blocked org

**Expected:**
- ❌ Registration fails with 403
- ❌ Error: "Organization is blocked. New registrations are not allowed."

### Test Case 4: Unblock Organization

**Setup:**
1. Organization is blocked
2. Issue resolved

**Steps:**
1. Click "✅ Unblock" button
2. Confirm action

**Expected:**
- ✅ Success message appears
- ✅ Button changes to "🚫 Block"
- ✅ Users can login again

### Test Case 5: Cannot Block Default Org

**Setup:**
1. Default organization (ID: 1)
2. Super admin attempts to block

**Steps:**
1. Try to block via API or UI

**Expected:**
- ❌ Error: "Cannot block default organization"
- ✅ Prevents platform lockout

### Test Case 6: Existing Session Continues

**Setup:**
1. User is logged in
2. Organization gets blocked

**Steps:**
1. User continues using platform
2. User doesn't logout

**Expected:**
- ✅ Session remains valid
- ✅ Can access features
- ❌ Cannot login again after logout

---

## 📊 Database Schema

### Organizations Table

**Field Updated:**
```sql
is_active BOOLEAN DEFAULT TRUE
```

**Blocking:**
```sql
UPDATE organizations 
SET is_active = FALSE 
WHERE id = 2;
```

**Unblocking:**
```sql
UPDATE organizations 
SET is_active = TRUE 
WHERE id = 2;
```

**Query Check:**
```sql
SELECT id, name, is_active 
FROM organizations 
WHERE id = 2;

-- Result when blocked:
-- id: 2, name: "Demo Company", is_active: false
```

---

## 🎨 UI Components

### Button Component Logic

```typescript
{currentUser?.role === 'super_admin' && org.id !== 1 && (
  org.is_active ? (
    <button 
      onClick={handleBlock}
      className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200"
    >
      🚫 Block
    </button>
  ) : (
    <button 
      onClick={handleUnblock}
      className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
    >
      ✅ Unblock
    </button>
  )
)}
```

### Handler Functions

**Block Handler:**
```typescript
const handleBlock = async () => {
  if (!confirm(`⚠️ Block "${org.name}"?...`)) return;
  
  await apiCall(`/api/organizations/${org.id}/block`, { 
    method: 'PATCH' 
  });
  
  alert(`✅ Organization "${org.name}" has been blocked.`);
  await loadOrganizations();
}
```

**Unblock Handler:**
```typescript
const handleUnblock = async () => {
  await apiCall(`/api/organizations/${org.id}/unblock`, { 
    method: 'PATCH' 
  });
  
  alert(`✅ Organization "${org.name}" has been unblocked.`);
  await loadOrganizations();
}
```

---

## 💾 Implementation Details

### Backend Code

**File:** `backend/main.py`

**Login Check:**
```python
@app.post("/api/auth/login")
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(...)
    
    # Check if organization is blocked
    if user.organization_id:
        org = db.query(Organization).filter(
            Organization.id == user.organization_id
        ).first()
        if org and not org.is_active:
            raise HTTPException(
                status_code=403,
                detail="Your organization has been blocked. Please contact support."
            )
    
    # Continue with login...
```

**Block Endpoint:**
```python
@app.patch("/api/organizations/{org_id}/block")
async def block_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_super_admin_user)
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(404, "Organization not found")
    
    if org.id == 1:
        raise HTTPException(403, "Cannot block default organization")
    
    org.is_active = False
    db.commit()
    
    return {"message": "Organization blocked successfully", ...}
```

### Frontend Code

**File:** `frontend/src/components/AdminDashboard.tsx`

**Conditional Rendering:**
- Button visibility based on `currentUser.role === 'super_admin'`
- Button text/color based on `org.is_active`
- Default org (id=1) never shows block button

---

## 📈 Monitoring & Analytics

### Metrics to Track

- Number of blocked organizations
- Duration organizations are blocked
- Frequency of block/unblock operations
- Failed login attempts due to blocks
- Support tickets related to blocks

### Audit Log (Future Enhancement)

```json
{
  "action": "organization_blocked",
  "organization_id": 2,
  "organization_name": "Demo Company",
  "performed_by": "admin@unifiedwork.com",
  "timestamp": "2025-10-22T10:30:00Z",
  "reason": "Payment overdue"
}
```

---

## ⚠️ Important Considerations

### Before Blocking

1. **Notify Users**: Send warning emails
2. **Check Payment**: Verify subscription status
3. **Document Reason**: Keep records of why blocked
4. **Set Timeline**: Define when to unblock/delete

### Communication Template

```
Subject: Action Required - Account Access Limited

Dear [Organization Admin],

Your organization's access to UnifiedWork has been temporarily 
suspended due to [reason].

To restore access:
1. [Action item 1]
2. [Action item 2]

Contact support: support@unifiedwork.com

Best regards,
UnifiedWork Team
```

---

## 🔄 Future Enhancements

### Potential Features

1. **Scheduled Blocking**
   - Block at specific date/time
   - Auto-unblock after period
   - Countdown notifications

2. **Partial Blocking**
   - Block specific features
   - Read-only access
   - Limited functionality

3. **Block Reasons**
   - Dropdown: Payment, Security, Maintenance, etc.
   - Required reason field
   - Shown to users

4. **Grace Period**
   - Warning mode before full block
   - Limited logins allowed
   - Countdown timer

5. **Auto-Block**
   - Block after X failed payments
   - Block on security alerts
   - Block based on usage violations

6. **Notification System**
   - Email users before blocking
   - In-app notifications
   - SMS alerts (optional)

7. **Block History**
   - Track all block/unblock events
   - Audit trail
   - Analytics dashboard

---

## 📝 Git Commit Info

**Commit Hash:** `f5fc10c`
**Branch:** `main`
**Files Changed:** 2
- `backend/main.py` (+101 lines)
- `frontend/src/components/AdminDashboard.tsx` (+1 line, complex logic)

**Total Changes:** +102 insertions, -1 deletion

---

## ✅ Feature Checklist

- ✅ Backend block endpoint
- ✅ Backend unblock endpoint
- ✅ Login protection when blocked
- ✅ Registration protection when blocked
- ✅ Frontend Block button
- ✅ Frontend Unblock button
- ✅ Conditional button rendering
- ✅ Confirmation dialog
- ✅ Success messages
- ✅ Auto-reload after action
- ✅ Cannot block default org
- ✅ Super admin only access
- ✅ Clear error messages
- ✅ API tested with curl
- ✅ Code committed to Git
- ✅ Changes pushed to GitHub
- ✅ Documentation complete

---

## 🎯 Summary

The Organization Block/Unblock feature provides super admins with powerful access control capabilities. Organizations can be quickly blocked to prevent all authentication and registration, with easy restoration through the unblock function.

**Key Benefits:**
- ✅ Instant access control
- ✅ Prevents unauthorized access
- ✅ Easy to reverse
- ✅ Clear user communication
- ✅ Protected default organization
- ✅ Intuitive UI

**Repository:** https://github.com/mircea21111/unified-workspace-app-321123.git

**Status:** ✅ Feature Complete and Production Ready

---

## 🚀 Quick Start Guide

1. **Refresh browser** (Cmd+Shift+R)
2. **Login** as super_admin (admin/admin123)
3. **Navigate** to Organizations
4. **Find** organization to block
5. **Click** "🚫 Block" button
6. **Confirm** the action
7. **Test** login with org user (should fail)
8. **Click** "✅ Unblock" to restore access
9. **Done!** Organization access controlled
