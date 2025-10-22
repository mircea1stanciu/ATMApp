# UnifiedWork Backend - AI-Powered Unified Workspace
# Comprehensive multi-tenant SaaS platform for tech teams

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Optional, Any
import os
from dotenv import load_dotenv

# Import core modules
from core.database import get_db, init_db, User, UserRole, Organization, SubscriptionPlan, ChatSession
from core.auth import (
    create_access_token,
    get_current_user,
    authenticate_user,
    get_organization_from_subdomain,
    get_org_admin_user,
    get_super_admin_user
)
from agents.qa_agent import QAAgent
from agents.backend_agent import BackendAgent
from agents.frontend_agent import FrontendAgent
from agents.design_agent import DesignAgent
from agents.product_agent import ProductAgent
from agents.devops_agent import DevOpsAgent
from agents.docs_agent import DocsAgent

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="UnifiedWork API",
    description="""
## 🚀 UnifiedWork - AI-Powered Unified Workspace

A comprehensive platform that brings together all tech roles with specialized AI assistants.

### 7 Specialized Communities

1. **🎯 QA Engineers** → QualityGPT - Test automation, scenarios, bug analysis
2. **🔧 Backend Developers** → BackendGPT - API design, database optimization
3. **🎨 Frontend Developers** → FrontendGPT - React/Vue/Angular, mobile apps
4. **✨ UI/UX Designers** → DesignGPT - Design systems, accessibility
5. **📊 Product Managers** → ProductGPT - Requirements, user stories
6. **🔐 DevOps Engineers** → OpsGPT - CI/CD, infrastructure
7. **📝 Technical Writers** → DocsGPT - Documentation, tutorials

### Features

- 🏢 **Multi-Tenant Architecture** - Complete organization isolation
- 🔐 **Role-Based Access Control** - Super Admin, Org Admin, User roles
- 🤖 **7 Specialized AI Agents** - Expert assistance for each tech role
- 📊 **Subscription Plans** - FREE, BASIC, PREMIUM, ENTERPRISE
- 🎨 **Custom Branding** - Organization-specific themes and colors
- 📈 **Usage Analytics** - Track usage across teams and projects
- 🔑 **Flexible API Keys** - Per-organization LLM configuration

### Authentication

Most endpoints require JWT Bearer token authentication:
```
Authorization: Bearer <your_jwt_token>
```
""",
    version="3.0.0",
    openapi_tags=[
        {"name": "Authentication", "description": "User authentication and registration"},
        {"name": "Communities", "description": "Community-specific chat interfaces"},
        {"name": "Organizations", "description": "Multi-tenant organization management"},
        {"name": "Chat", "description": "AI-powered chat with specialized agents"},
        {"name": "Admin", "description": "Administrative endpoints"},
        {"name": "Health", "description": "System health monitoring"}
    ]
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global agent instances - One for each community
agents = {
    "qa": None,
    "backend": None,
    "frontend": None,
    "design": None,
    "product": None,
    "devops": None,
    "docs": None
}

@app.on_event("startup")
async def startup_event():
    """Initialize database and AI agents on startup"""
    global agents
    
    # Initialize database
    try:
        init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize database: {e}")
    
    # Initialize all AI agents
    try:
        agents["qa"] = QAAgent()
        agents["backend"] = BackendAgent()
        agents["frontend"] = FrontendAgent()
        agents["design"] = DesignAgent()
        agents["product"] = ProductAgent()
        agents["devops"] = DevOpsAgent()
        agents["docs"] = DocsAgent()
        print("✅ All AI Agents initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize agents: {e}")

# Pydantic models
class LoginRequest(BaseModel):
    username: str
    password: str
    organization_slug: Optional[str] = None

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    organization_slug: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ChatMessage(BaseModel):
    message: str
    community: str  # qa, backend, frontend, design, product, devops, docs

class ChatResponse(BaseModel):
    response: str
    timestamp: str
    agent: str

