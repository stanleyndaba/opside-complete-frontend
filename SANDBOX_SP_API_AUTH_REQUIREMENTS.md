# Sandbox SP-API Authentication Requirements - Complete Analysis

## Executive Summary

The frontend expects **cookie-based JWT authentication** for Sandbox SP-API. The sandbox flow bypasses real Amazon OAuth and establishes a session directly through a backend endpoint that must set an HTTP-only cookie with a JWT token.

---

## Required Endpoints for Sandbox SP-API Authentication

### 1. **POST `/api/v1/integrations/amazon/sandbox/callback`** ⚠️ CRITICAL

**Purpose**: Establish a sandbox session without real Amazon OAuth. This endpoint simulates the OAuth callback and creates/authenticates a user session.

**Request**:
```http
POST https://opside-node-api.onrender.com/api/v1/integrations/amazon/sandbox/callback
Content-Type: application/json
Cookie: (optional - may not exist on first call)

Body:
{
  "state": "demo_1234567890"  // Opaque state string from frontend
}
```

**Frontend Expectation**:
- Frontend sends: `POST` request with JSON body `{"state": "..."}`
- Headers: `Content-Type: application/json`
- Credentials: `include` (cookies sent automatically)

**Backend MUST**:
1. ✅ Accept the POST request (even without existing session cookie)
2. ✅ Parse the `state` parameter from JSON body
3. ✅ Create or retrieve a sandbox user/tenant
4. ✅ Generate a JWT token with user information
5. ✅ **SET AN HTTP-ONLY COOKIE** with the JWT token
6. ✅ Return success response

**Expected Response (200 OK)**:
```json
{
  "ok": true,
  "connected": true
}
```

**OR**:
```json
{
  "ok": true,
  "connected": true,
  "message": "Sandbox session established"
}
```

**Cookie That MUST Be Set**:
```http
Set-Cookie: session_token=<JWT_TOKEN>; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=604800
```

**Critical**: The cookie MUST be set with:
- `HttpOnly: true` - Prevents JavaScript access
- `Secure: true` - HTTPS only (production)
- `SameSite: None` - Required for cross-origin (Vercel → Render)
- `Path: /` - Available site-wide
- `Max-Age: 604800` - 7 days expiration

**Status Codes**:
- `200` - Success (session created, cookie set)
- `400` - Bad request (invalid state format)
- `500` - Server error

---

### 2. **GET `/api/auth/me`** ⚠️ REQUIRED AFTER SANDBOX AUTH

**Purpose**: Verify authentication status and get user profile. Called immediately after sandbox callback to confirm session is working.

**Request**:
```http
GET https://opside-node-api.onrender.com/api/v1/integrations/amazon/sandbox/callback
Cookie: session_token=<JWT_TOKEN>  // Set by sandbox callback endpoint
```

**Expected Response (200 OK - Authenticated)**:
```json
{
  "id": "user_sandbox_123",
  "email": "sandbox@example.com",  // Optional for sandbox
  "name": "Sandbox User",           // Optional for sandbox
  "amazon_connected": true,
  "stripe_connected": false,
  "created_at": "2024-01-01T00:00:00Z",
  "last_login": "2024-01-15T12:00:00Z"
}
```

**Expected Response (401 Unauthorized - Not Authenticated)**:
```json
{
  "error": "Unauthorized",
  "message": "Please log in or refresh your session"
}
```

**Status Codes**:
- `200` - User is authenticated (cookie valid)
- `401` - User is not authenticated (missing/invalid cookie)

**When Called**:
- Immediately after sandbox callback succeeds
- On page loads to check authentication status
- Before accessing protected resources

---

### 3. **GET `/api/v1/integrations/status`** ⚠️ REQUIRED AFTER SANDBOX AUTH

**Purpose**: Get integration connection status. Frontend polls this to verify Amazon connection was established.

**Request**:
```http
GET https://opside-node-api.onrender.com/api/v1/integrations/status
Cookie: session_token=<JWT_TOKEN>
```

