# Jira-Like Project Management - Implementation Guide

## ✅ Implementation Status: IN PROGRESS

A comprehensive Jira-like project management system integrated with UnifiedWork communities.

---

## 🎯 Feature Overview

**Project Management System** allows community members to collaborate on projects with full agile workflow support.

### Key Features
- 📋 **Projects** - Community-specific projects with customizable settings
- 🎫 **Issues/Tasks** - Stories, Tasks, Bugs, and Epics
- 📊 **Kanban Board** - Drag-and-drop visual workflow
- 🏃 **Sprints** - Agile sprint planning and tracking
- 💬 **Comments** - Rich discussions on issues
- 📎 **Attachments** - File uploads on issues
- 📈 **Activity Timeline** - Complete audit trail
- 🔍 **Filters & Search** - Advanced filtering
- 👁️ **Watchers** - Subscribe to issue updates

---

## 📋 Database Schema

### Tables Created

#### 1. **projects**
```sql
- id (PK)
- key (VARCHAR) - Unique project key (e.g., "QA", "BACKEND")
- name (VARCHAR) - Project name
- description (TEXT)
- community_id (VARCHAR) - Links to community (qa, backend, etc.)
- organization_id (FK) - Multi-tenant support
- lead_user_id (FK) - Project lead
- icon (VARCHAR) - Emoji icon
- color (VARCHAR) - Project color
- is_active, is_archived (BOOLEAN)
- created_at, updated_at (DATETIME)
- created_by (FK)
```

#### 2. **issues**
```sql
- id (PK)
- key (VARCHAR) - Unique issue key (e.g., "QA-123")
- project_id (FK)
- title (VARCHAR)
- description (TEXT)
- issue_type (ENUM) - story, task, bug, epic
- priority (ENUM) - lowest, low, medium, high, highest
- status (ENUM) - backlog, todo, in_progress, in_review, done, closed
- assignee_id (FK) - Assigned user
- reporter_id (FK) - User who created it
- parent_issue_id (FK) - For subtasks
- epic_id (FK) - Link to epic
- sprint_id (FK)
- story_points (INT)
- resolution (VARCHAR)
- due_date (DATETIME)
- order_index (INT) - For kanban ordering
- created_at, updated_at, resolved_at (DATETIME)
- custom_fields (JSON) - Extensible custom data
```

#### 3. **sprints**
```sql
- id (PK)
- project_id (FK)
- name (VARCHAR)
- goal (TEXT)
- start_date, end_date (DATETIME)
- is_active, is_completed (BOOLEAN)
- created_at, completed_at (DATETIME)
```

#### 4. **issue_comments**
```sql
- id (PK)
- issue_id (FK)
- user_id (FK)
- content (TEXT)
- created_at, updated_at (DATETIME)
```

#### 5. **issue_attachments**
```sql
- id (PK)
- issue_id (FK)
- user_id (FK)
- filename, file_path (VARCHAR)
- file_size (INT)
- mime_type (VARCHAR)
- created_at (DATETIME)
```

#### 6. **issue_activities**
```sql
- id (PK)
- issue_id (FK)
- user_id (FK)
- action (VARCHAR) - created, updated, commented, moved, etc.
- field (VARCHAR) - Field that changed
- old_value, new_value (TEXT)
- created_at (DATETIME)
```

#### 7. **issue_watchers**
```sql
- id (PK)
- issue_id (FK)
- user_id (FK)
- created_at (DATETIME)
```

---

## 🔌 API Endpoints

### Projects

#### Create Project
```http
POST /api/projects
Authorization: Bearer {token}

{
  "key": "QA",
  "name": "QA Testing Projects",
  "description": "Test automation and quality assurance tasks",
  "community_id": "qa",
  "icon": "🎯",
  "color": "blue"
}
```

#### Get Community Projects
```http
GET /api/projects/community/{community_id}
Authorization: Bearer {token}
```

#### Get Project Details
```http
GET /api/projects/{project_id}
Authorization: Bearer {token}
```

#### Update Project
```http
PATCH /api/projects/{project_id}
Authorization: Bearer {token}

{
  "name": "Updated Name",
  "lead_user_id": 5
}
```

### Issues

