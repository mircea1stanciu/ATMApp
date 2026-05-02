# Feature Flags System Implementation

## Overview
UnifiedWork now uses a feature flag system to control access to features based on subscription plans. This allows a single codebase to serve different organization sizes with appropriate feature sets.

## Subscription Tiers

### 1. FREE (Trial/Testing)
- **Users**: 10
- **Chat Sessions**: 1,000/month
- **Communities**: 3
- **Projects**: 5
- **Storage**: 1 GB
- **AI Models**: gpt-4o-mini only
- **Features**:
  - Basic chat
  - User management
  - Community access (limited)

### 2. SMALL_BUSINESS (Small Teams)
- **Users**: 20
- **Chat Sessions**: 5,000/month
- **Communities**: 7 (all default communities)
- **Projects**: 25
- **Storage**: 10 GB
- **AI Models**: gpt-4o-mini, gpt-4o
- **Features**:
  - All FREE features
  - Custom branding (logo, colors)
  - Basic analytics
  - Email support
  - Community leads role
  - Project management

### 3. ENTERPRISE (Large Organizations)
- **Users**: 100+
- **Chat Sessions**: 50,000+/month
- **Communities**: Unlimited
- **Projects**: Unlimited
- **Storage**: 100 GB
- **AI Models**: All models (gpt-4o-mini, gpt-4o, gpt-4, claude-3-opus)
- **Features**:
  - All SMALL_BUSINESS features
  - Advanced analytics
  - Priority support (4-hour response)
  - Custom integrations
  - SSO/SAML
  - Audit logs
  - Full API access
  - Unlimited communities
  - Advanced security
  - Dedicated support
  - 99.9% SLA guarantee

## Backend Implementation

### 1. Database Changes
```python
# core/database.py
class SubscriptionPlan(enum.Enum):
    FREE = "free"
    SMALL_BUSINESS = "small_business"
    ENTERPRISE = "enterprise"
```

### 2. Feature Configuration
```python
# core/feature_flags.py
- Feature enum with all available features
- PLAN_FEATURES: mapping of plans to features
- PLAN_LIMITS: resource limits per plan
- Helper functions: has_feature(), get_plan_features(), etc.
```

### 3. Feature Gates
```python
# core/feature_gates.py
@require_feature(Feature.ADVANCED_ANALYTICS)
async def advanced_analytics_endpoint(...):
    # Automatically checks if user's org has access
    ...
```

### 4. New API Endpoints

#### Get User Features
```http
GET /api/features
Authorization: Bearer <token>

Response:
{
  "subscription_plan": "small_business",
  "features": {
    "basic_chat": { "enabled": true, "description": "..." },
    "advanced_analytics": { "enabled": false, "description": "..." },
    ...
  },
  "limits": {
    "max_users": 20,
    "max_chat_sessions": 5000,
    ...
  }
}
```

#### Compare Plans
```http
GET /api/features/compare

Response:
{
  "plans": ["free", "small_business", "enterprise"],
  "features": {
    "advanced_analytics": {
      "free": false,
      "small_business": false,
      "enterprise": true,
      "description": "Advanced analytics with custom reports"
    },
    ...
  }
}
```

#### Check Feature Access
```http
POST /api/features/advanced_analytics/check
Authorization: Bearer <token>

Response:
{
  "feature": "advanced_analytics",
  "has_access": false,
  "subscription_plan": "small_business",
  "organization": "Acme Corp"
}
```

#### Get Subscription Plans
```http
GET /api/subscription-plans

Response:
{
  "plans": {
    "free": {
      "name": "Free",
      "limits": {...},
      "features": [...],
      "feature_count": 3
    },
    ...
  }
}
```

## Frontend Integration

### 1. Check Features on Load
```typescript
// Fetch user features when user logs in
const response = await apiCall('/api/features');
const { features, limits, subscription_plan } = response;

// Store in React state or context
setUserFeatures(features);
```

### 2. Conditional Rendering
```tsx
// Show/hide features based on access
{features.advanced_analytics?.enabled && (
  <AnalyticsSection />
)}

// Show upgrade prompt
{!features.custom_branding?.enabled && (
  <UpgradePrompt feature="custom_branding" />
)}
```

