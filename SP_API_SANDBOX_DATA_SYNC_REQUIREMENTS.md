# SP-API Sandbox Data Sync Requirements

## Problem Statement

The dashboard shows zeros because the backend isn't fetching real data from Amazon SP-API sandbox. We need to ensure the backend:

1. **Calls SP-API sandbox endpoints** after OAuth completes
2. **Fetches real orders, inventory, and fee data** from Amazon
3. **Processes and stores the data** for recovery detection
4. **Returns aggregated recovery data** to the frontend

---

## Required Backend Implementation

### Step 1: After OAuth Callback Completes

When `/api/v1/integrations/amazon/auth/callback` is called (or sandbox callback), the backend MUST:

```javascript
// Pseudo-code for what backend should do
async function handleAmazonCallback(req, res) {
  // 1. Store OAuth tokens (access_token, refresh_token)
  await storeAmazonTokens(userId, {
    access_token: req.body.access_token,
    refresh_token: req.body.refresh_token,
    expires_at: Date.now() + 3600000 // 1 hour
  });
  
  // 2. Immediately trigger initial sync
  const syncJob = await startAmazonSync(userId);
  
  // 3. Return success
  res.json({ ok: true, connected: true, syncId: syncJob.id });
}
```

### Step 2: Sync Process - Fetch from SP-API Sandbox

The sync job MUST call these Amazon SP-API sandbox endpoints:

#### 2.1 Fetch Orders (Last 12 Months)

```javascript
// GET /orders/v0/orders
async function fetchOrders(refreshToken) {
  const accessToken = await getAccessToken(refreshToken);
  
  const response = await fetch(
    'https://sandbox.sellingpartnerapi-na.amazon.com/orders/v0/orders?' +
    `CreatedAfter=${encodeURIComponent(getDate12MonthsAgo().toISOString())}&` +
    `MarketplaceIds=ATVPDKIKX0DER`, // US marketplace
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return await response.json();
}
```

**SP-API Sandbox Endpoint**: `https://sandbox.sellingpartnerapi-na.amazon.com/orders/v0/orders`

**Returns**: Mock order data for testing

#### 2.2 Fetch Financial Events

```javascript
// GET /finances/v0/financialEvents
async function fetchFinancialEvents(refreshToken) {
  const accessToken = await getAccessToken(refreshToken);
  
  const response = await fetch(
    'https://sandbox.sellingpartnerapi-na.amazon.com/finances/v0/financialEvents?' +
    `PostedAfter=${encodeURIComponent(getDate12MonthsAgo().toISOString())}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return await response.json();
}
```

**SP-API Sandbox Endpoint**: `https://sandbox.sellingpartnerapi-na.amazon.com/finances/v0/financialEvents`

**Returns**: Mock financial events (fees, refunds, reimbursements)

#### 2.3 Fetch Inventory Summaries

```javascript
// GET /fba/inventory/v1/summaries
async function fetchInventorySummaries(refreshToken) {
  const accessToken = await getAccessToken(refreshToken);
  
  const response = await fetch(
    'https://sandbox.sellingpartnerapi-na.amazon.com/fba/inventory/v1/summaries?' +
    'marketplaceIds=ATVPDKIKX0DER',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return await response.json();
}
```

**SP-API Sandbox Endpoint**: `https://sandbox.sellingpartnerapi-na.amazon.com/fba/inventory/v1/summaries`

**Returns**: Mock inventory data

### Step 3: Process Data and Detect Claims

After fetching data, the backend MUST:

```javascript
async function processAmazonData(orders, financialEvents, inventory) {
  // 1. Analyze orders for lost inventory
  const lostInventoryClaims = detectLostInventory(orders, inventory);
  
  // 2. Analyze fees for overcharges
  const feeOverchargeClaims = detectFeeOvercharges(financialEvents);
  
  // 3. Detect missing reimbursements
  const missingReimbursements = detectMissingReimbursements(orders, financialEvents);
  
  // 4. Store claims in database
  const claims = [
    ...lostInventoryClaims,
    ...feeOverchargeClaims,
    ...missingReimbursements
  ];
  
  await Promise.all(claims.map(claim => storeClaim(userId, claim)));
  
  // 5. Calculate totals
  const totalAmount = claims.reduce((sum, claim) => sum + claim.amount, 0);
  const claimCount = claims.length;
  
  return { totalAmount, claimCount, claims };
}
```

