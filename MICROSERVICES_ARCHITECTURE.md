# 🏗️ Microservices Architecture - UnifiedWork

## 📋 Current State Analysis

**Current Architecture:** Monolithic FastAPI application (~1,316 lines in main.py)

**Key Components:**
- ✅ Authentication & Authorization
- ✅ Organization Management (Multi-tenant)
- ✅ User Management (RBAC - 4 roles)
- ✅ 7 AI Agents (Community-specific)
- ✅ Chat Sessions
- ✅ Subscription Plans
- ✅ Database (SQLite/PostgreSQL)

---

## 🎯 Recommended Microservices Architecture

### **Phase 1: Core Services Split** (Recommended Starting Point)

```
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (Kong/NGINX)                    │
│                     Port 8000 - Single Entry Point               │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ├─────────────────────────────────┐
                                  │                                 │
                    ┌─────────────▼──────────────┐    ┌────────────▼─────────────┐
                    │  Auth Service              │    │  Organization Service    │
                    │  Port: 8001                │    │  Port: 8002              │
                    │  ─────────────             │    │  ─────────────           │
                    │  • Login/Register          │    │  • Org CRUD              │
                    │  • JWT Management          │    │  • Subscription Plans    │
                    │  • Token Validation        │    │  • Blocking/Unblocking   │
                    │  • /api/auth/*             │    │  • /api/organizations/*  │
                    │                            │    │                          │
                    │  DB: auth_db (PostgreSQL)  │    │  DB: org_db (PostgreSQL) │
                    └────────────────────────────┘    └──────────────────────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
       ┌────────────▼─────────────┐  ┌──────────▼────────────────┐
       │  User Service            │  │  AI Agent Service         │
       │  Port: 8003              │  │  Port: 8004               │
       │  ─────────────           │  │  ─────────────            │
       │  • User CRUD             │  │  • 7 Community Agents     │
       │  • Role Management       │  │  • Chat Processing        │
       │  • Community Assignment  │  │  • LLM Integration        │
       │  • /api/.../users/*      │  │  • /api/communities/*     │
       │                          │  │                           │
       │  DB: user_db             │  │  DB: chat_db              │
       └──────────────────────────┘  └───────────────────────────┘
```

---

## 📦 Detailed Service Breakdown

### **1. Auth Service** 🔐
**Port:** 8001  
**Responsibility:** Authentication, Authorization, JWT Management

