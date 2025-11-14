# 🔧 Backend Sync Endpoint Requirements - Phase 1

## 🚨 Current Issue

**Error:** `POST /api/v1/integrations/amazon/sync` returns **500 Internal Server Error**

**Frontend Error Message:** "Backend server error. The sync endpoint may not be fully implemented yet. Please check backend logs."

---

## 📋 Endpoint Specification

### **Endpoint:** `POST /api/v1/integrations/amazon/sync`

### **Request Details:**

**URL:** `https://opside-node-api.onrender.com/api/v1/integrations/amazon/sync`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
Cookie: session_token=<JWT_TOKEN> (sent automatically via credentials: 'include')
```

**Request Body:**
```json
{}
```
**Note:** Frontend sends an **empty body** `{}` as per Phase 1 requirements. The endpoint should use session-based authentication to identify the user.

---

## ✅ Expected Backend Implementation

### **1. Authentication & Validation**

```typescript
// Pseudo-code for backend implementation
POST /api/v1/integrations/amazon/sync
1. Extract JWT token from cookies (session_token)
2. Validate JWT token
3. Get user ID from JWT payload
4. Check if Amazon connection exists for this user
   - Query database for amazon_integrations table
   - Check if user has valid refresh_token or access_token
5. If no connection found, return 400 Bad Request
```

### **2. Sync Job Creation**

```typescript
// Backend should:
1. Create a new sync job record in database
   - Generate unique syncId (e.g., "sync_user123_1702345678901")
   - Set status: "running" or "in_progress"
   - Set startedAt: current timestamp
   - Store userId, syncId, status in sync_jobs or similar table

