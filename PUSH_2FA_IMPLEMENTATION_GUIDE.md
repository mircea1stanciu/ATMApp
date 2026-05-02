# Push-Based 2FA Implementation Guide

## Overview

Adding push-based 2FA (like Duo, Authy Push, or custom implementation) requires integration with external authentication services. This guide outlines the implementation options and steps.

## Current State

**✅ Currently Implemented:**
- TOTP-based 2FA (Google Authenticator, Authy TOTP, Microsoft Authenticator)
- QR code generation for easy setup
- Manual secret entry support
- 6-digit time-based codes (30-second window)

**❌ Not Yet Implemented:**
- Push notifications to mobile devices
- Real-time authentication approval/denial
- Biometric verification via push

---

## Push 2FA Options

### Option 1: Duo Security (Recommended for Enterprise)

**Pros:**
- Industry-leading push authentication
- Built-in fraud detection
- Extensive device support
- Compliance-ready (HIPAA, PCI DSS)
- Easy integration

**Cons:**
- Paid service ($3-9/user/month)
- Requires Duo account setup
- Third-party dependency

**Integration:**
```python
# Install: pip install duo-client

from duo_client import Auth

# Initialize Duo
duo_auth = Auth(
    ikey='YOUR_INTEGRATION_KEY',
    skey='YOUR_SECRET_KEY',
    host='api-xxxxx.duosecurity.com'
)

# Trigger push notification
response = duo_auth.auth(
    username=user.username,
    factor='push',
    device='auto'
)

# Response: 'allow' or 'deny'
if response == 'allow':
    # User approved on mobile
    login_successful()
```

**Setup Steps:**
1. Sign up at https://duo.com
2. Create an application in Duo Admin Panel
3. Get Integration Key, Secret Key, API Hostname
4. Install Duo Mobile app on user devices
5. Enroll users via enrollment link

---

### Option 2: Twilio Authy Push API

**Pros:**
- Built on Authy platform (trusted)
- Pay-as-you-go pricing (~$0.05/verification)
- Good documentation
- Same app users may already have (Authy)

**Cons:**
- Requires Twilio account
- Monthly base fee + per-verification cost
- Rate limits on free tier

**Integration:**
```python
# Install: pip install authy

from authy.api import AuthyApiClient

authy_api = AuthyApiClient('YOUR_API_KEY')

# Register user
user = authy_api.users.create(
    email=user.email,
    phone=user.phone,
    country_code=1
)

# Send push notification
push = authy_api.one_touch.send_request(
    authy_id=user.authy_id,
    message='Login request from UnifiedWork',
    seconds_to_expire=120
)

# Poll for approval status
status = authy_api.one_touch.get_approval_status(push.uuid)
# Returns: 'pending', 'approved', 'denied'
```

**Setup Steps:**
1. Create Twilio account at https://twilio.com
2. Enable Authy in Twilio Console
3. Get API key from Authy dashboard
4. Users install Authy app
5. Enrollment via SMS/email

---

### Option 3: Custom Push Implementation (WebSocket + Firebase/APNS)

**Pros:**
- Full control over UX
- No recurring costs (except hosting)
- White-label solution
- Can integrate with existing mobile app

**Cons:**
- Requires mobile app development (iOS/Android)
- Complex infrastructure (push notification services)
- Ongoing maintenance burden
- Security implementation responsibility

**Architecture:**
```
1. User Login Attempt
   ↓
2. Backend generates auth challenge
   ↓
3. Send push notification (FCM/APNS)
   ↓
4. Mobile app receives notification
   ↓
5. User approves/denies on device
   ↓
6. Mobile app sends signed response
   ↓
7. Backend verifies signature
   ↓
8. Web session authenticated
```

**Technology Stack:**
- **Push Services**: Firebase Cloud Messaging (Android), Apple Push Notification Service (iOS)
- **Real-time Communication**: WebSockets (Socket.io or native)
- **Mobile Framework**: React Native / Flutter / Native
- **Backend**: FastAPI WebSocket support

**Estimated Development:**
- Backend API: 1-2 weeks
- Mobile app: 4-8 weeks
- Testing & security audit: 2-4 weeks
- **Total: 2-3 months**

---

### Option 4: WebAuthn/FIDO2 (Passwordless Future)

**Pros:**
- Modern standard (supported by browsers)
- No external dependencies
- Hardware key support (YubiKey, etc.)
- Biometric authentication (Touch ID, Face ID)
- Phishing-resistant