**Endpoints:**
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/register-org-admin
POST   /api/auth/register-user
GET    /api/auth/me
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/validate-token
```

**Database Schema:**
```sql
-- auth_db
TABLE tokens (
  id, user_id, token, expires_at, created_at
)
TABLE sessions (
  id, user_id, ip_address, user_agent, last_activity
)
```

**Dependencies:**
- User Service (to validate user existence)
- Organization Service (for org-based login)

**Tech Stack:**
- FastAPI
- JWT (python-jose)
- bcrypt/passlib
- Redis (session cache)

---

### **2. Organization Service** 🏢
**Port:** 8002  
**Responsibility:** Multi-tenant organization management, subscription plans

**Endpoints:**
```
POST   /api/organizations                    # Create org
GET    /api/organizations                    # List all (Super Admin)
GET    /api/organizations/{org_id}           # Get org details
PUT    /api/organizations/{org_id}           # Update org
DELETE /api/organizations/{org_id}           # Delete org
PATCH  /api/organizations/{org_id}/subscription
PATCH  /api/organizations/{org_id}/block
PATCH  /api/organizations/{org_id}/unblock
GET    /api/organizations/{org_id}/stats
GET    /api/organizations/my-organization    # Current user's org
```

**Database Schema:**
```sql
-- org_db
TABLE organizations (
  id, name, slug, subscription_plan, is_active, 
  blocked_at, created_at, settings_json
)
TABLE subscription_plans (
  id, name, price, max_users, features_json
)
TABLE organization_settings (
  org_id, theme_colors, custom_domain, api_keys
)
```

**Dependencies:**
- Auth Service (for authentication)
- User Service (for org admin creation)

**Tech Stack:**
- FastAPI
- PostgreSQL
- Redis (caching)

---

### **3. User Service** 👥
**Port:** 8003  
**Responsibility:** User management, RBAC, community assignments

**Endpoints:**
```
GET    /api/organizations/{org_id}/users
POST   /api/organizations/{org_id}/users
GET    /api/organizations/{org_id}/users/{user_id}
PATCH  /api/organizations/{org_id}/users/{user_id}
DELETE /api/organizations/{org_id}/users/{user_id}
GET    /api/users/me
PATCH  /api/users/me
GET    /api/users/{user_id}/communities
PATCH  /api/users/{user_id}/communities
```

**Database Schema:**
```sql
-- user_db
TABLE users (
  id, username, email, password_hash, full_name,
  role, organization_id, assigned_communities,
  is_active, last_login, created_at
)
TABLE user_roles (
  role_name, permissions_json
)
TABLE community_assignments (
  user_id, community_id, assigned_by, assigned_at
)
```

**Dependencies:**
- Auth Service (authentication)
- Organization Service (org validation)

**Tech Stack:**
- FastAPI
- PostgreSQL
- Elasticsearch (user search)

---

### **4. AI Agent Service** 🤖
**Port:** 8004  
**Responsibility:** AI chat processing, 7 specialized agents, LLM integration

**Endpoints:**
```
POST   /api/communities/{community_id}/chat
GET    /api/communities/{community_id}/examples
GET    /api/communities/{community_id}/sessions
GET    /api/communities/{community_id}/sessions/{session_id}
DELETE /api/communities/{community_id}/sessions/{session_id}
POST   /api/agents/configure                  # Configure LLM
GET    /api/agents/models                     # List available models
```

**Database Schema:**
```sql
-- chat_db
TABLE chat_sessions (
  id, user_id, organization_id, community_id,
  agent_type, created_at
)
TABLE chat_messages (
  id, session_id, role, content, timestamp, tokens_used
)
TABLE agent_configurations (
  community_id, model, temperature, max_tokens, system_prompt
)
```

**Dependencies:**
- Auth Service (authentication)
- User Service (community access validation)
- OpenAI/Anthropic APIs

**Tech Stack:**
- FastAPI
- PostgreSQL
- LangChain/LlamaIndex
- OpenAI SDK
- Redis (rate limiting)
- Celery (async processing)

---

## 🔧 Phase 2: Advanced Services (Future)

### **5. Analytics Service** 📊
**Port:** 8005  
**Responsibility:** Usage tracking, metrics, reporting

**Features:**
- Usage statistics per organization
- Token consumption tracking
- User activity analytics
- Custom dashboards

**Tech Stack:** FastAPI, TimescaleDB, ClickHouse, Grafana

---

### **6. Notification Service** 📧
**Port:** 8006  
**Responsibility:** Email, SMS, in-app notifications

**Features:**
- Welcome emails
- Subscription reminders
- Usage alerts
- Chat transcripts

**Tech Stack:** FastAPI, RabbitMQ, SendGrid, Twilio

---

### **7. File Storage Service** 📁
**Port:** 8007  
**Responsibility:** Document upload, chat attachments, exports

**Features:**
- File uploads
- Chat history exports
- Document processing for AI
- S3/MinIO integration

**Tech Stack:** FastAPI, MinIO/S3, PostgreSQL

---

## 🌐 Communication Patterns

### **Synchronous Communication** (REST)
```
Frontend → API Gateway → Microservice
```
**Use Cases:**
- User login
- CRUD operations
- Real-time queries

### **Asynchronous Communication** (Message Queue)
```
Service A → RabbitMQ/Kafka → Service B
```
**Use Cases:**
- Send email after registration
- Process analytics data
- Generate reports
- Long-running AI tasks

### **Service-to-Service Communication**
```python
# Example: User Service calling Org Service
import httpx

async def validate_organization(org_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://org-service:8002/api/organizations/{org_id}",
            headers={"X-Internal-Service": "user-service"}
        )
        return response.json()
```

---

## 🗄️ Database Strategy

### **Option 1: Database per Service** (Recommended)
```
auth_db       → Auth Service
org_db        → Organization Service
user_db       → User Service
chat_db       → AI Agent Service
analytics_db  → Analytics Service
```

**Pros:**
- ✅ True microservices independence
- ✅ Different DB types per service (PostgreSQL, MongoDB, etc.)
- ✅ Easier to scale independently

**Cons:**
- ❌ Data duplication
- ❌ Complex joins require API calls
- ❌ Eventual consistency challenges

---

### **Option 2: Shared Database** (Simpler for Start)
```
unifiedwork_db (PostgreSQL)
├── auth schema
├── organizations schema
├── users schema
└── chat schema
```

**Pros:**
- ✅ Easier to implement
- ✅ ACID transactions
- ✅ Simple queries

**Cons:**
- ❌ Services are coupled
- ❌ Harder to scale independently

---

## 🔐 Security & Authentication Flow

```
┌─────────┐
│ Frontend│
└────┬────┘
     │ 1. POST /api/auth/login
     ▼
