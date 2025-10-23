"""
Project Management API Routes - Jira-like functionality
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import json

from core.database import get_db, UserRole
from core.auth import get_current_user
from models.project_models import (
    Project, Issue, Sprint, IssueComment, IssueAttachment, 
    IssueActivity, IssueWatcher, IssueType, IssuePriority, IssueStatus
)

router = APIRouter(prefix="/api/projects", tags=["Projects"])


# Helper functions for access control
def check_product_manager_access(current_user):
    """Check if user has Product Manager access for create/update/delete operations
    
    Requirements:
    - Must have "product" in assigned_communities (any role), OR
    - Super Admin or Org Admin
    """
    # Super admins and org admins have full access
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN]:
        return True
    
    # Check if user has "product" in their assigned communities (works for both community_lead and user roles)
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


def check_organization_member(current_user):
    """Check if user belongs to an organization (for read operations)"""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=403, 
            detail="Access denied. User must belong to an organization."
        )
    return True


# Pydantic Schemas
class ProjectCreate(BaseModel):
    key: str
    name: str
    description: Optional[str] = None
    community_id: str
    icon: str = "📋"
    color: str = "blue"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    lead_user_id: Optional[int] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None


class IssueCreate(BaseModel):
    title: str
    description: Optional[str] = None
    issue_type: IssueType = IssueType.TASK
    priority: IssuePriority = IssuePriority.MEDIUM
    assignee_id: Optional[int] = None
    sprint_id: Optional[int] = None
    parent_issue_id: Optional[int] = None
    epic_id: Optional[int] = None
    story_points: Optional[int] = None
    due_date: Optional[datetime] = None


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    issue_type: Optional[IssueType] = None
    priority: Optional[IssuePriority] = None
    status: Optional[IssueStatus] = None
    assignee_id: Optional[int] = None
    sprint_id: Optional[int] = None
    story_points: Optional[int] = None
    due_date: Optional[datetime] = None
    resolution: Optional[str] = None


class CommentCreate(BaseModel):
    content: str


class SprintCreate(BaseModel):
    name: str
    goal: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


# Project Endpoints
@router.post("/")
async def create_project(
    project_data: ProjectCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new project - Only Product Managers"""
    # Check access
    check_product_manager_access(current_user)
    
    # Check if project key already exists
    existing = db.query(Project).filter(Project.key == project_data.key.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project key already exists")
    
    project = Project(
        key=project_data.key.upper(),
        name=project_data.name,
        description=project_data.description,
        community_id=project_data.community_id,
        organization_id=current_user.organization_id,
        icon=project_data.icon,
        color=project_data.color,
        created_by_user_id=current_user.id,
        lead_user_id=current_user.id
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return {"message": "Project created successfully", "project": project}


@router.get("/community/{community_id}")
async def get_community_projects(
    community_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all projects for a community - All organization members can view"""
    # Check user belongs to organization
    check_organization_member(current_user)
    projects = db.query(Project).filter(
        Project.community_id == community_id,
        Project.organization_id == current_user.organization_id,
        Project.is_archived == False
    ).all()
    
    return {"projects": projects}


@router.get("/{project_id}")
async def get_project(
    project_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get project details - All organization members can view"""
    # Check user belongs to organization
    check_organization_member(current_user)
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"project": project}


@router.patch("/{project_id}")
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update project - Only Product Managers"""
    # Check access
    check_product_manager_access(current_user)
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update fields
    for field, value in project_data.dict(exclude_unset=True).items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    
    return {"message": "Project updated successfully", "project": project}


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete project - Only Product Managers"""
    # Check access
    check_product_manager_access(current_user)
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete the project (cascade will delete related issues, sprints, etc.)
    db.delete(project)
    db.commit()
    
    return {"message": "Project deleted successfully"}


# Issue Endpoints
@router.post("/{project_id}/issues")
async def create_issue(
    project_id: int,
    issue_data: IssueCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new issue - Only Product Managers"""
    # Check access
    check_product_manager_access(current_user)
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Generate issue key (e.g., QA-1, QA-2, etc.)
    last_issue = db.query(Issue).filter(
        Issue.project_id == project_id
    ).order_by(Issue.id.desc()).first()
    
    issue_number = 1 if not last_issue else int(last_issue.key.split('-')[1]) + 1
    issue_key = f"{project.key}-{issue_number}"
    
    issue = Issue(
        key=issue_key,
        project_id=project_id,
        title=issue_data.title,
        description=issue_data.description,
        issue_type=issue_data.issue_type,
        priority=issue_data.priority,
        assignee_id=issue_data.assignee_id,
        reporter_id=current_user.id,
        sprint_id=issue_data.sprint_id,
        parent_issue_id=issue_data.parent_issue_id,
        epic_id=issue_data.epic_id,
        story_points=issue_data.story_points,
        due_date=issue_data.due_date
    )
    
    db.add(issue)
    db.commit()
    db.refresh(issue)
    
    # Log activity
    activity = IssueActivity(
        issue_id=issue.id,
        user_id=current_user.id,
        action="created"
    )
    db.add(activity)
    db.commit()
    
    return {"message": "Issue created successfully", "issue": issue}


@router.get("/{project_id}/issues")
async def get_project_issues(
    project_id: int,
    status: Optional[str] = None,
    assignee_id: Optional[int] = None,
    sprint_id: Optional[int] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all issues for a project - All organization members can view"""
    # Check user belongs to organization
    check_organization_member(current_user)
    
    query = db.query(Issue).filter(Issue.project_id == project_id)
    
    if status:
        query = query.filter(Issue.status == status)
    if assignee_id:
        query = query.filter(Issue.assignee_id == assignee_id)
    if sprint_id:
        query = query.filter(Issue.sprint_id == sprint_id)
    
    issues = query.order_by(Issue.order_index, Issue.created_at.desc()).all()
    
    return {"issues": issues}


@router.get("/{project_id}/issues/{issue_id}")
async def get_issue(
    project_id: int,
    issue_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get issue details with comments and activities - All organization members can view"""
    # Check user belongs to organization
    check_organization_member(current_user)
    
    issue = db.query(Issue).filter(
        Issue.id == issue_id,
        Issue.project_id == project_id
    ).first()
    
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    return {
        "issue": issue,
        "comments": issue.comments,
        "activities": issue.activities,
        "attachments": issue.attachments
    }


@router.patch("/{project_id}/issues/{issue_id}")
async def update_issue(
    project_id: int,
    issue_id: int,
    issue_data: IssueUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an issue - Only Product Managers"""
    # Check access
    check_product_manager_access(current_user)
    
    issue = db.query(Issue).filter(
        Issue.id == issue_id,
        Issue.project_id == project_id
    ).first()
    
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Log changes
    for field, new_value in issue_data.dict(exclude_unset=True).items():
        old_value = getattr(issue, field)
        if old_value != new_value:
            activity = IssueActivity(
                issue_id=issue.id,
                user_id=current_user.id,
                action="updated",
                field=field,
                old_value=str(old_value) if old_value else None,
                new_value=str(new_value) if new_value else None
            )
            db.add(activity)
            setattr(issue, field, new_value)
    
    if issue_data.status == IssueStatus.DONE and not issue.resolved_at:
        issue.resolved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(issue)
    
    return {"message": "Issue updated successfully", "issue": issue}


@router.post("/{project_id}/issues/{issue_id}/move")
async def move_issue_status(
    project_id: int,
    issue_id: int,
    new_status: IssueStatus,
    new_order: Optional[int] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Move issue to new status (for Kanban board) - Only Product Managers"""
    # Check access
    check_product_manager_access(current_user)
    
    issue = db.query(Issue).filter(
        Issue.id == issue_id,
        Issue.project_id == project_id
    ).first()
    
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    old_status = issue.status
    issue.status = new_status
    
    if new_order is not None:
        issue.order_index = new_order
    
    # Log activity
    activity = IssueActivity(
        issue_id=issue.id,
        user_id=current_user.id,
        action="moved",
        field="status",
        old_value=old_status.value,
        new_value=new_status.value
    )
    db.add(activity)
    
    db.commit()
    db.refresh(issue)
    
    return {"message": "Issue moved successfully", "issue": issue}


# Comment Endpoints
@router.post("/{project_id}/issues/{issue_id}/comments")
async def add_comment(
    project_id: int,
    issue_id: int,
    comment_data: CommentCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add comment to issue - Only Product Managers"""
    # Check access
    check_product_manager_access(current_user)
    
    issue = db.query(Issue).filter(
        Issue.id == issue_id,
        Issue.project_id == project_id
    ).first()
    
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    comment = IssueComment(
        issue_id=issue_id,
        user_id=current_user.id,
        content=comment_data.content
    )
    
    db.add(comment)
    
    # Log activity
    activity = IssueActivity(
        issue_id=issue_id,
        user_id=current_user.id,
        action="commented"
    )
    db.add(activity)
    
    db.commit()
    db.refresh(comment)
    
    return {"message": "Comment added successfully", "comment": comment}


# Sprint Endpoints
@router.post("/{project_id}/sprints")
async def create_sprint(
    project_id: int,
    sprint_data: SprintCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new sprint"""
    sprint = Sprint(
        project_id=project_id,
        name=sprint_data.name,
        goal=sprint_data.goal,
        start_date=sprint_data.start_date,
        end_date=sprint_data.end_date
    )
    
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    
    return {"message": "Sprint created successfully", "sprint": sprint}


@router.get("/{project_id}/sprints")
async def get_sprints(
    project_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all sprints for a project"""
    sprints = db.query(Sprint).filter(Sprint.project_id == project_id).all()
    
    return {"sprints": sprints}


@router.post("/{project_id}/sprints/{sprint_id}/start")
async def start_sprint(
    project_id: int,
    sprint_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a sprint"""
    sprint = db.query(Sprint).filter(
        Sprint.id == sprint_id,
        Sprint.project_id == project_id
    ).first()
    
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    
    sprint.is_active = True
    if not sprint.start_date:
        sprint.start_date = datetime.utcnow()
    
    db.commit()
    db.refresh(sprint)
    
    return {"message": "Sprint started successfully", "sprint": sprint}


@router.post("/{project_id}/sprints/{sprint_id}/complete")
async def complete_sprint(
    project_id: int,
    sprint_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete a sprint"""
    sprint = db.query(Sprint).filter(
        Sprint.id == sprint_id,
        Sprint.project_id == project_id
    ).first()
    
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    
    sprint.is_active = False
    sprint.is_completed = True
    sprint.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(sprint)
    
    return {"message": "Sprint completed successfully", "sprint": sprint}