# Authentication endpoints
@app.post("/api/auth/login", response_model=TokenResponse, tags=["Authentication"])
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login with multi-tenant support"""
    user = authenticate_user(
        db, 
        login_data.username, 
        login_data.password,
        login_data.organization_slug
    )
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if organization is blocked
    if user.organization_id:
        org = db.query(Organization).filter(Organization.id == user.organization_id).first()
        if org and not org.is_active:
            raise HTTPException(
                status_code=403, 
                detail="Your organization has been blocked. Please contact support."
            )
    
    user.last_login = datetime.utcnow()
    db.commit()
    
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "username": user.username,
            "role": user.role.value,
            "organization_id": user.organization_id
        }
    )
    
    org_info = None
    if user.organization:
        org_info = {
            "id": user.organization.id,
            "name": user.organization.name,
            "slug": user.organization.slug,
            "subscription_plan": user.organization.subscription_plan.value
        }
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "organization": org_info
        }
    )

@app.get("/api/auth/me", tags=["Authentication"])
async def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user information"""
    # Get organization info
    org_info = None
    if current_user.organization_id:
        org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
        if org:
            org_info = {
                "id": org.id,
                "name": org.name,
                "slug": org.slug,
                "subscription_plan": org.subscription_plan.value
            }
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "organization": org_info
    }

@app.post("/api/auth/register", response_model=TokenResponse, tags=["Authentication"])
async def register(register_data: RegisterRequest, db: Session = Depends(get_db)):
    """Register new user with organization support"""
    # Check if email exists
    if db.query(User).filter(User.email == register_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Get organization
    organization_id = None
    if register_data.organization_slug:
        org = get_organization_from_subdomain(register_data.organization_slug, db)
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        if not org.is_active:
            raise HTTPException(
                status_code=403, 
                detail="Organization is blocked. New registrations are not allowed."
            )
        
        # Check user limit
        user_count = db.query(User).filter(User.organization_id == org.id).count()
        if user_count >= org.max_users:
            raise HTTPException(
                status_code=403, 
                detail=f"Organization has reached maximum users ({org.max_users})"
            )
        organization_id = org.id
    
    # Create new user
    new_user = User(
        username=register_data.username,
        email=register_data.email,
        hashed_password=User.hash_password(register_data.password),
        full_name=register_data.full_name,
        role=UserRole.USER,
        organization_id=organization_id,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token = create_access_token(
        data={
            "user_id": new_user.id,
            "username": new_user.username,
            "role": new_user.role.value,
            "organization_id": new_user.organization_id
        }
    )
    
    org_info = None
    if new_user.organization:
        org_info = {
            "id": new_user.organization.id,
            "name": new_user.organization.name,
            "slug": new_user.organization.slug,
            "subscription_plan": new_user.organization.subscription_plan.value
        }
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role.value,
            "organization": org_info
        }
    )

@app.post("/api/auth/register-org-admin", response_model=TokenResponse, tags=["Authentication"])
async def register_org_admin(register_data: dict, db: Session = Depends(get_db)):
    """Register as organization admin using access token"""
    
    # Validate required fields
    required_fields = ["access_token", "username", "email", "password", "full_name"]
    for field in required_fields:
        if field not in register_data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # Find organization by access token
    org = db.query(Organization).filter(
        Organization.access_token == register_data["access_token"]
    ).first()
    
    if not org:
        raise HTTPException(status_code=400, detail="Invalid access token")
    
    if not org.is_active:
        raise HTTPException(status_code=403, detail="Organization is not active")
    
    # Check if organization already has an admin
    existing_admin = db.query(User).filter(
        User.organization_id == org.id,
        User.role == UserRole.ORG_ADMIN
    ).first()
    
    if existing_admin:
        raise HTTPException(status_code=403, detail="Organization already has an administrator")
    
    # Check if email already exists
    if db.query(User).filter(User.email == register_data["email"]).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username exists within organization
    if db.query(User).filter(
        User.username == register_data["username"],
        User.organization_id == org.id
    ).first():
        raise HTTPException(status_code=400, detail="Username already taken in this organization")
    
    # Create org admin user
    new_user = User(
        username=register_data["username"],
        email=register_data["email"],
        hashed_password=User.hash_password(register_data["password"]),
        full_name=register_data["full_name"],
        role=UserRole.ORG_ADMIN,
        organization_id=org.id,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create JWT token
    access_token = create_access_token(
        data={
            "user_id": new_user.id,
            "username": new_user.username,
            "role": new_user.role.value,
            "organization_id": org.id
        }
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role.value,
            "organization": {
                "id": org.id,
                "name": org.name,
                "slug": org.slug,
                "subscription_plan": org.subscription_plan.value
            }
        }
    )


