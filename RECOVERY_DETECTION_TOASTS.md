# Recovery Detection Toast Notifications

## ✅ Implementation Complete

The Recoveries page now shows toast notifications whenever new recoveries are detected.

---

## 🎯 Features Implemented

### 1. **New Recovery Detection via Claims List Comparison**
   - ✅ Tracks previous claim IDs using `useRef`
   - ✅ Compares current claims with previous claims on each fetch
   - ✅ Detects new recoveries by finding claims not in previous set
   - ✅ Shows toast notification when new recoveries are found

### 2. **Detection Event Toast Notifications**
   - ✅ Listens to SSE `detection` events
   - ✅ Shows toast when detection completes
   - ✅ Displays claim count and total amount if available
   - ✅ Automatically refreshes claims list after detection

### 3. **Recovery Amount Update Notifications**
   - ✅ Tracks previous recovered total amount
   - ✅ Shows toast when recovered amount increases
   - ✅ Displays the increase amount in the toast

---

## 📊 Toast Notification Types

### 1. **Single New Recovery Detected**
```
Title: 🎉 New Recovery Detected!
Description: [Claim Type] found: $X,XXX.XX
Duration: 5 seconds
```

### 2. **Multiple New Recoveries Detected**
```
Title: 🎉 New Recoveries Detected!
Description: X new recoveries found totaling $X,XXX.XX
Duration: 5 seconds
```

### 3. **Detection Event (with count/amount)**
```
Title: 🔍 New Recoveries Detected!
Description: X new recoveries detected totaling $X,XXX.XX
Duration: 6 seconds
```

### 4. **Detection Event (generic)**
```
Title: 🔍 Recovery Detection Complete
Description: Scan completed. Check for new recovery opportunities.
Duration: 5 seconds
```

### 5. **Recovery Amount Increased**
```
Title: 💰 Recovery Amount Updated
Description: Recovered amount increased by $X,XXX.XX
Duration: 5 seconds
```

---

## 🔄 How It Works

### Detection Flow

```
1. User is on Recoveries page
   ↓
2. Claims list is fetched on mount
   ↓
3. Previous claim IDs are stored in ref
   ↓
4. SSE events are listened to:
   - 'detection' events → Show toast + refresh claims
   - 'sync' events → Refresh Amazon recoveries
   - 'recovery'/'claim' events → Update claim status
   ↓
5. When claims list updates:
   - Compare new claims with previous claims
   - Find new claim IDs
   - Show toast if new recoveries found
   - Update previous claim IDs ref
```

### Event Handling

```typescript
useStatusStream((evt) => {
  // Handle detection events
  if (evt.type === 'detection') {
    // Show toast with detection results
    // Refresh claims list
  }
  
  // Handle sync/detection events
  if (evt.type === 'sync' || evt.type === 'detection') {
    // Refresh Amazon recoveries
    // Show toast if recovered amount increased
  }
});
```

---

## 📝 Code Implementation

### State Tracking
```typescript
// Track previous claims to detect new recoveries
const previousClaimIdsRef = useRef<Set<string>>(new Set());
const hasInitializedRef = useRef<boolean>(false);
const previousRecoveredTotalRef = useRef<number>(0);
```

### New Recovery Detection
```typescript
// In useEffect when claims are fetched
if (hasInitializedRef.current) {
  const currentClaimIds = new Set(newClaims.map(c => c.id));
  const previousClaimIds = previousClaimIdsRef.current;
  
  // Find new claims
  const newClaimIds = Array.from(currentClaimIds).filter(id => !previousClaimIds.has(id));
  
  if (newClaimIds.length > 0) {
    // Show toast for new recoveries
    if (newClaimIds.length === 1) {
      // Single recovery toast
    } else {
      // Multiple recoveries toast
    }
  }
}

// Update previous claim IDs
previousClaimIdsRef.current = new Set(newClaims.map(c => c.id));
hasInitializedRef.current = true;
```

### Detection Event Handling
```typescript
if (evt.type === 'detection') {
  const detectionData = (evt as any).data;
  const claimCount = detectionData?.claimCount || detectionData?.count;
  const totalAmount = detectionData?.totalAmount || detectionData?.amount;
  
  // Show toast with detection results
  // Refresh claims list
}
```

---

## ✅ Testing Scenarios

### Scenario 1: New Recovery Detected on Page Load
- User opens Recoveries page
- Claims are fetched
- New recovery is in the list
- ✅ Toast shows: "🎉 New Recovery Detected!"

### Scenario 2: Detection Event Received
- User is on Recoveries page
- Backend sends detection event via SSE
- ✅ Toast shows: "🔍 New Recoveries Detected!"
- Claims list refreshes automatically

### Scenario 3: Multiple New Recoveries
- User is on Recoveries page
- Multiple new recoveries are detected
- ✅ Toast shows: "🎉 New Recoveries Detected! X new recoveries found totaling $X,XXX.XX"

### Scenario 4: Recovery Amount Increased
- User is on Recoveries page
- Amazon recoveries amount increases
- ✅ Toast shows: "💰 Recovery Amount Updated - Recovered amount increased by $X,XXX.XX"

---

## 🚀 User Experience

### Benefits
1. **Immediate Feedback**: Users are notified instantly when new recoveries are detected
2. **Real-time Updates**: Toasts appear as soon as detection completes
3. **Clear Information**: Toasts show claim count and amounts
4. **Non-intrusive**: Toasts auto-dismiss after 5-6 seconds
5. **Multiple Scenarios**: Handles single recovery, multiple recoveries, and amount updates

### Toast Behavior
- Toasts appear in the top-right corner (default toast position)
- Auto-dismiss after 5-6 seconds
- Can be manually dismissed by user
- Multiple toasts can stack if multiple events occur
- Uses appropriate icons (🎉, 🔍, 💰) for visual distinction

---

## 📚 Related Files

- **Recoveries Page**: `src/pages/Recoveries.tsx`
- **Status Stream Hook**: `src/hooks/use-status-stream.ts`
- **Toast Hook**: `src/hooks/use-toast.ts`

---

## 🔍 Notes

- Toasts only show for new recoveries (not on initial page load)
- Detection events trigger both toast and claims list refresh
- Recovery amount updates only show toast if amount increased (not decreased)
- All toasts are non-blocking and don't interrupt user workflow
- Previous claim IDs are tracked using refs to avoid unnecessary re-renders