#### Create Issue
```http
POST /api/projects/{project_id}/issues
Authorization: Bearer {token}

{
  "title": "Implement login tests",
  "description": "Write Playwright tests for login functionality",
  "issue_type": "task",
  "priority": "high",
  "assignee_id": 3,
  "story_points": 5,
  "due_date": "2025-10-30T00:00:00Z"
}
```

#### Get Project Issues
```http
GET /api/projects/{project_id}/issues?status=in_progress&assignee_id=3
Authorization: Bearer {token}
```

#### Get Issue Details
```http
GET /api/projects/{project_id}/issues/{issue_id}
Authorization: Bearer {token}
```

#### Update Issue
```http
PATCH /api/projects/{project_id}/issues/{issue_id}
Authorization: Bearer {token}

{
  "status": "in_progress",
  "assignee_id": 5,
  "story_points": 8
}
```

#### Move Issue (Kanban)
```http
POST /api/projects/{project_id}/issues/{issue_id}/move
Authorization: Bearer {token}

{
  "new_status": "in_review",
  "new_order": 2
}
```

### Comments

#### Add Comment
```http
POST /api/projects/{project_id}/issues/{issue_id}/comments
Authorization: Bearer {token}

{
  "content": "I've reviewed the code and it looks good!"
}
```

### Sprints

#### Create Sprint
```http
POST /api/projects/{project_id}/sprints
Authorization: Bearer {token}

{
  "name": "Sprint 1",
  "goal": "Implement core testing framework",
  "start_date": "2025-10-23T00:00:00Z",
  "end_date": "2025-11-06T00:00:00Z"
}
```

#### Get Sprints
```http
GET /api/projects/{project_id}/sprints
Authorization: Bearer {token}
```

#### Start Sprint
```http
POST /api/projects/{project_id}/sprints/{sprint_id}/start
Authorization: Bearer {token}
```

#### Complete Sprint
```http
POST /api/projects/{project_id}/sprints/{sprint_id}/complete
Authorization: Bearer {token}
```

---

## 🎨 Frontend Components (To Be Built)

### 1. **ProjectList.tsx**
- Shows all projects for a community
- Grid/List view toggle
- Create new project button
- Filter by status (active/archived)

### 2. **KanbanBoard.tsx**
- Drag-and-drop columns (Backlog, To Do, In Progress, In Review, Done)
- Issue cards with key, title, assignee, priority
- Quick filters (assignee, sprint, issue type)
- Create issue inline

### 3. **IssueDetail.tsx**
- Full issue view with all fields
- Comments section
- Attachments list
- Activity timeline
- Edit inline
- Watch/unwatch button

### 4. **SprintBoard.tsx**
- Sprint planning view
- Backlog on left, sprint on right
- Drag issues to sprint
- Sprint burndown chart
- Start/complete sprint buttons

### 5. **IssueCreateModal.tsx**
- Form to create new issue
- All fields (title, description, type, priority, assignee, etc.)
- Template support
- Quick create vs detailed create

### 6. **ProjectSettings.tsx**
- Project configuration
- Team members
- Workflow customization
- Custom fields

---

## 🔄 User Workflows

### Creating a Project
1. User navigates to community dashboard
2. Clicks "Projects" tab
3. Clicks "+ New Project"
4. Fills in: Key (QA), Name, Description
5. Project created with user as lead

### Working with Issues - Kanban Style
1. Open project → Kanban board view
2. Issues organized in columns by status
3. Drag issue from "To Do" to "In Progress"
4. Status updates automatically
5. Click issue to view details
6. Add comment, update fields, attach files

### Sprint Planning
1. Open project → Sprint view
2. Create new sprint with name, goal, dates
3. Drag issues from backlog into sprint
4. Start sprint when ready
5. Track progress on sprint board
6. Complete sprint, move incomplete items to backlog

### Issue Lifecycle
```
Created (Backlog)
    ↓
To Do (Sprint Planning)
    ↓
In Progress (Development)
    ↓
In Review (Code Review/QA)
    ↓
Done (Completed)
    ↓
Closed (Archived)
```

---

## 🎯 Integration with Communities

### Community-Specific Projects
- Each community (QA, Backend, Frontend, etc.) has its own projects
- Projects inherit community icon and color
- Community members have access based on role

