# 🧪 Agent 1 Test Guide: Zero Agent Layer (OAuth)

## 📋 Overview

This guide explains how to test Agent 1 (Zero Agent Layer) in the frontend. Agent 1 handles:
- OAuth authentication with Amazon SP-API
- User/tenant creation
- Token storage (encrypted)
- Initial sync trigger

---

## 🚀 Quick Start

### **1. Access the Test Page**

Navigate to: **`http://localhost:5173/test/agent1`** (or your frontend URL)

### **2. Run Automated Tests**

Click **"Run All Tests"** to execute all 7 test cases automatically.

### **3. Test OAuth Flow**

Use the **"Connect Amazon Account"** button to test the full OAuth flow (will redirect to Amazon).

---

## 📊 Test Cases

### **Test 1: API Base URL Configuration**
- **Purpose:** Verifies backend URL is correctly configured
- **Expected:** `localhost:3001` in development mode
- **What it checks:**
  - API base URL uses correct port (3001)
  - Environment variable support works

### **Test 2: OAuth Start Endpoint**
- **Purpose:** Tests OAuth initiation endpoint
- **Endpoint:** `GET /api/v1/integrations/amazon/auth/start`
- **Expected:** Returns `auth_url` for Amazon OAuth
- **What it checks:**
  - Endpoint is accessible
  - Returns valid OAuth URL
  - Handles frontend URL correctly

### **Test 3: Get User Profile**
- **Purpose:** Retrieves user profile after OAuth
- **Endpoint:** `GET /api/auth/me`
- **Expected:** Returns user profile with seller info
- **What it checks:**
  - User profile retrieval works
  - Seller ID is present
  - Profile data is complete

### **Test 4: Get Connection Status**
- **Purpose:** Checks Amazon connection status
- **Endpoint:** `GET /api/v1/integrations/amazon/status`
- **Expected:** Returns connection status
- **What it checks:**
  - Connection status is accurate
  - Sandbox mode detection
  - Last sync timestamp

### **Test 5: Get Integrations Status**
- **Purpose:** Gets overall integrations status
- **Endpoint:** `GET /api/v1/integrations/status`
- **Expected:** Returns all integrations status
- **What it checks:**
  - Amazon connection status
  - Evidence sources status
  - Last sync/ingest timestamps

### **Test 6: Verify Token Storage**
- **Purpose:** Verifies tokens are stored (indirect check)
- **Method:** Checks connection status (if connected, tokens exist)
- **Expected:** Tokens are stored if Amazon is connected
- **What it checks:**
  - Token storage works
  - Connection persists after OAuth

### **Test 7: OAuth Callback Endpoint**
- **Purpose:** Verifies callback endpoint exists
- **Endpoint:** `GET /api/v1/integrations/amazon/auth/callback`
- **Expected:** Endpoint exists (even if returns error without code)
- **What it checks:**
  - Callback endpoint is accessible
  - Handles OAuth redirect correctly

---

## 🔄 Full OAuth Flow Test

### **Step-by-Step:**

1. **Click "Connect Amazon Account"**
   - Frontend calls `/api/v1/integrations/amazon/auth/start`
   - Backend returns OAuth URL
   - Frontend redirects to Amazon

2. **Amazon OAuth Page**
   - User authorizes access
   - Amazon redirects to callback URL

3. **OAuth Callback**
   - Backend receives `code` parameter
   - Backend exchanges code for tokens
   - Backend creates/updates user
   - Backend stores encrypted tokens
   - Backend triggers initial sync (Agent 2)

4. **Frontend Redirect**
   - User redirected to `/auth/callback`
   - Frontend polls for connection status
   - Frontend displays success message

---

## ✅ Success Criteria

### **All Tests Pass:**
- ✅ API base URL configured correctly
- ✅ OAuth start endpoint works
- ✅ User profile retrieved
- ✅ Connection status accurate
- ✅ Integrations status works
- ✅ Token storage verified
- ✅ Callback endpoint exists

### **OAuth Flow Works:**
- ✅ OAuth URL generated
- ✅ Redirect to Amazon works
- ✅ Callback processes correctly
- ✅ User created/updated
- ✅ Tokens stored (encrypted)
- ✅ Initial sync triggered

---

## 🐛 Troubleshooting

### **Test 1 Fails: API Base URL**
- **Issue:** Wrong backend URL
- **Fix:** Check `VITE_INTEGRATIONS_URL` environment variable
- **Expected:** `http://localhost:3001` in dev

### **Test 2 Fails: OAuth Start**
- **Issue:** Backend not running or endpoint missing
- **Fix:** 
  - Verify backend is running on port 3001
  - Check backend logs for errors
  - Verify route is registered

### **Test 3 Fails: User Profile**
- **Issue:** User not authenticated or endpoint missing
- **Fix:**
  - Complete OAuth flow first
  - Check authentication cookies
  - Verify `/api/auth/me` endpoint exists

### **Test 4/5 Fail: Connection Status**
- **Issue:** Amazon not connected or endpoint missing
- **Fix:**
  - Complete OAuth flow first
  - Check backend connection status logic
  - Verify tokens are stored

### **Test 6 Fails: Token Storage**
- **Issue:** Tokens not stored after OAuth
- **Fix:**
  - Check backend token storage logic
  - Verify encryption is working
  - Check database for `tokens` table

### **Test 7 Fails: Callback Endpoint**
- **Issue:** Callback endpoint not found
- **Fix:**
  - Verify route is registered in backend
  - Check route path matches frontend redirect URL
  - Verify CORS is configured

---

## 📝 Manual Testing Checklist

- [ ] Navigate to `/test/agent1`
- [ ] Run all automated tests
- [ ] Verify all tests pass
- [ ] Click "Connect Amazon Account"
- [ ] Complete OAuth flow
- [ ] Verify redirect to callback page
- [ ] Check user profile is displayed
- [ ] Verify connection status shows "Connected"
- [ ] Check tokens are stored (via backend logs/database)
- [ ] Verify initial sync is triggered (Agent 2)

---

## 🔗 Related Files

- **Test Page:** `src/pages/Agent1Test.tsx`
- **OAuth Component:** `src/components/AmazonConnect.tsx`
- **Callback Handler:** `src/pages/OAuthCallback.tsx`
- **API Client:** `src/lib/api.ts`
- **Backend Route:** `Integrations-backend/src/routes/amazonRoutes.ts`
- **Backend Controller:** `Integrations-backend/src/controllers/amazonController.ts`

---

## 🎯 Next Steps

After Agent 1 tests pass:
1. Test Agent 2 (Data Sync) - Verify sync triggers after OAuth
2. Test Agent 3 (Claim Detection) - Verify claims are detected
3. Test full pipeline (Agent 1 → 11)

---

**Ready to test!** Navigate to `/test/agent1` and run the tests. 🚀