**Expected Response (200 OK)**:
```json
{
  "amazon_connected": true,
  "docs_connected": false,
  "lastSync": "2024-01-15T12:00:00Z",
  "lastIngest": null,
  "providerIngest": {
    "gmail": { "connected": false },
    "outlook": { "connected": false },
    "gdrive": { "connected": false },
    "dropbox": { "connected": false }
  }
}
```

**Status Codes**:
- `200` - Success (with or without auth - should return 401 if unauthenticated)
- `401` - Unauthenticated (optional - some implementations allow unauthenticated status checks)

**When Called**:
- After sandbox callback to verify connection
- On IntegrationsHub page load
- Polled every 600ms for up to 5 times after OAuth callback

---

### 4. **GET `/api/v1/integrations/amazon/recoveries`** ⚠️ OPTIONAL BUT EXPECTED

**Purpose**: Get Amazon recovery data. Frontend calls this after successful sandbox auth to show recovery amounts.

**Request**:
```http
GET https://opside-node-api.onrender.com/api/v1/integrations/amazon/recoveries
Cookie: session_token=<JWT_TOKEN>
```

**Expected Response (200 OK)**:
```json
{
  "totalAmount": 1234.56,
  "currency": "USD",
  "claimCount": 42
}
```

**OR** (if no recoveries):
```json
{
  "totalAmount": 0,
  "currency": "USD",
  "claimCount": 0
}
```

**Frontend Fallback**: If sandbox mode is detected and backend returns 0 or error, frontend uses mock data automatically.

**Status Codes**:
- `200` - Success (returns recovery data or zeros)
- `401` - Unauthenticated
- `500` - Server error

---

## Authentication Flow for Sandbox SP-API

### Complete Flow:

```
1. User clicks "Connect Amazon Account"
   ↓
2. Frontend detects sandbox mode (localhost, VITE_SANDBOX=true, etc.)
   ↓
3. Frontend redirects to: /auth/amazon-sandbox?state=demo_1234567890
   ↓
4. AmazonSandbox.tsx component loads
   ↓
5. Frontend calls: POST /api/v1/integrations/amazon/sandbox/callback
   Body: {"state": "demo_1234567890"}
   ↓
6. BACKEND MUST:
   - Accept request (no auth required for this endpoint)
   - Create/retrieve sandbox user
   - Generate JWT token
   - SET HTTP-ONLY COOKIE: session_token=<JWT>
   - Return: {"ok": true, "connected": true}
   ↓
7. Frontend receives success response
   ↓
8. Frontend navigates to: /auth/analyzing?source=amazon
   ↓
9. Frontend calls: GET /api/auth/me
   Cookie: session_token=<JWT> (sent automatically)
   ↓
10. BACKEND MUST:
    - Extract JWT from cookie
    - Validate JWT signature and expiration
    - Return user profile: {"id": "...", "email": "...", "amazon_connected": true}
    ↓
11. Frontend calls: GET /api/v1/integrations/status
    Cookie: session_token=<JWT>
    ↓
12. BACKEND MUST:
    - Extract JWT from cookie
    - Validate JWT
    - Return: {"amazon_connected": true, ...}
    ↓
13. Frontend calls: GET /api/v1/integrations/amazon/recoveries
    Cookie: session_token=<JWT>
    ↓
14. BACKEND MUST:
    - Extract JWT from cookie
    - Validate JWT
    - Return recovery data or zeros
    ↓
15. Frontend redirects to: /integrations-hub?amazon_connected=true
```

---

## Critical Authentication Requirements

### 1. **Cookie-Based Authentication**

**Frontend sends ALL requests with**:
```javascript
fetch(url, {
  credentials: 'include',  // REQUIRED - sends cookies
  headers: {
    'Content-Type': 'application/json'
  }
})
```

**Backend MUST**:
- Accept cookies via `credentials: 'include'`
- Set cookies in responses
- Validate cookies on protected endpoints

---

### 2. **JWT Token Format**