@app.post("/api/auth/register-user", response_model=TokenResponse, tags=["Authentication"])
async def register_org_user(register_data: dict, db: Session = Depends(get_db)):
    """Register as regular user within an organization"""
    
    # Validate required fields
    required_fields = ["organization_slug", "username", "email", "password", "full_name"]
    for field in required_fields:
        if field not in register_data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # Find organization by slug
    org = db.query(Organization).filter(
        Organization.slug == register_data["organization_slug"]
    ).first()
    
    if not org:
        raise HTTPException(status_code=400, detail="Organization not found")
    
    if not org.is_active:
        raise HTTPException(status_code=403, detail="Organization is not active")
    
    # Check user limit
    user_count = db.query(User).filter(User.organization_id == org.id).count()
    if user_count >= org.max_users:
        raise HTTPException(
            status_code=403,
            detail=f"Organization has reached maximum user limit ({org.max_users})"
        )
    
    # Check if email already exists
    if db.query(User).filter(User.email == register_data["email"]).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username exists within organization
    if db.query(User).filter(
        User.username == register_data["username"],
        User.organization_id == org.id
    ).first():
        raise HTTPException(status_code=400, detail="Username already taken in this organization")
    
    # Create regular user
    new_user = User(
        username=register_data["username"],
        email=register_data["email"],
        hashed_password=User.hash_password(register_data["password"]),
        full_name=register_data["full_name"],
        role=UserRole.USER,
        organization_id=org.id,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create JWT token
    access_token = create_access_token(
        data={
            "user_id": new_user.id,
            "username": new_user.username,
            "role": new_user.role.value,
            "organization_id": org.id
        }
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role.value,
            "organization": {
                "id": org.id,
                "name": org.name,
                "slug": org.slug,
                "subscription_plan": org.subscription_plan.value
            }
        }
    )

