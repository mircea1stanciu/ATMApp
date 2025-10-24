# 🔑 API Keys Setup Guide

## ✅ Issue Fixed: Chat Endpoint 422 Error

The **422 Unprocessable Entity** error has been fixed! The chat endpoint now accepts messages with just the `message` field.

---

## 🚨 Current Issue: Agent Not Initialized

You're now seeing:
```json
{"detail": "Backend agent not initialized"}
```

This is because the AI agents need API keys to function.

---

## 📋 Required API Keys

To enable chat functionality, you need **at least ONE** of the following:

### Option 1: OpenAI API Key (Recommended)
- **Models**: GPT-4, GPT-4o, GPT-3.5 Turbo
- **Get Key**: https://platform.openai.com/api-keys
- **Cost**: Pay-as-you-go pricing

### Option 2: Anthropic API Key
- **Models**: Claude 3 Opus, Claude 3 Sonnet, Claude 3.5 Sonnet
- **Get Key**: https://console.anthropic.com/
- **Cost**: Pay-as-you-go pricing

### Option 3: Both (Best Experience)
- Use both providers for maximum flexibility
- Fallback if one service is down
- Access to all 5+ models

---

## 🛠️ Setup Instructions

### Step 1: Get Your API Keys

**For OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

**For Anthropic:**
1. Go to https://console.anthropic.com/
2. Sign in or create an account
3. Navigate to API Keys section
4. Create and copy your key

### Step 2: Create Environment File

Create a `.env` file in the `backend` directory:

```bash
cd /Users/mcs_macbook_pro/Desktop/Proiecte\ Mircea/UnifiedWork/backend
touch .env
```

### Step 3: Add API Keys to .env

Open `.env` and add your keys:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key-here

# Anthropic Configuration (optional)
ANTHROPIC_API_KEY=your-anthropic-key-here

# Optional: Model Configuration
DEFAULT_MODEL=gpt-4o-mini
DEFAULT_TEMPERATURE=0.7
```

**Example:**
```bash
OPENAI_API_KEY=sk-proj-abc123xyz789...
ANTHROPIC_API_KEY=sk-ant-abc123xyz789...
DEFAULT_MODEL=gpt-4o-mini
DEFAULT_TEMPERATURE=0.7
```

### Step 4: Restart Backend

After adding the keys, restart the backend server:

```bash
# Stop the current backend (Ctrl+C in the terminal running it)
# Or kill the process:
ps aux | grep uvicorn | grep -v grep | awk '{print $2}' | xargs kill

# Start it again:
cd /Users/mcs_macbook_pro/Desktop/Proiecte\ Mircea/UnifiedWork/backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 5: Verify Setup

You should see:
```
✅ Database initialized successfully
✅ Initialized 7 AI agents successfully
```

Instead of:
```
❌ Failed to initialize agents: No API key found
```

---

## 🧪 Test the Chat

Once API keys are set up, test the chat endpoint:

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq -r '.access_token')

# Send a message to Backend community
curl -s -X POST "http://localhost:8000/api/communities/backend/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is REST API?"}' | jq
```

**Expected Response:**
```json
{
  "response": "A REST API is...",
  "timestamp": "2025-10-24T...",
  "agent": "BackendGPT"
}
```

---

## 💰 Cost Considerations

### OpenAI Pricing (Approximate)
- **GPT-4o-mini**: $0.15 / 1M input tokens, $0.60 / 1M output tokens (Cheapest)
- **GPT-3.5 Turbo**: $0.50 / 1M input tokens, $1.50 / 1M output tokens
- **GPT-4**: $5.00 / 1M input tokens, $15.00 / 1M output tokens
- **GPT-4o**: $2.50 / 1M input tokens, $10.00 / 1M output tokens

### Anthropic Pricing (Approximate)
- **Claude 3.5 Sonnet**: $3.00 / 1M input tokens, $15.00 / 1M output tokens
- **Claude 3 Sonnet**: $3.00 / 1M input tokens, $15.00 / 1M output tokens
- **Claude 3 Opus**: $15.00 / 1M input tokens, $75.00 / 1M output tokens

### Typical Usage
- Average chat message: ~200-500 tokens
- 1,000 messages ≈ 250K-500K tokens
- With GPT-4o-mini: ~$0.10-$0.20 for 1,000 messages

**Recommendation**: Start with **GPT-4o-mini** (cheapest and fast)

---

## 🔒 Security Best Practices

### 1. Never Commit API Keys
Add `.env` to `.gitignore`:

```bash
echo ".env" >> backend/.gitignore
```

### 2. Use Environment Variables
The app already uses environment variables correctly:
```python
import os
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
```

### 3. Rotate Keys Regularly
- Change API keys every 90 days
- Immediately rotate if exposed
- Use separate keys for dev/prod

### 4. Monitor Usage
- Set up billing alerts in OpenAI/Anthropic dashboards
- Monitor token usage
- Set spending limits

---

## 📊 Available Communities

Once API keys are set up, these communities will work:

1. **QA** (`/api/communities/qa/chat`) - QualityGPT
2. **Backend** (`/api/communities/backend/chat`) - BackendGPT
3. **Frontend** (`/api/communities/frontend/chat`) - FrontendGPT
4. **Design** (`/api/communities/design/chat`) - DesignGPT
5. **Product** (`/api/communities/product/chat`) - ProductGPT
6. **DevOps** (`/api/communities/devops/chat`) - OpsGPT
7. **Docs** (`/api/communities/docs/chat`) - DocsGPT

---

## 🎯 Quick Start Summary

```bash
# 1. Get API key from https://platform.openai.com/api-keys

# 2. Create .env file
cd backend
echo 'OPENAI_API_KEY=sk-your-key-here' > .env

# 3. Restart backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 4. Test in browser
# Go to http://localhost:3000 and try chatting!
```

---

## ❓ Troubleshooting

### Issue: Still seeing "No API key found"
- **Check**: `.env` file is in `backend/` directory
- **Check**: File is named exactly `.env` (not `env.txt`)
- **Check**: No spaces around `=` sign
- **Solution**: Restart the backend server

### Issue: "Invalid API key"
- **Check**: Key is copied correctly (starts with `sk-`)
- **Check**: No extra spaces or quotes around the key
- **Check**: Key hasn't been revoked in OpenAI dashboard
- **Solution**: Generate a new key

### Issue: "Rate limit exceeded"
- **Cause**: Too many requests or no billing set up
- **Solution**: Add payment method in OpenAI dashboard
- **Solution**: Wait for rate limit to reset

### Issue: "Insufficient quota"
- **Cause**: Free trial expired or no credits
- **Solution**: Add payment method
- **Solution**: Purchase credits

---

## 🎉 Next Steps

Once API keys are working:

1. ✅ Test all 7 community chats
2. ✅ Try different AI models in Settings
3. ✅ Experiment with temperature settings (0.0-1.0)
4. ✅ Create chat sessions and track usage
5. ✅ Set up monitoring and alerts

---

**Last Updated:** October 24, 2025  
**Status:** Chat endpoint fixed, waiting for API keys setup
