# Backend Authentication Requirements

This document outlines what the backend needs to implement for proper authentication with the frontend.

## Overview

The frontend uses **cookie-based authentication** with JWT tokens. All API requests include cookies via `credentials: 'include'`, and the backend must validate JWT tokens from cookies and return appropriate HTTP status codes.

## Required Endpoints

### 1. `GET /api/auth/me`

**Purpose**: Check if the current user is authenticated and get their profile.

**Request**:
- Cookies: Must include JWT session cookie
- Headers: `Content-Type: application/json`
- Credentials: `include` (sent by frontend automatically)

**Response (200 OK - Authenticated)**:
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "amazon_connected": true,
  "stripe_connected": false,
  "created_at": "2024-01-01T00:00:00Z",
  "last_login": "2024-01-15T12:00:00Z"
}
```

**Response (401 Unauthorized - Not Authenticated)**:
```json
{
  "error": "Unauthorized",
  "message": "Please log in or refresh your session"
}
```

**Status Code**: 
- `200` - User is authenticated
- `401` - User is not authenticated (missing/invalid token)

---

### 2. `POST /api/auth/logout`

**Purpose**: Logout the current user and invalidate their session.

**Request**:
- Cookies: Must include JWT session cookie
- Method: POST
- Body: Empty or `{ "ok": true }`

**Response (200 OK)**:
```json
{
  "ok": true,
  "message": "Logged out successfully"
}
```

**What Backend Should Do**:
1. Validate the JWT token from cookie
2. Invalidate the session (remove from database/cache)
3. Clear/expire the session cookie
4. Return 200 OK

**Status Code**: 
- `200` - Logout successful
- `401` - User is not authenticated (optional, could also return 200)

---

### 3. `POST /api/auth/post-login/stripe`

**Purpose**: Handle post-login Stripe onboarding (called after OAuth flows).

**Request**:
- Cookies: Must include JWT session cookie
- Method: POST

**Response (200 OK)**:
```json
{
  "ok": true,
  "stripe_connected": true
}
```

---

## Authentication Middleware

All protected endpoints (except `/api/auth/me`, `/api/auth/logout`, and OAuth endpoints) should:

1. **Extract JWT from Cookie**:
   - Cookie name should be consistent (e.g., `session_token`, `auth_token`, `jwt`)
   - Read from `req.cookies` or `req.headers.cookie`

2. **Validate JWT Token**:
   - Verify signature using `JWT_SECRET`
   - Check expiration (`exp` claim)
   - Validate token structure

3. **Return 401 if Invalid**:
   - Missing cookie → 401
   - Invalid signature → 401
   - Expired token → 401
   - Malformed token → 401

4. **Attach User Context**:
   - Extract `user_id`, `email`, `name`, `amazon_seller_id` from JWT payload
   - Attach to `req.user` for use in route handlers

---

## JWT Token Format

### Payload Structure:
```json
{
  "user_id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "amazon_seller_id": "A1B2C3D4E5F6G7",
  "exp": 1704067200,
  "iat": 1704063600
}
```

### Token Configuration:
- **Algorithm**: HS256
- **Secret**: `JWT_SECRET` (from environment variables)
- **Expiration**: 7 days (configurable)
- **Issued At**: `iat` claim should be set

---

## Cookie Configuration

### Cookie Settings:
```javascript
{
  name: "session_token", // or your preferred name
  httpOnly: true,        // REQUIRED - prevents XSS attacks
  secure: true,          // REQUIRED in production (HTTPS only)
  sameSite: "none",      // REQUIRED for cross-origin requests
  maxAge: 604800,        // 7 days in seconds
  domain: ".yourdomain.com", // Optional: for subdomain sharing
  path: "/"              // Cookie available site-wide
}
```

### Important Notes:
- `httpOnly: true` - Prevents JavaScript access (security)
- `secure: true` - Only sent over HTTPS (production)
- `sameSite: "none"` - Required for cross-origin requests (Vercel frontend → Render backend)
- `sameSite: "lax"` - Can be used if frontend and backend are same domain

---

## CORS Configuration

The backend MUST allow credentials and include the frontend origin:

```javascript
{
  origin: [
    "https://your-frontend.vercel.app",
    "https://opside.com",
    "http://localhost:5173", // Development
    // Add all Vercel preview URLs or use wildcard for development
  ],
  credentials: true,  // REQUIRED - allows cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type"]
}
```

**Critical**: `credentials: true` is required for cookies to work cross-origin.

---

## Error Response Format

### 401 Unauthorized:
```json
{
  "error": "Unauthorized",
  "message": "Please log in or refresh your session"
}
```

**Status Code**: `401`

### 403 Forbidden:
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

**Status Code**: `403`

### 404 Not Found:
```json
{
  "error": "Not Found",
  "message": "Endpoint not found: /api/documents"
}
```

**Status Code**: `404`

---

## Authentication Flow

### 1. User Login (Amazon OAuth):
```
1. Frontend → POST /api/v1/integrations/amazon/auth/start
2. Backend → Redirects to Amazon OAuth
3. Amazon → Callback to backend
4. Backend → Exchange code for tokens
5. Backend → Create/update user in database
6. Backend → Generate JWT token
7. Backend → Set HTTP-only cookie with JWT
8. Backend → Redirect to frontend with success
9. Frontend → Calls GET /api/auth/me to verify session
```

### 2. Protected API Request:
```
1. Frontend → GET /api/documents (with cookie)
2. Backend → Extract JWT from cookie
3. Backend → Validate JWT (signature, expiration)
4. Backend → If valid: Return data (200)
5. Backend → If invalid: Return 401 Unauthorized
6. Frontend → If 401: Show "Please log in" message
```

### 3. User Logout:
```
1. Frontend → POST /api/auth/logout (with cookie)
2. Backend → Validate JWT from cookie
3. Backend → Invalidate session (database/cache)
4. Backend → Clear cookie (set maxAge: 0)
5. Backend → Return 200 OK
6. Frontend → Redirect to login page
```

---

## Required Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-secret-key-here-min-32-chars

# Cookie Configuration
COOKIE_DOMAIN=.yourdomain.com  # Optional
COOKIE_SECURE=true              # true for production
COOKIE_SAME_SITE=none          # "none", "lax", or "strict"

# CORS Configuration
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGINS=https://your-frontend.vercel.app,https://opside.com
```

