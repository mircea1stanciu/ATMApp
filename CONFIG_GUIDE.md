# API Host and Port Configuration Guide

## Overview
All frontend and backend services now use centralized environment variable configuration for host and port settings.

## Frontend Configuration

### File: `.env.local`
Located at: `/frontend/.env.local`

```env
# API Configuration
NEXT_PUBLIC_API_HOST=localhost
NEXT_PUBLIC_API_PORT=8002
```

**Usage:**
- These variables are prefixed with `NEXT_PUBLIC_` to be available in the browser
- Used in `AdminDashboard.tsx` to construct `API_BASE_URL`
- All API calls use: `http://${NEXT_PUBLIC_API_HOST}:${NEXT_PUBLIC_API_PORT}`

**To Change:**
- Update `NEXT_PUBLIC_API_HOST` to change the backend hostname (e.g., `api.example.com`)
- Update `NEXT_PUBLIC_API_PORT` to change the backend port (e.g., `3000`)
- Changes take effect on next page refresh (no server restart needed)

### Implementation
File: `src/components/AdminDashboard.tsx`
```typescript
const API_HOST = process.env.NEXT_PUBLIC_API_HOST || 'localhost';
const API_PORT = process.env.NEXT_PUBLIC_API_PORT || '8002';
const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;
```

## Backend Configuration

### File: `.env`
Located at: `/backend/.env`

```env
# Backend Configuration
HOST=0.0.0.0
PORT=8002
```

**Usage:**
- `HOST` determines which interfaces the backend listens on
  - `0.0.0.0` = Listen on all interfaces (default, recommended for local development)
  - `127.0.0.1` = Listen only on localhost
  - `specific_ip` = Listen on a specific IP address
- `PORT` determines which port the backend runs on

**To Change:**
- Update `HOST` to change listening interface
- Update `PORT` to change listening port
- Changes take effect on next server restart

### Implementation
File: `main.py`
```python
if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8002"))
    print(f"🚀 Starting backend on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
```

## Common Configuration Scenarios

### Scenario 1: Development (Local Machine)
**Backend (.env):**
```env
HOST=0.0.0.0
PORT=8002
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_HOST=localhost
NEXT_PUBLIC_API_PORT=8002
```

### Scenario 2: Custom Port (e.g., Port 5000)
**Backend (.env):**
```env
HOST=0.0.0.0
PORT=5000
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_HOST=localhost
NEXT_PUBLIC_API_PORT=5000
```

### Scenario 3: Production (Remote Server)
**Backend (.env):**
```env
HOST=0.0.0.0
PORT=8002
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_HOST=api.yourdomain.com
NEXT_PUBLIC_API_PORT=8002
```

## Starting Applications

### Start Backend
```bash
cd backend
/backend/venv/bin/python3 ./main.py
# Output: 🚀 Starting backend on 0.0.0.0:8002
```

### Start Frontend
```bash
cd frontend
npm run dev
# Uses environment variables from .env.local
```

## Verification

### Check Backend is Running
```bash
curl http://localhost:8002/api/health
# Should return: {"status":"partial","agents":{...}}
```

### Check Frontend is Running
```bash
curl http://localhost:3003
# Should return HTML
```

## Current Status

✅ **Backend:** Running on `0.0.0.0:8002` (from .env)
✅ **Frontend:** Running on `localhost:3003` with API at `localhost:8002` (from .env.local)
✅ **API Calls:** All use centralized configuration
✅ **Error Messages:** Now show actual host:port being used

## Environment Variable Priority

**Backend:**
1. `.env` file (highest priority)
2. System environment variables
3. Hardcoded defaults (0.0.0.0, 8002)

**Frontend:**
1. `.env.local` file (highest priority)
2. `.env` file
3. Hardcoded defaults (localhost, 8002)

## Notes
- Frontend environment variables are built into the JavaScript bundle at build time
- To change frontend API URL, update `.env.local` and restart dev server or rebuild
- Backend environment variables are read at runtime
- For production deployments, use CI/CD to set environment variables securely