2. Return response IMMEDIATELY (don't wait for sync to complete)
   - This is an async operation
   - Sync should run in background
```

### **3. Expected Response (200 OK)**

```json
{
  "success": true,
  "syncId": "sync_user123_1702345678901",
  "message": "Sync started successfully",
  "status": "running",
  "estimatedDuration": "30-60 seconds"
}
```

### **4. Error Responses**

#### **400 Bad Request** - Amazon Not Connected
```json
{
  "success": false,
  "message": "Amazon account not connected. Please connect your Amazon account first.",
  "error": "amazon_not_connected"
}
```

#### **401 Unauthorized** - Invalid/Missing JWT
```json
{
  "success": false,
  "message": "Unauthorized. Please log in.",
  "error": "unauthorized"
}
```

#### **409 Conflict** - Sync Already Running
```json
{
  "success": false,
  "message": "Sync already in progress. Please wait for current sync to complete.",
  "error": "sync_in_progress",
  "existingSyncId": "sync_user123_1702345678900"
}
```

#### **500 Internal Server Error** - Server Error
```json
{
  "success": false,
  "message": "Failed to start sync. Please try again later.",
  "error": "internal_server_error"
}
```

---

## 🔄 Background Sync Process

After returning the syncId, the backend should:

### **1. Fetch Data from Amazon SP-API**

The sync should fetch the following data in the background:

#### **A. Claims (Financial Events)**
- **Endpoint:** `GET /finances/v0/financialEvents`
- **What to fetch:**
  - Reimbursements
  - Refunds
  - Chargebacks
  - Fee adjustments
- **Store in:** `amazon_claims` or `financial_events` table

#### **B. Inventory Data**
- **Endpoint:** `GET /fba/inventory/v1/summaries`
- **What to fetch:**
  - SKU information
  - Quantity available
  - Quantity reserved
  - Quantity inbound
  - Warehouse locations
- **Store in:** `amazon_inventory` table

#### **C. Orders Data**
- **Endpoint:** `GET /orders/v0/orders`
- **What to fetch:**
  - Order IDs
  - Order dates
  - Order status
  - Order items
  - Fulfillment channel (FBA/FBM)
- **Store in:** `amazon_orders` table

### **2. Update Sync Status**

As the sync progresses, update the sync status:

```typescript
// Update sync progress in database
sync_jobs table:
- progress: 0-100 (percentage)
- status: "running" | "completed" | "failed"
- message: "Fetching claims...", "Processing inventory...", etc.
- completedAt: timestamp (when done)
- results: {
    claims: { count: 37, status: "success" },
    inventory: { count: 150, status: "success" },
    orders: { count: 250, status: "success" }
  }
```

### **3. Complete Sync**

When sync completes:
- Set `status: "completed"`
- Set `progress: 100`
- Set `completedAt: current_timestamp`
- Store results summary

---

## 📊 Database Schema Requirements

### **Sync Jobs Table**

```sql
CREATE TABLE sync_jobs (
  id UUID PRIMARY KEY,
  sync_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'running', 'completed', 'failed'
  progress INTEGER DEFAULT 0, -- 0-100
  message TEXT,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  results JSONB, -- { claims: {count: 37}, inventory: {count: 150}, orders: {count: 250} }
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Amazon Claims Table**

```sql
CREATE TABLE amazon_claims (
  id UUID PRIMARY KEY,
  claim_id VARCHAR(255) NOT NULL, -- e.g., "RMB-12345"
  user_id UUID NOT NULL,
  order_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50), -- 'approved', 'pending', 'denied'
  type VARCHAR(100), -- 'liquidation_reimbursement', 'refund', etc.
  description TEXT,
  created_at TIMESTAMP,
  synced_at TIMESTAMP DEFAULT NOW(),
  is_mock BOOLEAN DEFAULT FALSE,
  mock_scenario VARCHAR(100),
  UNIQUE(user_id, claim_id)
);
```

### **Amazon Inventory Table**

```sql
CREATE TABLE amazon_inventory (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  sku VARCHAR(255) NOT NULL,
  asin VARCHAR(255),
  fnsku VARCHAR(255),
  product_name VARCHAR(500),
  quantity_available INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_inbound INTEGER DEFAULT 0,
  quantity_total INTEGER DEFAULT 0,
  condition VARCHAR(50),
  warehouse_location VARCHAR(255),
  synced_at TIMESTAMP DEFAULT NOW(),
  is_mock BOOLEAN DEFAULT FALSE,
  mock_scenario VARCHAR(100),
  UNIQUE(user_id, sku)
);
```

---

## 🔍 Debugging Steps

### **1. Check Backend Logs**

Look for errors in backend logs when the endpoint is called:
```
POST /api/v1/integrations/amazon/sync
```

Common issues:
- Missing JWT validation
- Database connection errors
- Missing table definitions
- Amazon API authentication failures
- Missing environment variables

### **2. Verify Endpoint Exists**

Check if the route is registered:
```javascript
// Should have route like:
router.post('/api/v1/integrations/amazon/sync', authenticateUser, triggerAmazonSync);
```

### **3. Test with cURL**

```bash
curl -X POST https://opside-node-api.onrender.com/api/v1/integrations/amazon/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=<JWT_TOKEN>" \
  -d '{}' \
  -v
```

### **4. Check Database**

Verify:
- `sync_jobs` table exists
- `amazon_claims` table exists
- `amazon_inventory` table exists
- User has Amazon connection record

---

## ✅ Implementation Checklist

- [ ] Route registered: `POST /api/v1/integrations/amazon/sync`
- [ ] JWT authentication middleware working
- [ ] User ID extraction from JWT
- [ ] Amazon connection validation (check if user has connected Amazon)
- [ ] Sync job creation in database
- [ ] Background job/worker to process sync
- [ ] Amazon SP-API integration for fetching:
  - [ ] Claims/Financial Events
  - [ ] Inventory data
  - [ ] Orders data
- [ ] Data storage in appropriate tables
- [ ] Sync status updates (progress, completion)
- [ ] Error handling for all failure cases
- [ ] Proper response format (success: true, syncId, message)

---

## 🎯 Quick Fix Priority

**If you need a quick fix to unblock frontend testing:**

1. **Minimal Implementation:**
   ```javascript
   POST /api/v1/integrations/amazon/sync
   - Validate JWT
   - Check Amazon connection exists
   - Create sync_job record with status "running"
   - Return { success: true, syncId: "sync_xxx", message: "Sync started" }
   - (Background sync can be implemented later)
   ```

2. **This will allow frontend to:**
   - Show "Sync Started" message
   - Poll for sync status
   - Display sync progress
   - Refresh data when sync completes

---

## 📝 Response Format Reference

### **Success Response:**
```json
{
  "success": true,
  "syncId": "sync_user123_1702345678901",
  "message": "Sync started successfully",
  "status": "running"
}
```

### **Error Response (500):**
```json
{
  "success": false,
  "message": "Failed to sync data",
  "error": "internal_server_error"
}
```

**Note:** The current backend is returning `"Failed to sync data"` which suggests the endpoint exists but is failing during execution. Check:
- Database connection
- Amazon API credentials
- Table existence
- Error handling in the sync function

---

## 🔗 Related Endpoints

The sync endpoint should work with these related endpoints:

1. **GET `/api/v1/integrations/amazon/status`** - Check connection status
2. **GET `/api/sync/status`** - Get sync status (used by frontend for polling)
3. **GET `/api/v1/integrations/amazon/claims`** - Get synced claims
4. **GET `/api/v1/integrations/amazon/inventory`** - Get synced inventory
5. **GET `/api/v1/integrations/amazon/orders`** - Get synced orders

---

## 🚀 Testing

### **Test 1: Basic Sync**
```bash
# 1. User connects Amazon (via bypass or OAuth)
# 2. Call sync endpoint
POST /api/v1/integrations/amazon/sync
Body: {}

# Expected: 200 OK with syncId
```

### **Test 2: No Connection**
```bash
# 1. User NOT connected to Amazon
# 2. Call sync endpoint
POST /api/v1/integrations/amazon/sync
Body: {}

# Expected: 400 Bad Request - "Amazon account not connected"
```

### **Test 3: Invalid Auth**
```bash
# 1. No JWT token or invalid token
# 2. Call sync endpoint
POST /api/v1/integrations/amazon/sync
Body: {}

# Expected: 401 Unauthorized
```

---

## 📞 Next Steps

1. **Check backend logs** for the exact error when `/api/v1/integrations/amazon/sync` is called
2. **Verify endpoint exists** and is properly registered
3. **Check database tables** exist (sync_jobs, amazon_claims, amazon_inventory)
4. **Verify Amazon connection** validation logic
5. **Implement background sync** process (can be async/queue-based)
6. **Test with real JWT token** from authenticated session

---

## 💡 Notes

- The frontend is calling the endpoint correctly according to Phase 1 requirements
- The 500 error indicates a backend implementation issue
- The endpoint should work with **empty body** `{}` and use **session-based auth**
- Sync should be **asynchronous** - return immediately, process in background
- Frontend will poll `/api/sync/status` to check sync progress

---

**Created:** 2024
**Purpose:** Fix 500 error on sync endpoint
**Priority:** High - Blocks Phase 1 testing