---

## Testing Checklist

- [ ] `GET /api/auth/me` returns 401 when no cookie is present
- [ ] `GET /api/auth/me` returns 200 with user data when valid cookie is present
- [ ] `GET /api/auth/me` returns 401 when cookie has expired token
- [ ] `GET /api/auth/me` returns 401 when cookie has invalid signature
- [ ] `POST /api/auth/logout` clears the session cookie
- [ ] Protected endpoints return 401 when cookie is missing
- [ ] Protected endpoints return 401 when cookie has invalid token
- [ ] Protected endpoints return 200 when cookie has valid token
- [ ] CORS headers include `Access-Control-Allow-Credentials: true`
- [ ] Cookies are set with `httpOnly: true` and `secure: true` (production)
- [ ] Cookies work across origins (Vercel frontend → Render backend)

---

## Common Issues

### Issue: Frontend gets 404 instead of 401
**Problem**: Endpoint doesn't exist
**Solution**: Implement the endpoint and return 401 for unauthenticated requests

### Issue: CORS errors
**Problem**: Backend not allowing credentials or frontend origin
**Solution**: Set `credentials: true` in CORS config and add frontend URL to `origin` array

### Issue: Cookies not being sent
**Problem**: `sameSite` or `secure` settings incorrect
**Solution**: 
- Production: `sameSite: "none"`, `secure: true`
- Development: `sameSite: "lax"`, `secure: false` (localhost)

### Issue: 401 on every request
**Problem**: JWT validation failing or cookie not being read
**Solution**: 
- Check cookie name matches what backend expects
- Verify JWT_SECRET is correct
- Check token expiration logic
- Verify cookie parsing middleware is working

---

## Example Implementation (Node.js/Express)

```javascript
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGINS.split(','),
  credentials: true
}));

// Auth Middleware
function requireAuth(req, res, next) {
  const token = req.cookies.session_token;
  
  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Please log in or refresh your session"
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired session"
    });
  }
}

// Routes
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    id: req.user.user_id,
    email: req.user.email,
    name: req.user.name,
    amazon_connected: true, // Check from database
    stripe_connected: false,  // Check from database
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  });
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  // Invalidate session in database
  // await SessionService.invalidate(req.user.user_id);
  
  res.clearCookie('session_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/'
  });
  
  res.json({ ok: true });
});

// Protected route example
app.get('/api/documents', requireAuth, async (req, res) => {
  // req.user is available here
  const documents = await DocumentService.getUserDocuments(req.user.user_id);
  res.json(documents);
});
```

---

## Summary

The frontend expects:
1. ✅ Cookie-based authentication (JWT in HTTP-only cookies)
2. ✅ `GET /api/auth/me` to check authentication status
3. ✅ `POST /api/auth/logout` to logout
4. ✅ Protected endpoints return 401 (not 404) when unauthenticated
5. ✅ CORS configured to allow credentials from frontend origin
6. ✅ Clear error messages for 401/403/404 responses

If these are implemented correctly, the frontend will properly handle authentication and show appropriate error messages to users.


