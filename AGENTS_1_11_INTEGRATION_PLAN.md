# 🔌 Frontend Integration Plan: Agents 1-11

## 📊 Current Status

**Frontend API Base URL:**
- Production: `https://opside-node-api.onrender.com`
- Development: `http://localhost:3000` (needs update to match backend port)

**Backend Port:** Likely `3001` (based on codebase references)

**SSE Endpoints:** Already configured but may need updates

---

## 🎯 Integration Tasks

### **1. Update API Base URL Configuration**

**Files to Update:**
- `src/lib/api.ts` - Main API client
- `src/api.js` - Legacy API client
- Environment variables

**Changes:**
- Update development backend from `localhost:3000` to `localhost:3001`
- Ensure production URL matches deployed backend
- Add environment variable support: `VITE_INTEGRATIONS_URL`

---

### **2. Add Agent 1-11 API Methods**

**New Methods Needed in `src/lib/api.ts`:**

#### **Agent 1 (Zero Agent Layer)**
- ✅ Already exists: `connectAmazon()` - OAuth flow
- ✅ Already exists: `getMe()` - User profile
- Add: `getUserProfile()` - Get full user profile with seller info

#### **Agent 2 (Data Sync)**
- ✅ Already exists: `startAmazonSync()` - Trigger sync
- ✅ Already exists: `getSyncStatus()` - Get sync status
- ✅ Already exists: `getSyncActivity()` - Get sync history
- Add: `getNormalizedData()` - Get normalized data from Agent 2

#### **Agent 3 (Claim Detection)**
- ✅ Already exists: `detectionApi.getDetectionResults()` - Get claims
- ✅ Already exists: `detectionApi.getDetectionStatistics()` - Get stats
- Add: `runClaimDetection()` - Trigger detection
- Add: `getDetectionStatus()` - Get detection job status

#### **Agent 4 (Evidence Ingestion)**
- ✅ Already exists: `ingestGmailEvidence()` - Gmail ingestion
- ✅ Already exists: `ingestOutlookEvidence()` - Outlook ingestion
- ✅ Already exists: `ingestGoogleDriveEvidence()` - Drive ingestion
- ✅ Already exists: `ingestDropboxEvidence()` - Dropbox ingestion
- ✅ Already exists: `ingestAllEvidence()` - Unified ingestion
- ✅ Already exists: `getEvidenceStatus()` - Get ingestion status

#### **Agent 5 (Document Parsing)**
- ✅ Already exists: `triggerDocumentParse()` - Trigger parsing
- ✅ Already exists: `getParserJobStatus()` - Get parsing status
- ✅ Already exists: `getDocumentWithParsedData()` - Get parsed document

#### **Agent 6 (Evidence Matching)**
- Add: `runEvidenceMatching()` - Trigger matching
- Add: `getMatchingResults()` - Get matching results
- Add: `getMatchingStatus()` - Get matching job status

#### **Agent 7 (Refund Filing)**
- ✅ Already exists: `submitClaim()` - Submit refund case
- ✅ Already exists: `getRecoveryStatus()` - Get case status
- Add: `getDisputeCases()` - List all cases
- Add: `getDisputeCase()` - Get case details

#### **Agent 8 (Recoveries)**
- ✅ Already exists: `recoveryApi.getRecoveries()` - List recoveries
- ✅ Already exists: `recoveryApi.getRecoveryStatus()` - Get recovery status
- Add: `getRecoveryRecords()` - Get recovery records
- Add: `getReconciliationStatus()` - Get reconciliation status

#### **Agent 9 (Billing)**
- Add: `getBillingTransactions()` - List billing transactions
- Add: `getBillingInvoices()` - List invoices
- Add: `getBillingStatus()` - Get billing status

#### **Agent 10 (Notifications)**
- Add: `getNotifications()` - List notifications
- Add: `markNotificationRead()` - Mark as read
- Add: `getUnreadCount()` - Get unread count

#### **Agent 11 (Learning)**
- Add: `getLearningMetrics()` - Get learning metrics
- Add: `getLearningInsights()` - Get learning insights
- Add: `getThresholdOptimizations()` - Get threshold optimizations

---

### **3. Update SSE Connections**

**Current SSE Hook:** `use-status-stream.ts`
- ✅ Already connects to `/api/sse/status`
- ✅ Handles events: sync, detection, claim, evidence, refund