**Cons:**
- Different UX paradigm (not traditional "push")
- Requires HTTPS
- Device-bound (can't switch devices easily)
- Browser/OS compatibility considerations

**Integration:**
```python
# Install: pip install webauthn

from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response
)

# Registration
options = generate_registration_options(
    rp_id='unifiedwork.com',
    rp_name='UnifiedWork',
    user_id=user.id,
    user_name=user.username,
    user_display_name=user.full_name
)

# Authentication
auth_options = generate_authentication_options(
    rp_id='unifiedwork.com'
)
```

---

## Recommended Implementation Path

### Phase 1: Keep Current TOTP (Completed ✅)
- Current implementation is solid
- Works with multiple authenticator apps
- No external dependencies
- Low maintenance

### Phase 2: Add Duo Security (Recommended Next Step)

**Why Duo?**
- Quickest to implement (1-2 days)
- Enterprise-grade security
- Users love push notifications
- Minimal code changes required
- Free trial available

**Implementation Plan:**

1. **Backend Changes** (Day 1):
```python
# New file: core/duo_auth.py

from duo_client import Auth
import os

class DuoAuthenticator:
    def __init__(self):
        self.auth = Auth(
            ikey=os.getenv('DUO_INTEGRATION_KEY'),
            skey=os.getenv('DUO_SECRET_KEY'),
            host=os.getenv('DUO_API_HOST')
        )
    
    def send_push(self, username: str):
        """Send push notification to user's device"""
        response = self.auth.auth(
            username=username,
            factor='push',
            device='auto'
        )
        return response  # 'allow' or 'deny'
    
    def check_push_status(self, txid: str):
        """Check status of pending push"""
        response = self.auth.auth_status(txid)
        return response
```

2. **Add New Endpoints** (Day 1):
```python
@app.post("/api/auth/2fa/push/send")
async def send_push_2fa(current_user: User):
    """Send push notification for 2FA"""
    duo = DuoAuthenticator()
    txid = duo.send_push(current_user.username)
    return {"txid": txid, "status": "pending"}

@app.get("/api/auth/2fa/push/status/{txid}")
async def check_push_status(txid: str):
    """Check if user approved push notification"""
    duo = DuoAuthenticator()
    status = duo.check_push_status(txid)
    return {"status": status}
```

3. **Frontend Changes** (Day 2):
   - Add "Approve on Mobile" button
   - Poll push status endpoint
   - Show countdown timer
   - Handle timeout/denial

4. **Database Changes**:
```sql
ALTER TABLE users ADD COLUMN duo_user_id VARCHAR(100);
ALTER TABLE users ADD COLUMN push_2fa_enabled BOOLEAN DEFAULT FALSE;
```

---

## Cost Comparison

| Solution | Setup Cost | Monthly Cost | Per-User Cost |
|----------|------------|--------------|---------------|
| **TOTP (Current)** | $0 | $0 | $0 |
| **Duo Security** | $0 (trial) | $150-900 | $3-9/user/month |
| **Twilio Authy** | $0 | $20 base | $0.05/verification |
| **Custom Solution** | $20,000-50,000 | $200-500 (hosting) | $0 |
| **WebAuthn** | $0 | $0 | $0 |

---

## Security Considerations

### For Push Authentication:
1. **Timeout**: Push requests should expire (60-120 seconds)
2. **Context**: Show user IP, location, device info in push
3. **Replay Protection**: Use one-time transaction IDs
4. **Rate Limiting**: Prevent push notification spam
5. **Fallback**: Always offer TOTP as backup
6. **Logging**: Audit all push approvals/denials

---

## Hybrid Approach (Best of Both Worlds)

**Recommendation: Offer Multiple 2FA Methods**

```python
class TwoFactorMethod(enum.Enum):
    TOTP = "totp"          # Current implementation
    PUSH = "push"          # Duo/Authy push
    SMS = "sms"            # SMS codes
    WEBAUTHN = "webauthn"  # Hardware keys/biometrics

# Database schema
users.two_fa_methods = JSON  # ["totp", "push", "webauthn"]
users.primary_2fa_method = String  # "push"
users.backup_2fa_method = String  # "totp"
```

**User Experience:**
1. User sets up TOTP (always available as fallback)
2. User optionally adds push authentication
3. On login, system tries push first
4. If push times out, falls back to TOTP
5. User can choose method at login time

---

## Quick Start: Adding Duo Push (1-2 Days)

### Step 1: Sign Up for Duo
```bash
# 1. Go to https://signup.duo.com
# 2. Choose "Free Trial" (10 users, 30 days)
# 3. Create application: "UnifiedWork"
# 4. Note down: Integration Key, Secret Key, API Hostname
```

### Step 2: Install Dependencies
```bash
cd backend
source venv/bin/activate
pip install duo-client
pip freeze > requirements.txt
```

### Step 3: Add to .env
```bash
# Add to backend/.env
DUO_INTEGRATION_KEY=your_integration_key
DUO_SECRET_KEY=your_secret_key
DUO_API_HOST=api-xxxxx.duosecurity.com
```

### Step 4: I can help implement the code changes
Let me know if you want me to:
1. Create the Duo integration files
2. Add the new API endpoints
3. Update the frontend to show push option
4. Add database migration for Duo user IDs

---

## Decision Matrix

| If you want... | Choose... |
|----------------|-----------|
| Quick implementation | **Duo Security** |
| Lowest cost | **TOTP (keep current)** |
| Full control | **Custom Solution** |
| Modern & future-proof | **WebAuthn** |
| Good balance | **Duo + TOTP hybrid** |

---

## Next Steps

**Option A: Add Duo Push (Fastest)**
→ I can implement this in the next conversation (1-2 hours work)

**Option B: Add WebAuthn (Modern)**
→ Requires more planning, but no external costs

**Option C: Keep TOTP Only**
→ Current system is already production-ready and secure

**What would you like to do?** Let me know and I'll help implement it!

---

## References

- [Duo Security Documentation](https://duo.com/docs)
- [Twilio Authy API](https://www.twilio.com/docs/authy/api)
- [WebAuthn Guide](https://webauthn.guide/)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)

---

**Date**: November 16, 2025  
**Status**: Planning Phase  
**Current 2FA**: TOTP (Fully Functional)