┌─────────────┐
│ API Gateway │ ← 2. Route to Auth Service
└─────┬───────┘
      │
      ▼
┌──────────────┐
│ Auth Service │ ← 3. Validate credentials
└──────┬───────┘
       │ 4. Generate JWT
       │
       ▼
┌─────────────┐
│   Redis     │ ← 5. Cache session
└─────────────┘
       │
       │ 6. Return token
       ▼
┌─────────────┐
│  Frontend   │ ← 7. Store token
└─────┬───────┘
      │ 8. Subsequent requests with JWT
      ▼
┌─────────────┐
│ API Gateway │ ← 9. Validate JWT (Auth Service)
└─────┬───────┘
      │ 10. Forward to target service
      ▼
┌──────────────┐
│ Any Service  │ ← 11. Trust validated request
└──────────────┘
```

---

## 🚀 Migration Strategy

### **Step 1: Preparation** (Week 1-2)
- ✅ Set up Docker Compose for multi-service orchestration
- ✅ Create separate folders for each service
- ✅ Define shared models/interfaces
- ✅ Set up API Gateway (Kong/NGINX)

### **Step 2: Extract Auth Service** (Week 3-4)
- ✅ Move auth endpoints to separate service
- ✅ Implement JWT validation middleware
- ✅ Update frontend to use new auth endpoints
- ✅ Test authentication flow

### **Step 3: Extract Organization Service** (Week 5-6)
- ✅ Move organization endpoints
- ✅ Set up org database
- ✅ Implement service-to-service communication
- ✅ Test multi-tenant features

### **Step 4: Extract User Service** (Week 7-8)
- ✅ Move user management endpoints
- ✅ Implement community assignment logic
- ✅ Test RBAC across services

### **Step 5: Extract AI Agent Service** (Week 9-10)
- ✅ Move AI agents to dedicated service
- ✅ Implement async job queue for long-running tasks
- ✅ Scale AI service independently
- ✅ Test chat functionality

### **Step 6: Deploy & Monitor** (Week 11-12)
- ✅ Deploy to Kubernetes/Docker Swarm
- ✅ Set up monitoring (Prometheus, Grafana)
- ✅ Implement distributed tracing (Jaeger)
- ✅ Load testing & optimization

---

## 📁 Project Structure (Microservices)

```
UnifiedWork/
├── services/
│   ├── auth-service/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routes/
│   │   ├── core/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── organization-service/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routes/
│   │   ├── core/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── user-service/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routes/
│   │   ├── core/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── ai-agent-service/
│   │   ├── main.py
│   │   ├── agents/
│   │   │   ├── qa_agent.py
│   │   │   ├── backend_agent.py
│   │   │   ├── frontend_agent.py
│   │   │   ├── design_agent.py
│   │   │   ├── product_agent.py
│   │   │   ├── devops_agent.py
│   │   │   └── docs_agent.py
│   │   ├── routes/
│   │   ├── core/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   └── api-gateway/
│       ├── kong.yml
│       └── nginx.conf
│
├── shared/
│   ├── models/          # Shared data models
│   ├── utils/           # Common utilities
│   └── auth/            # JWT validation helpers
│
├── frontend/            # Next.js app
│
├── docker-compose.yml   # Multi-service orchestration
├── kubernetes/          # K8s manifests
│   ├── auth-deployment.yml
│   ├── org-deployment.yml
│   ├── user-deployment.yml
│   └── ai-deployment.yml
│
└── docs/
    ├── API_GATEWAY.md
    ├── SERVICE_COMMUNICATION.md
    └── DEPLOYMENT.md