**Updates Needed:**
- Ensure SSE URL uses correct backend base URL
- Add support for all agent event types
- Update event handlers for Agents 1-11

**New Event Types to Handle:**
- `agent1_oauth_completed` - OAuth flow complete
- `agent2_sync_started` - Data sync started
- `agent2_sync_completed` - Data sync completed
- `agent3_detection_started` - Claim detection started
- `agent3_detection_completed` - Claim detection completed
- `agent4_ingestion_started` - Evidence ingestion started
- `agent4_ingestion_completed` - Evidence ingestion completed
- `agent5_parsing_started` - Document parsing started
- `agent5_parsing_completed` - Document parsing completed
- `agent6_matching_started` - Evidence matching started
- `agent6_matching_completed` - Evidence matching completed
- `agent7_filing_started` - Refund filing started
- `agent7_filing_completed` - Refund filing completed
- `agent8_recovery_detected` - Recovery detected
- `agent8_recovery_reconciled` - Recovery reconciled
- `agent9_billing_charged` - Billing charged
- `agent10_notification_created` - Notification created
- `agent11_learning_completed` - Learning cycle completed

---

### **4. Update Components**

**Components to Update:**

#### **AmazonConnect.tsx** (Agent 1)
- ✅ Already handles OAuth flow
- Update to handle new OAuth callback response format
- Add user profile display after connection

#### **SyncStatus.tsx** (Agent 2)
- ✅ Already displays sync status
- Update to show Agent 2 normalized data
- Add real-time updates via SSE

#### **Detections.tsx** (Agent 3)
- ✅ Already displays detection results
- Update to use new detection API endpoints
- Add real-time detection updates

#### **EvidenceIngestion.tsx** (Agent 4)
- ✅ Already handles evidence ingestion
- Update to show ingestion progress
- Add real-time ingestion updates

#### **New Components Needed:**
- `AgentStatusCard.tsx` - Display status for any agent
- `AgentPipelineView.tsx` - Visual pipeline flow (Agent 1 → 11)
- `LearningInsights.tsx` - Display Agent 11 insights

---

### **5. Environment Variables**

**Required Environment Variables:**
```env
# Backend API URL
VITE_INTEGRATIONS_URL=https://opside-node-api.onrender.com
# or for local: http://localhost:3001

# Frontend URL (for OAuth redirects)
VITE_FRONTEND_URL=https://your-frontend-domain.com
# or for local: http://localhost:5173

# Sandbox mode
VITE_SANDBOX=false
```

---

## 📝 Implementation Steps

### **Step 1: Update API Base URL**
1. Update `src/lib/api.ts` - Change dev backend to `localhost:3001`
2. Update `src/api.js` - Change API_BASE_URL
3. Add environment variable support

### **Step 2: Add Missing API Methods**
1. Add Agent 6-11 API methods to `src/lib/api.ts`
2. Create new API files if needed (e.g., `billingApi.ts`, `learningApi.ts`)
3. Update existing API files with new methods

### **Step 3: Update SSE Connections**
1. Update `use-status-stream.ts` to handle all agent events
2. Update `use-detection-updates.ts` for Agent 3
3. Add new hooks for other agents if needed

### **Step 4: Update Components**
1. Update existing components to use new API methods
2. Add new components for Agents 6-11
3. Add pipeline visualization component

### **Step 5: Test Integration**
1. Test OAuth flow (Agent 1)
2. Test data sync (Agent 2)
3. Test claim detection (Agent 3)
4. Test evidence ingestion (Agent 4)
5. Test full pipeline (Agent 1 → 11)

---

## 🎯 Priority Order

1. **High Priority:**
   - Update API base URL
   - Fix SSE connections
   - Update OAuth flow (Agent 1)
   - Update sync status (Agent 2)
   - Update detection display (Agent 3)

2. **Medium Priority:**
   - Add missing API methods (Agents 6-11)
   - Update evidence ingestion UI (Agent 4)
   - Add notification display (Agent 10)

3. **Low Priority:**
   - Add learning insights UI (Agent 11)
   - Add pipeline visualization
   - Add billing display (Agent 9)

---

## ✅ Success Criteria

- [ ] All API endpoints accessible
- [ ] SSE connections working for all agents
- [ ] OAuth flow complete (Agent 1)
- [ ] Real-time updates working
- [ ] All agent statuses displayed
- [ ] Full pipeline testable from frontend

---

**Ready to start implementation!** 🚀