# Community-specific chat endpoints
@app.post("/api/communities/{community_id}/chat", response_model=ChatResponse, tags=["Communities"])
async def community_chat(
    community_id: str,
    chat_message: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat with community-specific AI agent"""
    
    # Validate community
    valid_communities = ["qa", "backend", "frontend", "design", "product", "devops", "docs"]
    if community_id not in valid_communities:
        raise HTTPException(status_code=404, detail="Community not found")
    
    # Get agent for community
    agent = agents.get(community_id)
    if not agent:
        raise HTTPException(status_code=503, detail=f"{community_id.title()} agent not initialized")
    
    # Check organization chat limit
    if current_user.organization_id:
        org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
        if org:
            chat_count = db.query(ChatSession).filter(
                ChatSession.organization_id == org.id
            ).count()
            if chat_count >= org.max_chat_sessions:
                raise HTTPException(
                    status_code=403,
                    detail=f"Organization has reached maximum chat sessions ({org.max_chat_sessions})"
                )
    
    try:
        # Process message with appropriate agent
        response = agent.process_query(chat_message.message)
        
        # Save to database
        chat_session = ChatSession(
            user_id=current_user.id,
            organization_id=current_user.organization_id,
            community=community_id,
            message=chat_message.message,
            response=response
        )
        db.add(chat_session)
        db.commit()
        
        # Map community to agent name
        agent_names = {
            "qa": "QualityGPT",
            "backend": "BackendGPT", 
            "frontend": "FrontendGPT",
            "design": "DesignGPT",
            "product": "ProductGPT",
            "devops": "OpsGPT",
            "docs": "DocsGPT"
        }
        
        return ChatResponse(
            response=response,
            timestamp=datetime.utcnow().isoformat(),
            agent=agent_names.get(community_id, f"{community_id.title()}GPT")
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

# Get community examples
@app.get("/api/communities/{community_id}/examples", tags=["Communities"])
async def get_community_examples(community_id: str):
    """Get example queries for specific community"""
    
    examples_data = {
        "qa": {
            "agent": "QualityGPT",
            "examples": [
                {
                    "category": "Generate Tests",
                    "queries": [
                        "Generate a Playwright test for login functionality",
                        "Create a test for adding items to shopping cart",
                        "Generate an API test for user registration"
                    ]
                },
                {
                    "category": "Learn Concepts", 
                    "queries": [
                        "What is Page Object Model?",
                        "Explain test automation best practices",
                        "What are locators and selectors?"
                    ]
                }
            ]
        },
        "backend": {
            "agent": "BackendGPT",
            "examples": [
                {
                    "category": "API Development",
                    "queries": [
                        "Create a REST API for user management",
                        "Design endpoints for e-commerce platform",
                        "Implement GraphQL schema for blog"
                    ]
                },
                {
                    "category": "Database Design",
                    "queries": [
                        "Design database schema for social media app",
                        "Optimize slow MySQL queries",
                        "Implement database migrations with Alembic"
                    ]
                }
            ]
        },
        "frontend": {
            "agent": "FrontendGPT", 
            "examples": [
                {
                    "category": "React Development",
                    "queries": [
                        "Create a reusable React component library",
                        "Implement state management with Redux",
                        "Build responsive navigation component"
                    ]
                },
                {
                    "category": "Mobile Development",
                    "queries": [
                        "Create React Native navigation stack",
                        "Implement push notifications in Flutter",
                        "Build cross-platform form component"
                    ]
                }
            ]
        },
        "design": {
            "agent": "DesignGPT",
            "examples": [
                {
                    "category": "Design Systems", 
                    "queries": [
                        "Create a comprehensive button component library",
                        "Design consistent color palette for brand",
                        "Build accessible form design patterns"
                    ]
                },
                {
                    "category": "User Experience",
                    "queries": [
                        "Design onboarding flow for SaaS app",
                        "Create user journey for e-commerce checkout",
                        "Improve mobile app navigation UX"
                    ]
                }
            ]
        },
        "product": {
            "agent": "ProductGPT",
            "examples": [
                {
                    "category": "Requirements",
                    "queries": [
                        "Write product requirements for chat feature",
                        "Create acceptance criteria for user login",
                        "Define API specifications for mobile app"
                    ]
                },
                {
                    "category": "Strategy",
                    "queries": [
                        "Plan Q1 product roadmap for SaaS platform",
                        "Define success metrics for new feature",
                        "Create competitive analysis framework"
                    ]
                }
            ]
        },
        "devops": {
            "agent": "OpsGPT",
            "examples": [
                {
                    "category": "CI/CD",
                    "queries": [
                        "Set up GitHub Actions pipeline for Node.js",
                        "Create Docker deployment for React app",
                        "Implement automated testing in CI pipeline"
                    ]
                },
                {
                    "category": "Infrastructure",
                    "queries": [
                        "Deploy scalable architecture on AWS",
                        "Set up Kubernetes cluster monitoring",
                        "Implement infrastructure as code with Terraform"
                    ]
                }
            ]
        },
        "docs": {
            "agent": "DocsGPT",
            "examples": [
                {
                    "category": "API Documentation",
                    "queries": [
                        "Write comprehensive API documentation for REST endpoints",
                        "Create developer onboarding guide",
                        "Document GraphQL schema with examples"
                    ]
                },
                {
                    "category": "User Guides",
                    "queries": [
                        "Create step-by-step tutorial for beginners",
                        "Write troubleshooting guide for common issues",
                        "Design documentation site structure"
                    ]
                }
            ]
        }
    }
    
    if community_id not in examples_data:
        raise HTTPException(status_code=404, detail="Community not found")
    
    return examples_data[community_id]

# Health check
@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    agent_status = {name: agent is not None for name, agent in agents.items()}
    all_healthy = all(agent_status.values())
    
    return {
        "status": "healthy" if all_healthy else "partial",
        "agents": agent_status,
        "timestamp": datetime.now().isoformat()
    }

# ==================== ORGANIZATION MANAGEMENT APIs ====================

@app.post("/api/organizations", status_code=201, tags=["Organizations"])
async def create_organization(
    org_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_super_admin_user)
):
    """Create a new organization (Super Admin only)"""
    required_fields = ["name", "slug"]
    for field in required_fields:
        if field not in org_data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # Check if slug already exists
    if db.query(Organization).filter(Organization.slug == org_data["slug"]).first():
        raise HTTPException(status_code=400, detail="Organization slug already exists")
    
    # Validate subscription plan
    subscription_plan = org_data.get("subscription_plan", "free").upper()
    try:
        plan = SubscriptionPlan[subscription_plan]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid subscription plan")
    
    new_org = Organization(
        name=org_data["name"],
        slug=org_data["slug"],
        description=org_data.get("description"),
        subscription_plan=plan,
        max_users=org_data.get("max_users", 10),
        max_chat_sessions=org_data.get("max_chat_sessions", 1000),
        access_token=Organization.generate_access_token(),
        is_active=True
    )
    
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    
    return {
        "id": new_org.id,
        "name": new_org.name,
        "slug": new_org.slug,
        "subscription_plan": new_org.subscription_plan.value,
        "access_token": new_org.access_token,
        "created_at": new_org.created_at.isoformat()
    }


@app.get("/api/organizations", tags=["Organizations"])
async def list_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_super_admin_user),
    skip: int = 0,
    limit: int = 100
):
    """List all organizations (Super Admin only)"""
    orgs = db.query(Organization).offset(skip).limit(limit).all()
    
    result = []
    for org in orgs:
        user_count = db.query(User).filter(User.organization_id == org.id).count()
        chat_count = db.query(ChatSession).filter(ChatSession.organization_id == org.id).count()
        
        result.append({
            "id": org.id,
            "name": org.name,
            "slug": org.slug,
            "description": org.description,
            "subscription_plan": org.subscription_plan.value,
            "is_active": org.is_active,
            "user_count": user_count,
            "chat_count": chat_count,
            "max_users": org.max_users,
            "max_chat_sessions": org.max_chat_sessions,
            "access_token": org.access_token,
            "created_at": org.created_at.isoformat()
        })
    
    return result


@app.get("/api/organizations/my-organization", tags=["Organizations"])
async def get_my_organization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's organization info"""
    if not current_user.organization_id:
        return {"message": "User not associated with any organization"}
    
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    user_count = db.query(User).filter(User.organization_id == org.id).count()
    chat_count = db.query(ChatSession).filter(ChatSession.organization_id == org.id).count()
    
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "description": org.description,
        "subscription_plan": org.subscription_plan.value,
        "primary_color": org.primary_color,
        "logo_url": org.logo_url,
        "user_count": user_count,
        "chat_count": chat_count,
        "max_users": org.max_users,
        "max_chat_sessions": org.max_chat_sessions,
        "is_active": org.is_active
    }