**Payload Structure** (extracted from BACKEND_AUTH_REQUIREMENTS.md):
```json
{
  "user_id": "user_sandbox_123",
  "email": "sandbox@example.com",  // Optional for sandbox
  "name": "Sandbox User",           // Optional for sandbox
  "amazon_seller_id": "SANDBOX_SELLER_ID",  // Optional for sandbox
  "exp": 1704067200,  // Unix timestamp
  "iat": 1704063600   // Unix timestamp
}
```

**Token Configuration**:
- **Algorithm**: HS256
- **Secret**: `JWT_SECRET` environment variable
- **Expiration**: 7 days (604800 seconds)
- **Issued At**: Required (`iat` claim)

---

### 3. **Cookie Configuration**

**Backend MUST set cookie with these exact settings**:

```javascript
res.cookie('session_token', jwtToken, {
  httpOnly: true,        // REQUIRED - prevents XSS
  secure: true,          // REQUIRED in production (HTTPS only)
  sameSite: 'none',     // REQUIRED for cross-origin (Vercel → Render)
  maxAge: 604800,        // 7 days in seconds
  path: '/'              // Available site-wide
});
```

**Cookie Name**: Must be consistent. Frontend doesn't specify the name, but common names are:
- `session_token` (recommended)
- `auth_token`
- `jwt`

---

### 4. **CORS Configuration**

**Backend MUST allow credentials**:

```javascript
{
  origin: [
    "https://your-frontend.vercel.app",
    "https://opside.com",
    "http://localhost:5173",  // Development
    // Add all Vercel preview URLs
  ],
  credentials: true,  // CRITICAL - allows cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type"]
}
```

**Critical**: `credentials: true` is REQUIRED for cookies to work cross-origin.

---

### 5. **Error Handling**

**401 Unauthorized** (when cookie missing/invalid):
```json
{
  "error": "Unauthorized",
  "message": "Please log in or refresh your session"
}
```

