# OAuth Frontend URL Fix - Dynamic Redirect Handling

## Problem

Vercel preview deployments get new URLs on each deploy (e.g., `opside-complete-frontend-abc123.vercel.app` → `opside-complete-frontend-xyz789.vercel.app`). Hardcoding `FRONTEND_URL` in backend environment variables won't work.

## Solution

The frontend now passes its current URL dynamically to the backend, which should store it temporarily and use it for the OAuth redirect.

---

## Frontend Changes (✅ Already Done)

The frontend now passes `frontend_url` parameter:
```javascript
/api/v1/integrations/amazon/auth/start?redirect_uri=...&frontend_url=https://current-frontend-url.vercel.app
```

---

## Backend Changes Required

### Option 1: Use `frontend_url` Parameter (Recommended)

**In `/api/v1/integrations/amazon/auth/start` endpoint:**

1. Extract `frontend_url` from query parameters
2. Store it temporarily (in state/session) associated with the OAuth state
3. After OAuth callback completes, use the stored `frontend_url` for redirect

**Example:**
```javascript
// In /auth/start endpoint
const frontendUrl = req.query.frontend_url || process.env.FRONTEND_URL || 'http://localhost:3000';

// Store frontendUrl with OAuth state (in memory, Redis, or database)
oauthStateStore.set(state, { frontendUrl });

// After OAuth callback completes (in /auth/callback endpoint):
const storedState = oauthStateStore.get(state);
const frontendUrl = storedState?.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

res.redirect(`${frontendUrl}/dashboard?amazon_connected=true`);
```

### Option 2: Use `Origin` Header (Fallback)

**Alternative:** Extract frontend URL from request `Origin` header:

```javascript
// In /auth/start endpoint
const frontendUrl = req.query.frontend_url 
  || req.headers.origin 
  || process.env.FRONTEND_URL 
  || 'http://localhost:3000';

// Store and use as above
```

---

## Implementation Checklist

### Backend `/auth/start` endpoint:
- [ ] Extract `frontend_url` from query parameters
- [ ] Store `frontend_url` associated with OAuth `state` (in-memory map, Redis, or database)
- [ ] Use existing `redirect_uri` for Amazon OAuth configuration (unchanged)

### Backend `/auth/callback` endpoint:
- [ ] Retrieve stored `frontend_url` using OAuth `state`
- [ ] Use stored `frontend_url` for redirect (fallback to `FRONTEND_URL` env var if not found)
- [ ] Redirect to: `${frontendUrl}/dashboard?amazon_connected=true`

### State Storage Options:

**Option A: In-Memory (Simple, but lost on restart):**
```javascript
const oauthStates = new Map(); // Store frontendUrl with state
```

**Option B: Redis (Recommended for production):**
```javascript
await redis.setex(`oauth:${state}`, 600, JSON.stringify({ frontendUrl })); // 10 min TTL
```

**Option C: Database:**
```javascript
await db.oauthStates.create({ state, frontendUrl, expiresAt: Date.now() + 600000 });
```

---

## Example Implementation

```javascript
// OAuth state storage (use Redis or database in production)
const oauthStates = new Map();

// GET /api/v1/integrations/amazon/auth/start
app.get('/api/v1/integrations/amazon/auth/start', async (req, res) => {
  const frontendUrl = req.query.frontend_url 
    || req.headers.origin 
    || process.env.FRONTEND_URL 
    || 'http://localhost:3000';
  
  const state = generateState(); // Generate OAuth state
  
  // Store frontend URL with state
  oauthStates.set(state, { frontendUrl, timestamp: Date.now() });
  
  // Generate Amazon OAuth URL (using redirect_uri for Amazon)
  const amazonAuthUrl = generateAmazonAuthUrl({
    redirect_uri: req.query.redirect_uri || `${process.env.BACKEND_URL}/api/v1/integrations/amazon/auth/callback`,
    state
  });
  
  res.json({ auth_url: amazonAuthUrl });
});

// GET /api/v1/integrations/amazon/auth/callback
app.get('/api/v1/integrations/amazon/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // Retrieve stored frontend URL
  const storedState = oauthStates.get(state);
  const frontendUrl = storedState?.frontendUrl 
    || process.env.FRONTEND_URL 
    || 'http://localhost:3000';
  
  // Clean up stored state
  oauthStates.delete(state);
  
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);
  
  // Store tokens in database
  await storeTokens(tokens);
  
  // Redirect to frontend using stored URL
  res.redirect(`${frontendUrl}/dashboard?amazon_connected=true`);
});
```

---

## Fallback Behavior

- **Primary**: Use `frontend_url` query parameter (passed by frontend)
- **Secondary**: Use `Origin` header from request
- **Tertiary**: Use `FRONTEND_URL` environment variable (for production/staging)
- **Default**: `http://localhost:3000` (development only)

---

## Testing

1. **Test with Vercel preview URL**: Deploy to Vercel, get preview URL, test OAuth flow
2. **Test with production URL**: Set `FRONTEND_URL` env var, test OAuth flow
3. **Test state expiration**: Verify stored state expires after OAuth completes (or after 10 minutes)

---

## Notes

- State should expire after OAuth completes or after 10 minutes (to prevent memory leaks)
- In production, use Redis or database instead of in-memory storage (survives restarts)
- The `redirect_uri` parameter is still used for Amazon OAuth configuration (Amazon's redirect URL)
- The `frontend_url` parameter is for the backend's final redirect after OAuth completes

