# Sandbox SP-API Troubleshooting Guide

## Recent Changes Made

### 1. Enhanced Error Logging
- Added detailed console logging in `AmazonSandbox.tsx` to track the sandbox auth flow
- Added logging in `api.ts` for the `completeAmazonSandboxAuth` function
- Improved error messages with status codes and full response details

### 2. Better User Feedback
- Added toast notifications for success and failure cases
- Different error messages for different failure scenarios
- Navigates with error query params for debugging

### 3. Explicit Headers
- Ensured `Content-Type: application/json` header is explicitly set in the sandbox callback request

## How to Debug

### Step 1: Check Browser Console
When you navigate to `/auth/amazon-sandbox`, check the browser console for these logs:

```
[Sandbox] Starting sandbox auth with state: <state>
[Sandbox] Backend URL: <url>
[API] completeAmazonSandboxAuth called with state: <state>
[API] Request body: {"state":"<state>"}
[API] Requesting: <full-url>
[API] Response status: <status>
[Sandbox] Response received: {...}
```

### Step 2: Check Network Tab
1. Open DevTools → Network tab
2. Filter by "sandbox" or "callback"
3. Find the request to `/api/v1/integrations/amazon/sandbox/callback`
4. Check:
   - **Request URL**: Should be `https://opside-node-api.onrender.com/api/v1/integrations/amazon/sandbox/callback`
   - **Request Method**: Should be `POST`
   - **Request Headers**: Should include `Content-Type: application/json`
   - **Request Payload**: Should be `{"state":"demo"}` or similar
   - **Response Status**: Check what status code is returned
   - **Response Body**: Check what the backend is returning

### Step 3: Common Issues to Check

#### Issue 1: 404 Not Found
**Symptom**: Response status 404
**Cause**: Backend endpoint doesn't exist or path is wrong
**Fix**: Verify backend has route `/api/v1/integrations/amazon/sandbox/callback`

#### Issue 2: 500 Internal Server Error
**Symptom**: Response status 500
**Cause**: Backend error processing the request
**Fix**: Check backend logs for error details

#### Issue 3: CORS Error
**Symptom**: Browser console shows CORS error
**Cause**: Backend not allowing requests from frontend origin
**Fix**: Backend needs to add frontend origin to CORS allowed origins

#### Issue 4: Network Error / Timeout
**Symptom**: Request fails with timeout or network error
**Cause**: Backend is sleeping (Render free tier) or unreachable
**Fix**: 
- Wait 30-60 seconds for backend to wake up
- Check backend is running
- Verify backend URL is correct

#### Issue 5: 401 Unauthorized
**Symptom**: Response status 401
**Cause**: Backend requires authentication but session is missing
**Fix**: Check if sandbox endpoint should require auth or if auth is broken

### Step 4: Test Backend Endpoint Directly

You can test the backend endpoint directly using curl or Postman:

```bash
curl -X POST https://opside-node-api.onrender.com/api/v1/integrations/amazon/sandbox/callback \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{"state":"test-state-123"}'
```

Or use the test page at `/amazon-auth-test` in the app.

## Expected Backend Response

The backend should return:

```json
{
  "ok": true,
  "connected": true
}
```

Or on error:

```json
{
  "ok": false,
  "error": "Error message here"
}
```

## Next Steps

1. Run the app and navigate to `/auth/amazon-sandbox?state=demo`
2. Check browser console for logs
3. Check Network tab for the actual request/response
4. Share the console logs and network response to identify the exact issue