@app.get("/api/organizations/{org_id}", tags=["Organizations"])
async def get_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_super_admin_user)
):
    """Get organization by ID (Super Admin only)"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    user_count = db.query(User).filter(User.organization_id == org.id).count()
    chat_count = db.query(ChatSession).filter(ChatSession.organization_id == org.id).count()
    
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "description": org.description,
        "subscription_plan": org.subscription_plan.value,
        "max_users": org.max_users,
        "max_chat_sessions": org.max_chat_sessions,
        "primary_color": org.primary_color,
        "logo_url": org.logo_url,
        "is_active": org.is_active,
        "access_token": org.access_token,
        "user_count": user_count,
        "chat_count": chat_count,
        "created_at": org.created_at.isoformat(),
        "updated_at": org.updated_at.isoformat()
    }


@app.put("/api/organizations/{org_id}", tags=["Organizations"])
async def update_organization(
    org_id: int,
    org_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_org_admin_user)
):
    """Update organization (Org Admin or Super Admin)"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Verify user has permission to update this org
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.organization_id != org_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this organization")
    
    # Update fields
    if "name" in org_data:
        org.name = org_data["name"]
    if "description" in org_data:
        org.description = org_data["description"]
    if "subscription_plan" in org_data:
        try:
            org.subscription_plan = SubscriptionPlan[org_data["subscription_plan"].upper()]
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid subscription plan")
    if "max_users" in org_data:
        org.max_users = org_data["max_users"]
    if "max_chat_sessions" in org_data:
        org.max_chat_sessions = org_data["max_chat_sessions"]
    if "is_active" in org_data:
        org.is_active = org_data["is_active"]
    if "primary_color" in org_data:
        org.primary_color = org_data["primary_color"]
    if "logo_url" in org_data:
        org.logo_url = org_data["logo_url"]
    
    db.commit()
    db.refresh(org)
    
    return {"message": "Organization updated successfully", "id": org.id}


