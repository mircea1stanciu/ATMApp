from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, EmailStr

from app.db.session import get_db
from app.core.security import (
    create_access_token, create_refresh_token, decode_token
)
from app.schemas.auth import (
    UserCreate, TokenResponse, RefreshTokenRequest, UserResponse
)
from app.services import AuthService
from app.models.models import UserRole

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Dependency to get current authenticated user from JWT token."""
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    user = await AuthService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    return user


@router.post("/register", response_model=TokenResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user."""
    try:
        user = await AuthService.register_user(db, user_data)
        access_token = create_access_token(str(user.id))
        refresh_token = create_refresh_token(str(user.id))
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login with email and password."""
    user = await AuthService.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token_endpoint(
    body: RefreshTokenRequest
):
    """Refresh access token using refresh token."""
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user = Depends(get_current_user)
):
    """Get current authenticated user info."""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# Permission helpers
# ---------------------------------------------------------------------------

def require_role(*roles: UserRole):
    """Dependency factory: raise 403 if current user's role is not in allowed roles."""
    async def _check(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this action",
            )
        return current_user
    return _check

require_admin = require_role(UserRole.admin)
require_lead_or_above = require_role(UserRole.admin, UserRole.automation_lead)
require_user_or_above = require_role(
    UserRole.admin,
    UserRole.automation_lead,
    UserRole.automation_user,
    UserRole.developer,
)


# ---------------------------------------------------------------------------
# Admin: user management
# ---------------------------------------------------------------------------

class UserUpdateRequest(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    assigned_lead_id: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


VALID_ROLES = [r.value for r in UserRole]


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    manager=Depends(require_lead_or_above),
    db: AsyncSession = Depends(get_db),
):
    """[Admin/Automation Lead] List users for management and lead assignments."""
    users = await AuthService.list_users(db)

    if manager.role == UserRole.automation_lead:
        manager_id = str(manager.id)
        users = [
            u for u in users
            if (
                str(u.id) == manager_id
                or str(u.assigned_lead_id or "") == manager_id
                or (
                    u.role in {UserRole.automation_user, UserRole.viewer}
                    and u.assigned_lead_id is None
                )
            )
        ]

    users_by_id = {str(u.id): u for u in users}
    return [
        UserResponse(
            id=str(u.id),
            email=u.email,
            full_name=u.full_name,
            role=u.role.value,
            assigned_lead_id=u.assigned_lead_id,
            assigned_lead_name=(
                users_by_id[str(u.assigned_lead_id)].full_name
                or users_by_id[str(u.assigned_lead_id)].email
            )
            if u.assigned_lead_id and str(u.assigned_lead_id) in users_by_id
            else None,
            is_active=u.is_active,
            created_at=u.created_at.isoformat(),
        )
        for u in users
    ]


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    body: UserUpdateRequest,
    manager=Depends(require_lead_or_above),
    db: AsyncSession = Depends(get_db),
):
    """[Admin/Automation Lead] Update a user. Leads can only assign automation users/viewers."""
    if body.role is not None and body.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Valid roles: {VALID_ROLES}",
        )

    target_user = await AuthService.get_user_by_id(db, user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if body.assigned_lead_id:
        if target_user.role not in {UserRole.automation_user, UserRole.viewer}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only Automation User and Viewer accounts can be assigned to an Automation Lead",
            )
        assigned_lead = await AuthService.get_user_by_id(db, body.assigned_lead_id)
        if not assigned_lead or assigned_lead.role != UserRole.automation_lead:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="assigned_lead_id must reference an existing Automation Lead",
            )

    if manager.role == UserRole.automation_lead:
        # Leads can only manage assignment for automation users and viewers.
        if target_user.role not in {UserRole.automation_user, UserRole.viewer}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Automation Leads can assign only Automation User or Viewer accounts",
            )

        if any([
            body.email is not None,
            body.full_name is not None,
            body.role is not None,
            body.is_active is not None,
            body.password is not None,
        ]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Automation Leads can only update assigned_lead_id",
            )

        if body.assigned_lead_id and body.assigned_lead_id != str(manager.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Automation Leads can assign users only to themselves",
            )

    try:
        user = await AuthService.update_user(
            db,
            user_id=user_id,
            email=body.email,
            full_name=body.full_name,
            role=body.role,
            assigned_lead_id=body.assigned_lead_id,
            is_active=body.is_active,
            password=body.password,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    assigned_lead_name = None
    if user.assigned_lead_id:
        assigned_lead = await AuthService.get_user_by_id(db, str(user.assigned_lead_id))
        if assigned_lead:
            assigned_lead_name = assigned_lead.full_name or assigned_lead.email

    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        assigned_lead_id=user.assigned_lead_id,
        assigned_lead_name=assigned_lead_name,
        is_active=user.is_active,
        created_at=user.created_at.isoformat(),
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    manager=Depends(require_lead_or_above),
    db: AsyncSession = Depends(get_db),
):
    """[Admin/Automation Lead] Delete a user with scoped permissions."""
    target_user = await AuthService.get_user_by_id(db, user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if str(target_user.id) == str(manager.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot delete your own account",
        )

    if manager.role == UserRole.automation_lead:
        if not target_user.assigned_lead_id or str(target_user.assigned_lead_id) != str(manager.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Automation Leads can delete only users assigned to them",
            )

    success = await AuthService.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return None