**404 Not Found** (when endpoint doesn't exist):
```json
{
  "error": "Not Found",
  "message": "Endpoint not found: /api/v1/integrations/amazon/sandbox/callback"
}
```

**500 Server Error**:
```json
{
  "error": "Internal Server Error",
  "message": "An error occurred processing your request"
}
```

---

## Sandbox-Specific Requirements

### Sandbox Callback Endpoint Behavior

**IMPORTANT**: The sandbox callback endpoint (`/api/v1/integrations/amazon/sandbox/callback`) should:

1. **NOT require authentication** - This is the entry point that creates the session
2. **Accept any state** - Frontend sends arbitrary state strings like `"demo_1234567890"`
3. **Create a sandbox session** - Can be a mock user or real user marked as sandbox
4. **Set authentication cookie** - MUST set the session cookie in the response
5. **Return success immediately** - Don't wait for real Amazon API calls

**Example Backend Implementation**:
```javascript
app.post('/api/v1/integrations/amazon/sandbox/callback', async (req, res) => {
  const { state } = req.body;
  
  // Create or retrieve sandbox user
  const sandboxUser = await createSandboxUser(state);
  
  // Generate JWT token
  const token = jwt.sign(
    {
      user_id: sandboxUser.id,
      email: sandboxUser.email || 'sandbox@example.com',
      name: sandboxUser.name || 'Sandbox User',
      amazon_seller_id: 'SANDBOX',
      exp: Math.floor(Date.now() / 1000) + 604800, // 7 days
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET
  );
  
  // SET THE COOKIE - CRITICAL!
  res.cookie('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 604800,
    path: '/'
  });
  
  // Mark Amazon as connected in database
  await markAmazonConnected(sandboxUser.id, true);
  
  // Return success
  res.json({
    ok: true,
    connected: true
  });
});
```

---

## Endpoints Called After Sandbox Auth

After successful sandbox callback, frontend calls these endpoints **in order**:

1. **GET `/api/auth/me`** - Verify session
2. **GET `/api/v1/integrations/status`** - Check Amazon connection status
3. **GET `/api/v1/integrations/amazon/recoveries`** - Get recovery data

All subsequent requests MUST include the session cookie.

---

## Protected Endpoints

These endpoints require authentication (valid JWT cookie):

- `GET /api/auth/me` ✅ (should return 401 if no cookie)
- `GET /api/v1/integrations/status` ✅ (should return 401 if no cookie)
- `GET /api/v1/integrations/amazon/recoveries` ✅
- `GET /api/documents` ✅
- `GET /api/recoveries` ✅
- `POST /api/sync/start` ✅
- All other `/api/*` endpoints ✅

**Exception**: 
- `POST /api/v1/integrations/amazon/sandbox/callback` - Should NOT require auth (creates session)

---

## Testing Checklist

### Backend Implementation Checklist:

- [ ] `POST /api/v1/integrations/amazon/sandbox/callback` accepts POST with JSON body
- [ ] Endpoint sets HTTP-only cookie with JWT token
- [ ] Cookie has `SameSite=None` for cross-origin
- [ ] Cookie has `Secure=true` in production
- [ ] Cookie has `HttpOnly=true`
- [ ] Endpoint returns `{"ok": true, "connected": true}`
- [ ] `GET /api/auth/me` validates JWT from cookie
- [ ] `GET /api/auth/me` returns 401 when cookie missing/invalid
- [ ] `GET /api/auth/me` returns 200 with user data when cookie valid
- [ ] `GET /api/v1/integrations/status` validates JWT from cookie
- [ ] `GET /api/v1/integrations/status` returns `amazon_connected: true` after sandbox auth
- [ ] CORS allows credentials from frontend origin
- [ ] CORS allows `Content-Type` header
- [ ] All protected endpoints return 401 (not 404) when unauthenticated

---

## Common Issues

### Issue 1: Cookie Not Being Set
**Symptom**: Frontend calls sandbox callback, gets 200 OK, but subsequent requests return 401
**Cause**: Backend not setting cookie in response
**Fix**: Ensure `res.cookie()` is called BEFORE `res.json()`

### Issue 2: Cookie Not Being Sent
**Symptom**: Cookie is set but not sent on subsequent requests
**Cause**: CORS not configured for credentials, or `SameSite` incorrect
**Fix**: Set `credentials: true` in CORS and `sameSite: 'none'` on cookie

### Issue 3: 404 Instead of 401
**Symptom**: Protected endpoints return 404 instead of 401
**Cause**: Endpoint doesn't exist or middleware not checking auth
**Fix**: Implement endpoint and return 401 for unauthenticated requests

### Issue 4: Sandbox Callback Requires Auth
**Symptom**: Sandbox callback returns 401
**Cause**: Endpoint is protected by auth middleware
**Fix**: Exclude sandbox callback from auth middleware (it creates the session)

---

## Summary

**For Sandbox SP-API to work, backend MUST**:

1. ✅ **POST `/api/v1/integrations/amazon/sandbox/callback`**:
   - Accept POST without authentication
   - Parse `{"state": "..."}` from JSON body
   - Create sandbox user/session
   - Generate JWT token
   - **SET HTTP-ONLY COOKIE** with JWT
   - Return `{"ok": true, "connected": true}`

2. ✅ **GET `/api/auth/me`**:
   - Extract JWT from cookie
   - Validate JWT signature and expiration
   - Return user profile or 401

3. ✅ **GET `/api/v1/integrations/status`**:
   - Extract JWT from cookie
   - Validate JWT
   - Return `{"amazon_connected": true, ...}`

4. ✅ **CORS Configuration**:
   - Allow credentials: `credentials: true`
   - Allow frontend origin
   - Allow `Content-Type` header

5. ✅ **Cookie Configuration**:
   - `HttpOnly: true`
   - `Secure: true` (production)
   - `SameSite: None` (cross-origin)
   - `Path: /`
   - `Max-Age: 604800` (7 days)

**If these are implemented correctly, the sandbox SP-API flow will work end-to-end.**

