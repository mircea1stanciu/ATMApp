"""
Core database models and configuration for UnifiedWork
Multi-tenant architecture with organization isolation
"""
from datetime import datetime
from typing import Optional
import enum
import secrets
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Enum, ForeignKey, Text, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from passlib.context import CryptContext

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./unifiedwork.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def simple_hash_password(password: str) -> str:
    """Simple password hashing as fallback"""
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

def simple_verify_password(password: str, hashed: str) -> bool:
    """Simple password verification as fallback"""
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest() == hashed


class UserRole(enum.Enum):
    """User role enumeration"""
    SUPER_ADMIN = "super_admin"      # Platform administrator
    ORG_ADMIN = "org_admin"          # Organization administrator
    COMMUNITY_LEAD = "community_lead"  # Community leader/moderator
    USER = "user"                    # Regular user


class SubscriptionPlan(enum.Enum):
    """Subscription plan types with limits"""
    FREE = "free"            # 10 users, 1,000 chats/month
    BASIC = "basic"          # 20 users, 5,000 chats/month
    PREMIUM = "premium"      # 50 users, 25,000 chats/month
    ENTERPRISE = "enterprise"  # Unlimited


class UserStatus(enum.Enum):
    """User online status for messaging"""
    ONLINE = "online"
    AWAY = "away"
    OFFLINE = "offline"


class MessageType(enum.Enum):
    """Message type enumeration"""
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"


class Organization(Base):
    """Organization/Tenant model for multi-tenancy"""
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    domain = Column(String, unique=True, nullable=True)
    description = Column(Text, nullable=True)
    
    # Access token for organization registration
    access_token = Column(String, unique=True, index=True, nullable=False)
    
    # Subscription and limits
    subscription_plan = Column(Enum(SubscriptionPlan), default=SubscriptionPlan.FREE, nullable=False)
    max_users = Column(Integer, default=10)
    max_chat_sessions = Column(Integer, default=1000)
    
    # Branding
    logo_url = Column(String, nullable=True)
    primary_color = Column(String, default="#2563eb")
    secondary_color = Column(String, default="#64748b")
    
    # API Configuration per organization
    openai_api_key = Column(String, nullable=True)
    anthropic_api_key = Column(String, nullable=True)
    preferred_llm = Column(String, default="openai")
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="organization")
    chat_sessions = relationship("ChatSession", back_populates="organization")
    
    @staticmethod
    def generate_access_token() -> str:
        """Generate secure access token"""
        return secrets.token_urlsafe(32)
    
    @property
    def plan_limits(self) -> dict:
        """Get limits based on subscription plan"""
        limits = {
            SubscriptionPlan.FREE: {"users": 10, "chats": 1000},
            SubscriptionPlan.BASIC: {"users": 20, "chats": 5000},
            SubscriptionPlan.PREMIUM: {"users": 50, "chats": 25000},
            SubscriptionPlan.ENTERPRISE: {"users": -1, "chats": -1}  # Unlimited
        }
        return limits.get(self.subscription_plan, limits[SubscriptionPlan.FREE])


class User(Base):
    """User model with multi-tenant support"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Multi-tenancy
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    # Community Lead assignment (which communities they manage)
    assigned_communities = Column(String, nullable=True)  # JSON string: ["qa", "backend"]
    
    # User preferences
    preferred_communities = Column(String, nullable=True)  # JSON string of community preferences
    theme_preference = Column(String, default="system")  # light, dark, system
    preferred_ai_model = Column(String, default="gpt-4o-mini")  # User's preferred AI model
    ai_model_provider = Column(String, default="openai")  # openai or anthropic
    ai_temperature = Column(String, default="0.7")  # AI creativity level (0.0-1.0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    chat_sessions = relationship("ChatSession", back_populates="user")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id")
    conversation_participations = relationship("ConversationParticipant")

    def verify_password(self, password: str) -> bool:
        """Verify password against hash"""
        try:
            return pwd_context.verify(password, self.hashed_password)
        except:
            # Fallback to simple hash verification
            return simple_verify_password(password, self.hashed_password)

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password"""
        try:
            return pwd_context.hash(password)
        except:
            # Fallback to simple hash
            return simple_hash_password(password)


class ChatSession(Base):
    """Chat session history with community context"""
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), index=True)
    
    # Community context
    community = Column(String, nullable=False)  # qa, backend, frontend, etc.
    agent_name = Column(String, nullable=False)  # QualityGPT, BackendGPT, etc.
    
    # Chat content
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    model_used = Column(String, default="gpt-4o-mini")  # Which AI model was used
    model_id = Column(String, nullable=True)       # Model ID (e.g., "gpt-4", "claude-3-opus")
    model_provider = Column(String, nullable=True) # openai or anthropic
    
    # Metadata
    response_time_ms = Column(Integer, nullable=True)  # Response time in milliseconds
    tokens_used = Column(Integer, nullable=True)       # Tokens consumed (for billing)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    organization = relationship("Organization", back_populates="chat_sessions")