@app.patch("/api/organizations/{org_id}/subscription", tags=["Organizations"])
async def update_subscription_plan(
    org_id: int,
    plan_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_super_admin_user)
):
    """Update organization subscription plan (Super Admin only)"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Validate subscription plan
    plan_name = plan_data.get("subscription_plan", "").upper()
    if plan_name not in ["FREE", "BASIC", "PREMIUM", "ENTERPRISE"]:
        raise HTTPException(status_code=400, detail="Invalid subscription plan")
    
    # Update subscription plan
    old_plan = org.subscription_plan.value
    org.subscription_plan = SubscriptionPlan[plan_name]
    
    # Auto-update limits based on plan
    plan_limits = {
        "FREE": {"max_users": 10, "max_chat_sessions": 1000},
        "BASIC": {"max_users": 20, "max_chat_sessions": 5000},
        "PREMIUM": {"max_users": 50, "max_chat_sessions": 25000},
        "ENTERPRISE": {"max_users": 100, "max_chat_sessions": 50000}
    }
    
    limits = plan_limits.get(plan_name, plan_limits["FREE"])
    org.max_users = limits["max_users"]
    org.max_chat_sessions = limits["max_chat_sessions"]
    
    db.commit()
    db.refresh(org)
    
    return {
        "message": "Subscription plan updated successfully",
        "organization": org.name,
        "old_plan": old_plan,
        "new_plan": org.subscription_plan.value,
        "max_users": org.max_users,
        "max_chat_sessions": org.max_chat_sessions
    }


@app.delete("/api/organizations/{org_id}", tags=["Organizations"])
async def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_super_admin_user)
):
    """Delete organization (Super Admin only)"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Delete all users in organization
    db.query(User).filter(User.organization_id == org_id).delete()
    
    # Delete all chat sessions
    db.query(ChatSession).filter(ChatSession.organization_id == org_id).delete()
    
    # Delete organization
    db.delete(org)
    db.commit()
    
    return {"message": "Organization deleted successfully"}


@app.get("/api/organizations/{org_id}/users", tags=["Organizations"])
async def list_organization_users(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_org_admin_user)
):
    """List all users in an organization"""
    # Verify user has permission
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.organization_id != org_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    users = db.query(User).filter(User.organization_id == org_id).all()
    
    return [{
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat(),
        "last_login": user.last_login.isoformat() if user.last_login else None
    } for user in users]