### Access Control
- **Community Members**: Can view projects, create issues, comment
- **Community Leads**: Can create projects, manage sprints, assign issues
- **Org Admins**: Full access to all community projects
- **Super Admins**: Full system access

### Dashboard Integration
Quick access from community dashboard:
- "Projects" widget showing active projects
- "My Issues" widget showing assigned issues
- "Recent Activity" showing project updates

---

## 📊 Views & Boards

### 1. **Kanban Board**
```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│  Backlog    │   To Do     │ In Progress │  In Review  │    Done     │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ QA-1        │ QA-5        │ QA-3        │ QA-7        │ QA-2        │
│ QA-4        │ QA-6        │ QA-9        │             │ QA-8        │
│ QA-10       │             │             │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

### 2. **Sprint Board**
```
┌──────────────────────────┬──────────────────────────┐
│   Backlog                │   Sprint 1 (Active)      │
├──────────────────────────┼──────────────────────────┤
│ QA-15: New feature       │ QA-1: Login tests   [5]  │
│ QA-16: Bug fix           │ QA-2: API tests     [3]  │
│ QA-17: Documentation     │ QA-3: UI tests      [8]  │
│                          │ QA-4: Performance   [5]  │
│ [Drag here to add]       │ Total: 21 points         │
└──────────────────────────┴──────────────────────────┘
```

### 3. **Issue Detail**
```
┌────────────────────────────────────────────────────┐
│ QA-123: Implement login tests            [TASK]    │
├────────────────────────────────────────────────────┤
│ Status: In Progress    Priority: High              │
│ Assignee: John Doe     Reporter: Jane Smith        │
│ Sprint: Sprint 1       Points: 5                   │
│ Due: Oct 30, 2025                                  │
├────────────────────────────────────────────────────┤
│ Description:                                       │
│ Write comprehensive Playwright tests for login... │
│                                                    │
├────────────────────────────────────────────────────┤
│ Comments (3)           Attachments (1)   Activity  │
├────────────────────────────────────────────────────┤
│ John Doe - 2 hours ago                             │
│ I've started working on this...                    │
│                                                    │
│ [Add comment...]                                   │
└────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Steps

### Backend (Complete ✅)
- [x] Create database models
- [x] Create API routes
- [ ] Register routes in main.py
- [ ] Create database migration
- [ ] Test API endpoints

### Frontend (To Do)
- [ ] Create ProjectList component
- [ ] Create KanbanBoard component
- [ ] Create IssueDetail component
- [ ] Create SprintBoard component
- [ ] Create IssueCreateModal component
- [ ] Integrate with community dashboard
- [ ] Add "Projects" tab to community pages

### Features To Implement
- [ ] Drag-and-drop for Kanban
- [ ] File upload for attachments
- [ ] Real-time updates (WebSocket)
- [ ] Email notifications
- [ ] Search and filters
- [ ] Bulk operations
- [ ] Issue templates
- [ ] Custom workflows

---

## 🧪 Testing Checklist

### API Testing
- [ ] Create project
- [ ] List projects for community
- [ ] Create issue
- [ ] Update issue status
- [ ] Move issue on board
- [ ] Add comment
- [ ] Create sprint
- [ ] Start/complete sprint
- [ ] Filter issues
- [ ] Activity logging

### UI Testing
- [ ] Kanban board drag-drop
- [ ] Issue detail view
- [ ] Comment posting
- [ ] Sprint planning
- [ ] Project creation
- [ ] Responsive design
- [ ] Dark mode

---

## 📝 Next Steps

1. **Register API Routes** - Add project_routes to main.py
2. **Database Migration** - Create tables in database
3. **Build Frontend** - Create React components
4. **Testing** - Test all workflows
5. **Documentation** - User guide and tutorials

---

## 🎉 Benefits

- ✅ **Organized Work** - Structured project management
- ✅ **Team Collaboration** - Comments, assignments, watchers
- ✅ **Agile Workflow** - Sprints, story points, burndown
- ✅ **Transparency** - Activity logs, timeline
- ✅ **Flexibility** - Custom fields, workflows
- ✅ **Integration** - Seamlessly integrated with communities
- ✅ **Scalable** - Multi-tenant, organization-aware

---

**Next**: Let's register the API routes and start building the frontend!