### 3. Disable Features
```tsx
<button
  disabled={!features.api_access?.enabled}
  onClick={handleApiAccess}
>
  {features.api_access?.enabled ? 'Access API' : 'Upgrade to Access API'}
</button>
```

### 4. Navigation Guards
```typescript
// Only show menu items if feature is enabled
const menuItems = [
  { name: 'Dashboard', path: '/', enabled: true },
  { name: 'Analytics', path: '/analytics', enabled: features.basic_analytics?.enabled },
  { name: 'Advanced Analytics', path: '/advanced', enabled: features.advanced_analytics?.enabled },
];
```

## Usage Examples

### Backend: Protect an Endpoint
```python
from core.feature_gates import require_feature
from core.feature_flags import Feature

@app.get("/api/analytics/advanced")
@require_feature(Feature.ADVANCED_ANALYTICS)
async def get_advanced_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only accessible to ENTERPRISE users
    return {"data": "advanced analytics"}
```

### Backend: Manual Feature Check
```python
from core.feature_flags import has_feature, Feature

# In any function
if has_feature(org.subscription_plan.value, Feature.CUSTOM_BRANDING):
    # Apply custom branding
    apply_custom_logo(org.logo_url)
```

### Frontend: Conditional Feature
```tsx
const Dashboard = () => {
  const { features } = useFeatures();
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Always visible */}
      <BasicStats />
      
      {/* Only for SMALL_BUSINESS+ */}
      {features.basic_analytics?.enabled && (
        <BasicAnalytics />
      )}
      
      {/* Only for ENTERPRISE */}
      {features.advanced_analytics?.enabled && (
        <AdvancedAnalytics />
      )}
      
      {/* Upgrade prompt */}
      {!features.advanced_analytics?.enabled && (
        <UpgradeBanner 
          feature="Advanced Analytics"
          requiredPlan="enterprise"
        />
      )}
    </div>
  );
};
```

## Migration Strategy

### 1. Update Existing Organizations
```python
# Migration script to update existing orgs
# Run this once after deployment

from core.database import SessionLocal, Organization, SubscriptionPlan

db = SessionLocal()
orgs = db.query(Organization).all()

for org in orgs:
    # Map old plans to new plans
    if org.subscription_plan.value in ["basic", "premium"]:
        org.subscription_plan = SubscriptionPlan.SMALL_BUSINESS
    elif org.subscription_plan.value == "enterprise":
        org.subscription_plan = SubscriptionPlan.ENTERPRISE
    else:
        org.subscription_plan = SubscriptionPlan.FREE

db.commit()
```

### 2. Frontend Updates
- Add feature context provider
- Update components to check features
- Add upgrade prompts/banners
- Update navigation based on features

### 3. Testing
```python
# Test feature access
def test_feature_access():
    # FREE plan - limited features
    assert has_feature("free", Feature.BASIC_CHAT) == True
    assert has_feature("free", Feature.ADVANCED_ANALYTICS) == False
    
    # ENTERPRISE plan - all features
    assert has_feature("enterprise", Feature.ADVANCED_ANALYTICS) == True
```

## Benefits

1. **Single Codebase**: No need for separate branches
2. **Easy Upgrades**: Organizations can upgrade without migration
3. **Flexible**: Easy to add new features and plans
4. **Clear Limits**: Defined resource limits per plan
5. **Better UX**: Show users what they're missing with upgrade prompts
6. **Revenue Growth**: Clear path for upselling features

## Next Steps

1. ✅ Backend implementation complete
2. ⏳ Frontend feature context implementation
3. ⏳ Update UI components with feature checks
4. ⏳ Add upgrade prompts/banners
5. ⏳ Migration script for existing orgs
6. ⏳ Update documentation
7. ⏳ Testing

## API Changes Summary

### New Endpoints
- `GET /api/features` - Get user's available features
- `GET /api/features/compare` - Compare all plans
- `POST /api/features/{feature_name}/check` - Check specific feature
- `GET /api/subscription-plans` - Get all plans with details

### Modified Endpoints
- `PATCH /api/organizations/{org_id}/subscription` - Now accepts FREE, SMALL_BUSINESS, ENTERPRISE

### Deprecated Plans
- ~~BASIC~~ → SMALL_BUSINESS
- ~~PREMIUM~~ → SMALL_BUSINESS or ENTERPRISE (depending on needs)
