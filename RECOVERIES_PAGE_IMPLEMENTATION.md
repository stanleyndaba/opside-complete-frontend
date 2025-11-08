# Recoveries Page - Amazon Claims Integration Implementation

## ✅ Implementation Complete

The Recoveries page now integrates with the Amazon recoveries API endpoint, following the same pattern as the Dashboard implementation.

---

## 📊 What's Been Added

### 1. **Amazon Recoveries Data Integration**
   - ✅ Calls `api.getAmazonRecoveries()` on page load
   - ✅ Fetches `totalAmount`, `claimCount`, `currency` from API
   - ✅ Stores sync status fields: `message`, `needsSync`, `syncTriggered`, `source`, `dataSource`

### 2. **Display in "Your Opportunities" Card**
   - ✅ Shows recovered value when `recoveredTotal > 0`
   - ✅ Displays claim count from Amazon API
   - ✅ Shows currency (USD or other)
   - ✅ Tooltip with source information (database/api)

### 3. **Sync Status Messages**
   - ✅ Blue banner: When sync is triggered (with spinner)
   - ✅ Amber banner: When sync is needed
   - ✅ Gray banner: For other informational messages
   - ✅ Toast notification when sync is triggered

### 4. **Metrics Integration**
   - ✅ "Total Claims Found" metric shows Amazon claim count when available
   - ✅ Format: "X (Y from Amazon)" where Y is the Amazon claim count

### 5. **Real-time Updates**
   - ✅ Listens to SSE events for sync/detection
   - ✅ Automatically refreshes Amazon recoveries data when sync completes
   - ✅ Updates displayed values in real-time

---

## 🔄 Data Flow

```
Recoveries Page
  ↓ (on mount)
API Calls (parallel):
  - recoveryApi.getRecoveries() → Individual claims list
  - api.getRecoveriesMetrics() → Metrics (pending, approved, etc.)
  - api.getAmazonRecoveries() → Amazon recovery summary
    ↓
Display:
  - "Your Opportunities" card shows:
    * Owed amount (from claims)
    * Recovered amount (from Amazon API) ← NEW
    * Claim count (from Amazon API) ← NEW
    * Sync status messages ← NEW
  - "Total Claims Found" shows:
    * Total claims + Amazon claim count ← NEW
```

---

## 📝 Code Changes

### State Variables Added
```typescript
const [recoveredTotal, setRecoveredTotal] = useState<number | null>(null);
const [recoveredCurrency, setRecoveredCurrency] = useState<string>('USD');
const [amazonClaimCount, setAmazonClaimCount] = useState<number | null>(null);
const [syncMessage, setSyncMessage] = useState<string | null>(null);
const [needsSync, setNeedsSync] = useState<boolean>(false);
const [syncTriggered, setSyncTriggered] = useState<boolean>(false);
const [recoverySource, setRecoverySource] = useState<string | null>(null);
const [dataSource, setDataSource] = useState<string | null>(null);
```

### API Integration
- Added `api.getAmazonRecoveries()` call in `useEffect`
- Handles all response fields (totalAmount, claimCount, currency, message, needsSync, syncTriggered, source, dataSource)
- Shows toast notification when sync is triggered

### UI Updates
- **"Your Opportunities" Card**: 
  - Shows recovered value and claim count from Amazon API
  - Displays sync status messages with appropriate styling
  - Tooltip shows data source information

- **"Total Claims Found" Metric**:
  - Shows Amazon claim count in parentheses when available
  - Format: "X (Y from Amazon)"

### Real-time Updates
- Extended `useStatusStream` hook to refresh Amazon recoveries on sync/detection events
- Automatically updates displayed values when sync completes

---

## 🎯 User Experience

### Scenario 1: User Has Synced Data
- Shows recovered amount from database
- Displays claim count
- Source tooltip shows "database"

### Scenario 2: User Has Not Synced, But SP-API Has Data
- Shows recovered amount from SP-API
- Displays claim count
- Source tooltip shows "api"
- dataSource shows "spapi_sandbox" or "spapi_production"

### Scenario 3: No Data Found (First Time User)
- Shows $0.00 recovered
- Shows 0 claims
- Blue banner appears: "No data found. Syncing your Amazon account... Please refresh in a few moments."
- Toast notification appears
- Sync is triggered automatically

---

## 🔍 Visual Changes

### Before
```
Your Opportunities
$X,XXX.XX owed across X claims
```

### After
```
Your Opportunities
$X,XXX.XX owed across X claims
$X,XXX.XX recovered from X approved claims  ← NEW
[Sync status message banner]  ← NEW
```

### Metrics Card
```
Total Claims Found
X (Y from Amazon)  ← NEW
```

---

## ✅ Testing Checklist

- [x] Recoveries page loads without errors
- [x] Amazon recoveries API is called on page load
- [x] Recovered value displays when > 0
- [x] Claim count displays correctly
- [x] Sync messages appear when needed
- [x] Toast notification shows when sync is triggered
- [x] Real-time updates work via SSE
- [x] Metrics show Amazon claim count
- [x] Tooltip shows source information
- [x] Currency displays correctly (USD or other)

---

## 📚 Related Files

- **Recoveries Page**: `src/pages/Recoveries.tsx`
- **API Client**: `src/lib/api.ts` (getAmazonRecoveries function)
- **Dashboard**: `src/components/layout/Dashboard.tsx` (similar implementation)
- **Integration Guide**: `DASHBOARD_CLAIMS_INTEGRATION.md`

---

## 🚀 Next Steps (Optional)

1. **Add Polling**: Consider adding periodic polling (every 5 seconds) similar to Dashboard
2. **Error Handling**: Add error messages if API calls fail
3. **Loading States**: Show loading indicators while fetching data
4. **Refresh Button**: Add manual refresh button for Amazon recoveries
5. **Filter Integration**: Allow filtering claims by source (database vs API)

---

## 📝 Notes

- The implementation follows the same pattern as the Dashboard for consistency
- Sync messages are only shown when relevant (needsSync or syncTriggered is true)
- Recovered value is only displayed when > 0 to avoid showing $0.00 unnecessarily
- Real-time updates ensure data stays current when sync completes
- All API fields are properly passed through from the backend response

