# Dashboard Implementation Summary

## 📊 What's Currently on the Dashboard

### Main Recovery Metrics Card

1. **Your Recovered Value** (Large Display)
   - **Total Amount**: `recoveredTotal` from API (`totalAmount` field)
   - **Currency**: `recoveredCurrency` from API (`currency` field, default: USD)
   - **Claim Count**: `submittedClaimsCount` from API (`claimCount` field)
   - **Display**: Shows "From X claims submitted" when count > 0
   - **Source Info**: Shows data source (database/api) in tooltip

2. **Sync Status Messages** (New - Implemented)
   - **Blue Banner**: When `syncTriggered = true` (sync in progress)
     - Shows spinning refresh icon
     - Displays sync message from API
   - **Amber Banner**: When `needsSync = true` (sync needed)
     - Shows sync needed message
   - **Gray Banner**: For other informational messages

### Three Metric Cards (Below Main Card)

1. **Next Payment Card**
   - Currently: Hardcoded `$26.0K`
   - Source: Should come from `getRecoveriesMetrics()` → `nextPaymentAmount`
   - Status: ⚠️ **Not fully connected to API yet**

2. **Pending Recovery Card**
   - Currently: Hardcoded `$870.01`
   - **Claim Count**: ✅ Connected - Shows `submittedClaimsCount` from API
   - **Total**: ✅ Connected - Shows `recoveredTotal` from API
   - Status: ⚠️ **Pending amount not from API yet**

3. **Approved Card**
   - Currently: Shows `computedApproved` (calculated from recoveredTotal - pendingRecoveryAmount)
   - Source: `approvedRecoveryAmount` from `getRecoveriesMetrics()`
   - Status: ⚠️ **Partially connected** (uses calculated value as fallback)

---

## 🔄 How It Works

### Data Flow

```
Dashboard Component
  ↓ (on mount + every 5 seconds for 1 minute)
API Client (getAmazonRecoveries)
  ↓ (calls)
Backend: /api/v1/integrations/amazon/recoveries
  ↓ (returns)
{
  totalAmount: number,      // ✅ Displayed
  currency: string,         // ✅ Displayed
  claimCount: number,       // ✅ Displayed
  source: "database" | "api",  // ✅ Shown in tooltip
  dataSource: "spapi_sandbox" | "spapi_production",  // ✅ Stored
  message: string,          // ✅ Displayed in banner
  needsSync: boolean,       // ✅ Controls amber banner
  syncTriggered: boolean    // ✅ Controls blue banner + toast
}
```

### API Integration Status

| Field | API Endpoint | Status | Display Location |
|-------|-------------|--------|------------------|
| `totalAmount` | `/api/v1/integrations/amazon/recoveries` | ✅ Connected | Main card (large) |
| `currency` | `/api/v1/integrations/amazon/recoveries` | ✅ Connected | Main card |
| `claimCount` | `/api/v1/integrations/amazon/recoveries` | ✅ Connected | Main card + Pending card |
| `source` | `/api/v1/integrations/amazon/recoveries` | ✅ Connected | Tooltip |
| `message` | `/api/v1/integrations/amazon/recoveries` | ✅ Connected | Sync banner |
| `needsSync` | `/api/v1/integrations/amazon/recoveries` | ✅ Connected | Sync banner styling |
| `syncTriggered` | `/api/v1/integrations/amazon/recoveries` | ✅ Connected | Sync banner + toast |
| `pendingAmount` | `/api/metrics/recoveries` | ⚠️ Not used | Should update Pending card |
| `nextPaymentAmount` | `/api/metrics/recoveries` | ⚠️ Not used | Should update Next Payment card |
| `approvedAmount` | `/api/metrics/recoveries` | ⚠️ Partially used | Should update Approved card |

---

## ✅ What's Working

1. **Recovery Data Display**
   - ✅ Total amount recovered (from approved/completed claims)
   - ✅ Currency (USD or other)
   - ✅ Claim count
   - ✅ Data source (database vs API)

2. **Sync Status Handling**
   - ✅ Shows sync messages when no data found
   - ✅ Displays sync triggered status with spinner
   - ✅ Shows toast notification when sync starts
   - ✅ Handles all three scenarios:
     - User has synced data (database)
     - User has not synced but SP-API has data (API)
     - No data found (triggers sync)

3. **Real-time Updates**
   - ✅ Polls API every 5 seconds for 1 minute
   - ✅ Listens to SSE events for sync/detection updates
   - ✅ Auto-refreshes when sync completes

---

## ⚠️ What Needs Improvement

1. **Pending Recovery Amount**
   - Currently: Hardcoded `$870.01`
   - Should: Use `pendingRecoveryAmount` from `getRecoveriesMetrics()`
   - Status: API call exists, but value not displayed

2. **Next Payment Amount**
   - Currently: Hardcoded `$26.0K`
   - Should: Use `nextPaymentAmount` from `getRecoveriesMetrics()`
   - Status: API call exists, but value not displayed

3. **Approved Amount**
   - Currently: Calculated (`recoveredTotal - pendingRecoveryAmount`)
   - Should: Use `approvedRecoveryAmount` from API when available
   - Status: Partially working (uses API value if available, falls back to calculation)

---

## 🎯 Implementation Status

### ✅ Completed (From DASHBOARD_CLAIMS_INTEGRATION.md)
- [x] Frontend calls `/api/v1/integrations/amazon/recoveries`
- [x] Python API forwards user ID to Node.js backend
- [x] Node.js fetches real claims from SP-API
- [x] Calculates totals and returns summary
- [x] Dashboard displays totalAmount and claimCount
- [x] Shows sync status messages
- [x] Handles sync triggers
- [x] Displays data source information

### ⚠️ Partially Completed
- [ ] Pending recovery amount from API
- [ ] Next payment amount from API
- [ ] Approved amount from API (partially working)

---

## 📝 Code Locations

- **Dashboard Component**: `src/components/layout/Dashboard.tsx`
- **API Client**: `src/lib/api.ts` (getAmazonRecoveries function)
- **Integration Guide**: `DASHBOARD_CLAIMS_INTEGRATION.md`

---

## 🧪 Testing

To test the dashboard:

1. **With Synced Data**:
   - User should see totalAmount and claimCount from database
   - Source should show "database"

2. **With API Data (No Sync)**:
   - User should see totalAmount and claimCount from SP-API
   - Source should show "api"
   - dataSource should show "spapi_sandbox" or "spapi_production"

3. **No Data (First Time)**:
   - User should see $0.00 and 0 claims
   - Blue banner should appear: "No data found. Syncing your Amazon account... Please refresh in a few moments."
   - Toast notification should appear
   - Sync should be triggered automatically

---

## 🚀 Next Steps

1. **Connect Pending Recovery Amount**
   - Update "Pending recovery" card to use `pendingRecoveryAmount` from API
   - Remove hardcoded `$870.01`

2. **Connect Next Payment Amount**
   - Update "Next payment" card to use `nextPaymentAmount` from API
   - Remove hardcoded `$26.0K`

3. **Improve Approved Amount**
   - Always prefer `approvedRecoveryAmount` from API
   - Only calculate as fallback if API doesn't provide it

4. **Add Error Handling**
   - Show error messages if API calls fail
   - Handle network errors gracefully
   - Show loading states