class UserPresence(Base):
    """User presence tracking for real-time messaging"""
    __tablename__ = "user_presence"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), index=True, nullable=False)
    
    # Presence data
    status = Column(Enum(UserStatus), default=UserStatus.OFFLINE, nullable=False)
    last_seen = Column(DateTime, default=datetime.utcnow)
    is_typing = Column(Boolean, default=False)
    typing_in_conversation = Column(Integer, nullable=True)  # conversation_id if typing
    
    # Connection tracking
    socket_id = Column(String, nullable=True)  # For WebSocket connection tracking
    
    # Timestamps
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    organization = relationship("Organization")
    
    # Ensure one presence record per user per organization
    __table_args__ = (UniqueConstraint('user_id', 'organization_id', name='_user_org_presence_uc'),)


class Conversation(Base):
    """Conversation between users in an organization"""
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), index=True, nullable=False)
    
    # Conversation metadata
    name = Column(String, nullable=True)  # Optional conversation name for group chats
    is_group = Column(Boolean, default=False)  # True for group conversations
    
    # Last activity tracking
    last_message_id = Column(Integer, nullable=True)
    last_activity = Column(DateTime, default=datetime.utcnow)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization")
    participants = relationship("ConversationParticipant", back_populates="conversation")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")


class ConversationParticipant(Base):
    """Participants in a conversation"""
    __tablename__ = "conversation_participants"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    
    # Participant metadata
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_read_message_id = Column(Integer, nullable=True)  # For unread count
    is_active = Column(Boolean, default=True)  # Can leave/rejoin conversations
    
    # Notifications
    muted = Column(Boolean, default=False)
    
    # Timestamps
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User")
    
    # Ensure unique participant per conversation
    __table_args__ = (UniqueConstraint('conversation_id', 'user_id', name='_conversation_user_uc'),)


class Message(Base):
    """Individual messages in conversations"""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), index=True, nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    
    # Message content
    content = Column(Text, nullable=False)
    message_type = Column(Enum(MessageType), default=MessageType.TEXT, nullable=False)
    
    # File/media metadata (if applicable)
    file_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String, nullable=True)
    
    # Message metadata
    edited = Column(Boolean, default=False)
    edited_at = Column(DateTime, nullable=True)
    
    # Threading (for replies)
    reply_to_message_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")
    reply_to = relationship("Message", remote_side=[id])  # Self-referential for replies
    
    # Index for efficient message retrieval
    __table_args__ = (
        {'extend_existing': True}
    )


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database and create default data"""
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create default organization
        default_org = db.query(Organization).filter(Organization.slug == "unifiedwork").first()
        if not default_org:
            default_org = Organization(
                name="UnifiedWork",
                slug="unifiedwork",
                description="Default organization for UnifiedWork platform",
                subscription_plan=SubscriptionPlan.ENTERPRISE,
                max_users=100,
                max_chat_sessions=50000,
                access_token=Organization.generate_access_token(),
                primary_color="#2563eb",
                secondary_color="#64748b"
            )
            db.add(default_org)
            db.commit()
            db.refresh(default_org)
            print("✅ Default organization created")
            print(f"   Access Token: {default_org.access_token}")
        
        # Create super admin user
        super_admin = db.query(User).filter(User.email == "admin@unifiedwork.com").first()
        if not super_admin:
            try:
                super_admin = User(
                    username="admin",
                    email="admin@unifiedwork.com",
                    hashed_password=User.hash_password("admin123"),
                    full_name="UnifiedWork Administrator",
                    role=UserRole.SUPER_ADMIN,
                    organization_id=default_org.id,
                    is_active=True
                )
                db.add(super_admin)
                db.commit()
                print("✅ Super admin created (username: admin, password: admin123)")
            except Exception as e:
                print(f"❌ Error creating super admin: {e}")
        
        # Create demo organization
        demo_org = db.query(Organization).filter(Organization.slug == "demo").first()
        if not demo_org:
            demo_org = Organization(
                name="Demo Company",
                slug="demo",
                description="Demo organization for testing UnifiedWork",
                subscription_plan=SubscriptionPlan.PREMIUM,
                max_users=25,
                max_chat_sessions=10000,
                access_token=Organization.generate_access_token(),
                primary_color="#7c3aed",
                secondary_color="#a855f7"
            )
            db.add(demo_org)
            db.commit()
            db.refresh(demo_org)
            print("✅ Demo organization created")
            print(f"   Access Token: {demo_org.access_token}")
            
            # Create demo users for each community
            demo_users = [
                {"username": "qa_engineer", "email": "qa@demo.com", "full_name": "QA Engineer"},
                {"username": "backend_dev", "email": "backend@demo.com", "full_name": "Backend Developer"},
                {"username": "frontend_dev", "email": "frontend@demo.com", "full_name": "Frontend Developer"},
                {"username": "ui_designer", "email": "design@demo.com", "full_name": "UI/UX Designer"},
                {"username": "product_manager", "email": "product@demo.com", "full_name": "Product Manager"},
                {"username": "devops_engineer", "email": "devops@demo.com", "full_name": "DevOps Engineer"},
                {"username": "tech_writer", "email": "docs@demo.com", "full_name": "Technical Writer"},
            ]
            
            for user_data in demo_users:
                if not db.query(User).filter(User.email == user_data["email"]).first():
                    demo_user = User(
                        username=user_data["username"],
                        email=user_data["email"],
                        hashed_password=User.hash_password("demo123"),
                        full_name=user_data["full_name"],
                        role=UserRole.USER,
                        organization_id=demo_org.id,
                        is_active=True
                    )
                    db.add(demo_user)
            
            db.commit()
            print("✅ Demo users created (password: demo123)")
            
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()