### Step 4: Return Real Data from `/api/v1/integrations/amazon/recoveries`

The endpoint MUST return real data from the database:

```javascript
// GET /api/v1/integrations/amazon/recoveries
app.get('/api/v1/integrations/amazon/recoveries', authenticate, async (req, res) => {
  const userId = req.user.id;
  
  // Get claims from database (not from refund engine)
  const claims = await getClaimsFromDatabase(userId);
  
  // Calculate totals
  const totalAmount = claims
    .filter(c => c.status === 'approved' || c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);
    
  const claimCount = claims.length;
  
  res.json({
    totalAmount,
    currency: 'USD',
    claimCount
  });
});
```

---

## Required Environment Variables

The backend MUST have these environment variables set:

```bash
# SP-API Sandbox Configuration
AMAZON_SPAPI_BASE_URL=https://sandbox.sellingpartnerapi-na.amazon.com
AMAZON_SPAPI_CLIENT_ID=amzn1.application-oa2-client.xxx
AMAZON_SPAPI_CLIENT_SECRET=xxx
AMAZON_SPAPI_REDIRECT_URI=https://your-frontend.com/auth/callback

# LWA (Login with Amazon) for token exchange
AMAZON_LWA_TOKEN_URL=https://api.amazon.com/auth/o2/token

# AWS Credentials for signing requests
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
```

---

## Complete Flow After OAuth

```
1. User completes OAuth → Backend receives code
   ↓
2. Backend exchanges code for access_token + refresh_token
   ↓
3. Backend stores tokens in database
   ↓
4. Backend triggers sync job (async)
   ↓
5. Sync job fetches from SP-API sandbox:
   - GET /orders/v0/orders (last 12 months)
   - GET /finances/v0/financialEvents
   - GET /fba/inventory/v1/summaries
   ↓
6. Backend processes data:
   - Detects lost inventory
   - Detects fee overcharges
   - Detects missing reimbursements
   ↓
7. Backend stores claims in database
   ↓
8. Frontend calls GET /api/v1/integrations/amazon/recoveries
   ↓
9. Backend returns real data from database:
   {
     "totalAmount": 1234.56,  // Real calculated amount
     "currency": "USD",
     "claimCount": 42         // Real claim count
   }
```

---

## SP-API Sandbox Endpoints Summary

| Endpoint | Purpose | Returns |
|----------|---------|---------|
| `GET /orders/v0/orders` | Fetch orders | Mock order data |
| `GET /finances/v0/financialEvents` | Fetch financial transactions | Mock fee/refund data |
| `GET /fba/inventory/v1/summaries` | Fetch inventory | Mock inventory data |
| `GET /fees/v0/feesEstimate` | Estimate fees | Mock fee estimates |

All sandbox endpoints return **mock/fake data** for testing. They don't require real seller accounts.

---

## Backend Checklist

For SP-API sandbox to work with real data:

- [ ] Backend stores OAuth tokens after callback
- [ ] Backend triggers sync job after OAuth completes
- [ ] Sync job calls `/orders/v0/orders` with last 12 months date range
- [ ] Sync job calls `/finances/v0/financialEvents` 
- [ ] Sync job calls `/fba/inventory/v1/summaries`
- [ ] Backend processes fetched data to detect claims
- [ ] Backend stores claims in database
- [ ] `/api/v1/integrations/amazon/recoveries` returns data from database
- [ ] Backend uses proper SP-API authentication (LWA tokens + AWS signature)
- [ ] Backend handles SP-API rate limits and pagination

---

## Why Mock Data Won't Work Long-Term

**Mock data is only a temporary fallback**. The real solution is:

1. **Backend must call SP-API sandbox** after OAuth completes
2. **Backend must process and store real data** from SP-API
3. **Backend must return real aggregated data** to frontend

The frontend will continue to show mock data until the backend implements the sync process above.

---

## Next Steps

1. **Verify backend has SP-API integration code** that calls sandbox endpoints
2. **Ensure sync job runs automatically** after OAuth callback
3. **Check database** to see if claims are being stored
4. **Verify `/api/v1/integrations/amazon/recoveries`** reads from database, not refund engine
5. **Test with real SP-API sandbox credentials** to ensure data flows through

Once the backend implements this flow, the dashboard will show real data from SP-API sandbox instead of zeros or mock data.