@app.post("/api/organizations/{org_id}/users", tags=["Organizations"])
async def create_organization_user(
    org_id: int,
    user_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_org_admin_user)
):
    """Create a new user in an organization (Org Admin or Super Admin)"""
    # Verify user has permission
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.organization_id != org_id:
            raise HTTPException(status_code=403, detail="Not authorized to create users in this organization")
    
    # Get organization
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    if not org.is_active:
        raise HTTPException(status_code=403, detail="Organization is not active")
    
    # Check user limit
    user_count = db.query(User).filter(User.organization_id == org_id).count()
    if user_count >= org.max_users:
        raise HTTPException(
            status_code=403,
            detail=f"Organization has reached maximum user limit ({org.max_users})"
        )
    
    # Validate required fields
    required_fields = ["username", "email", "password", "full_name"]
    for field in required_fields:
        if field not in user_data or not user_data[field]:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # Check if email already exists
    if db.query(User).filter(User.email == user_data["email"]).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username exists within organization
    if db.query(User).filter(
        User.username == user_data["username"],
        User.organization_id == org_id
    ).first():
        raise HTTPException(status_code=400, detail="Username already taken in this organization")
    
    # Determine user role (org_admins can only create regular users, not other admins)
    user_role = UserRole.USER
    if current_user.role == UserRole.SUPER_ADMIN and user_data.get("role"):
        # Super admins can specify role
        role_value = user_data["role"].upper()
        if role_value in ["ORG_ADMIN", "USER"]:
            user_role = UserRole[role_value]
    
    # Create new user
    new_user = User(
        username=user_data["username"],
        email=user_data["email"],
        hashed_password=User.hash_password(user_data["password"]),
        full_name=user_data["full_name"],
        role=user_role,
        organization_id=org_id,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "User created successfully",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role.value,
            "organization_id": new_user.organization_id,
            "is_active": new_user.is_active
        }
    }


@app.patch("/api/organizations/{org_id}/block", tags=["Organizations"])
async def block_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_super_admin_user)
):
    """Block an organization (Super Admin only)"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    if org.id == 1:
        raise HTTPException(status_code=403, detail="Cannot block default organization")
    
    org.is_active = False
    db.commit()
    db.refresh(org)
    
    return {
        "message": "Organization blocked successfully",
        "organization": {
            "id": org.id,
            "name": org.name,
            "is_active": org.is_active
        }
    }


@app.patch("/api/organizations/{org_id}/unblock", tags=["Organizations"])
async def unblock_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_super_admin_user)
):
    """Unblock an organization (Super Admin only)"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    org.is_active = True
    db.commit()
    db.refresh(org)
    
    return {
        "message": "Organization unblocked successfully",
        "organization": {
            "id": org.id,
            "name": org.name,
            "is_active": org.is_active
        }
    }


@app.get("/api/organizations/{org_id}/stats", tags=["Organizations"])
async def get_organization_stats(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_org_admin_user)
):
    """Get organization statistics"""
    # Verify user has permission
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.organization_id != org_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    total_users = db.query(User).filter(User.organization_id == org_id).count()
    active_users = db.query(User).filter(
        User.organization_id == org_id,
        User.is_active == True
    ).count()
    total_chats = db.query(ChatSession).filter(ChatSession.organization_id == org_id).count()
    
    admin_count = db.query(User).filter(
        User.organization_id == org_id,
        User.role == UserRole.ORG_ADMIN
    ).count()
    
    return {
        "organization_name": org.name,
        "subscription_plan": org.subscription_plan.value,
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "admin_count": admin_count,
        "total_chats": total_chats,
        "max_users": org.max_users,
        "max_chat_sessions": org.max_chat_sessions,
        "usage_percentage": {
            "users": round((total_users / org.max_users) * 100, 2) if org.max_users > 0 else 0,
            "chats": round((total_chats / org.max_chat_sessions) * 100, 2) if org.max_chat_sessions > 0 else 0
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