```

---

## 🐳 Docker Compose Example

```yaml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    image: kong:latest
    ports:
      - "8000:8000"
      - "8001:8001"
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: postgres
    depends_on:
      - postgres

  # Auth Service
  auth-service:
    build: ./services/auth-service
    ports:
      - "8001:8001"
    environment:
      DATABASE_URL: postgresql://user:pass@postgres/auth_db
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  # Organization Service
  org-service:
    build: ./services/organization-service
    ports:
      - "8002:8002"
    environment:
      DATABASE_URL: postgresql://user:pass@postgres/org_db
    depends_on:
      - postgres

  # User Service
  user-service:
    build: ./services/user-service
    ports:
      - "8003:8003"
    environment:
      DATABASE_URL: postgresql://user:pass@postgres/user_db
      AUTH_SERVICE_URL: http://auth-service:8001
      ORG_SERVICE_URL: http://org-service:8002
    depends_on:
      - postgres

  # AI Agent Service
  ai-service:
    build: ./services/ai-agent-service
    ports:
      - "8004:8004"
    environment:
      DATABASE_URL: postgresql://user:pass@postgres/chat_db
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3  # Scale AI service

  # PostgreSQL
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis
  redis:
    image: redis:7
    ports:
      - "6379:6379"

  # RabbitMQ (for async communication)
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

volumes:
  postgres_data:
```

---

## 📊 Comparison: Monolith vs Microservices

| Aspect | Monolith (Current) | Microservices |
|--------|-------------------|---------------|
| **Deployment** | Single deployment | Multiple deployments |
| **Scaling** | Scale entire app | Scale services independently |
| **Technology** | One stack (Python/FastAPI) | Multiple stacks possible |
| **Database** | Single database | Database per service |
| **Testing** | Easier to test | Complex integration tests |
| **Development** | Simpler for small teams | Better for large teams |
| **Latency** | Low (in-process calls) | Higher (network calls) |
| **Fault Isolation** | One bug crashes all | Services fail independently |
| **Complexity** | Lower | Higher |
| **Team Size** | 1-5 developers | 5+ developers |

---

## 🎯 My Recommendation

### **For Your Current Stage:**

**Option A: Stay Monolithic** ✅ (If team < 5 people)
- Keep current architecture
- Improve code organization (modules, blueprints)
- Add caching (Redis)
- Optimize database queries
- Use async endpoints

**Option B: Hybrid Approach** ✅✅ (Recommended)
- Keep auth, org, user in main service
- Extract AI Agents to separate service
  - **Why?** AI agents are resource-intensive, benefit from independent scaling
  - **How?** Move all 7 agents to dedicated service with async queue
- Add Redis for caching
- Use PostgreSQL instead of SQLite

**Option C: Full Microservices** ⚠️ (Only if team > 5 or enterprise scale)
- Split into 4 core services
- Implement API Gateway
- Set up service mesh (Istio)
- Requires DevOps expertise

---

## 🚀 Quick Start: Hybrid Approach

### **Step 1: Extract AI Service**

```bash
# Create new folder
mkdir services/ai-service

# Move agents
mv backend/agents/ services/ai-service/

# Create main.py for AI service
```

```python
# services/ai-service/main.py
from fastapi import FastAPI, Depends
from agents.qa_agent import QAAgent
# ... other imports

app = FastAPI(title="AI Agent Service", port=8004)

@app.post("/api/chat/{community_id}")
async def chat(community_id: str, message: str, user_id: int):
    agent = get_agent(community_id)
    response = await agent.process(message, user_id)
    return {"response": response}
```

### **Step 2: Update Main Service**

```python
# backend/main.py
import httpx

@app.post("/api/communities/{community_id}/chat")
async def chat_endpoint(community_id: str, request: ChatRequest):
    # Forward to AI service
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"http://ai-service:8004/api/chat/{community_id}",
            json={"message": request.message, "user_id": current_user.id}
        )
    return response.json()
```

---

## 📞 Next Steps

1. **Decide on approach** (Monolith, Hybrid, or Full Microservices)
2. **If Hybrid:**
   - Extract AI service first
   - Add Redis caching
   - Migrate to PostgreSQL
3. **If Full Microservices:**
   - Follow the 12-week migration plan
   - Start with Auth Service extraction
   - Implement service discovery

Would you like me to:
1. Create the Docker Compose setup for microservices?
2. Generate the AI service extraction code?
3. Set up API Gateway configuration?
4. Create Kubernetes deployment files?

Let me know which approach you prefer! 🚀
