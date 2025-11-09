# Phase 3: Evidence Ingestion & Document Parsing - Implementation Plan

## 🎯 Goal

To automatically collect and interpret all evidence documents (invoices, FBA reports, supplier receipts, emails, etc.) that the claim system from Phase 2 will use to verify and file real reimbursement claims.

## 🔗 Connection to Phase 2

- **Phase 2 Output**: Live claim detection and sync monitoring → identifies potential claim cases
- **Phase 3 Input**: Supporting evidence from external sources (Gmail, Google Drive, Amazon invoices)
- **Bridge**: Connects data layer (SP-API claims) with proof layer (documents + metadata)

## 📊 Current Status Assessment

### ✅ Already Implemented

1. **Gmail OAuth Integration** ✅
   - File: `Integrations-backend/src/services/gmailService.ts`
   - Status: OAuth flow working, email fetching implemented
   - Features: Token management, email search, attachment extraction

2. **Evidence Database Schema** ✅
   - File: `src/migrations/003_evidence_validator.sql`
   - Tables: `evidence_sources`, `evidence_documents`, `evidence_ingestion_jobs`, `evidence_matches`
   - Features: Encrypted token storage, JSONB metadata, proper indexes

3. **Evidence Parser (OCR + Regex)** ⚙️
   - Files: 
     - `Claim Detector Model/claim_detector/src/evidence/parser.py` - Invoice parser
     - `Claim Detector Model/claim_detector/src/evidence/ocr.py` - OCR service
     - `src/parsers/pdf_parser.py` - PDF parser
     - `src/parsers/email_parser.py` - Email parser
   - Status: Partially implemented
   - Features: Invoice parsing, OCR extraction, regex patterns

4. **Evidence Endpoints (Stubs)** ⚠️
   - Files: `src/api/evidence.py`, `Integrations-backend/src/controllers/evidenceController.ts`
   - Status: Basic endpoints exist but need implementation
   - Features: Upload, view, download endpoints

5. **OAuth Connectors** ✅
   - File: `src/evidence/oauth_connectors.py`
   - Status: Gmail, Outlook, Google Drive, Dropbox connectors exist
   - Features: Token exchange, refresh, revocation

### ❌ Needs Implementation

1. **Metadata-First Ingestion** ❌
   - Status: Needs automation
   - Required: Structure evidence before full parsing for faster query & matching

2. **Evidence Repository** ❌
   - Status: Needs implementation
   - Required: Store all ingested documents with normalized metadata

3. **Ingestion Jobs & Scheduling** ❌
   - Status: Not implemented
   - Required: Background tasks for continuous evidence collection

4. **Gmail API Ingestion Integration** ❌
   - Status: OAuth exists but ingestion not connected
   - Required: Connect Gmail API to ingestion pipeline

5. **Parsing Pipeline Integration** ❌
   - Status: Parsers exist but not integrated
   - Required: Upload → OCR → Extract → Store pipeline

6. **Evidence Endpoints Completion** ❌
   - Status: Stubs exist
   - Required: Full implementation with database integration

## 🧩 Core Components to Implement

### Component 1: Gmail API Ingestion ✅→❌
**Current**: OAuth and email fetching exist  
**Needed**: Connect to ingestion pipeline

**Tasks**:
- [ ] Connect Gmail service to evidence ingestion service
- [ ] Implement automatic email search (invoices, receipts, FBA reports)
- [ ] Extract attachments from emails
- [ ] Store email metadata in database
- [ ] Trigger parsing pipeline for attachments

### Component 2: Parsing Pipeline ⚙️→✅
**Current**: Parsers exist but not integrated  
**Needed**: Complete integration pipeline

**Tasks**:
- [ ] Integrate OCR service with document upload
- [ ] Connect PDF parser to ingestion flow
- [ ] Connect email parser to Gmail ingestion
- [ ] Extract structured fields (ASIN, order ID, date, cost)
- [ ] Store extracted metadata in database
- [ ] Handle parsing errors gracefully

### Component 3: Evidence Repository ❌→✅
**Current**: Database schema exists  
**Needed**: Service layer implementation

**Tasks**:
- [ ] Implement evidence document storage service
- [ ] Store documents in Supabase Storage
- [ ] Store metadata in database
- [ ] Link documents to user ID
- [ ] Implement document retrieval
- [ ] Implement document search/filtering

### Component 4: Metadata-First Ingestion ❌→✅
**Current**: Not implemented  
**Needed**: Structure evidence before full parsing

**Tasks**:
- [ ] Extract basic metadata first (filename, date, source)
- [ ] Store metadata immediately for fast queries
- [ ] Queue full parsing as background job
- [ ] Update metadata after parsing completes
- [ ] Implement incremental parsing updates

### Component 5: Ingestion Jobs & Scheduling ❌→✅
**Current**: Job table exists but no scheduler  
**Needed**: Background job processing

**Tasks**:
- [ ] Implement ingestion job queue
- [ ] Schedule periodic Gmail sync
- [ ] Process ingestion jobs in background
- [ ] Track job progress and status
- [ ] Handle job failures and retries
- [ ] Implement job cancellation

### Component 6: Evidence Endpoints ❌→✅
**Current**: Stubs exist  
**Needed**: Full implementation

**Tasks**:
- [ ] Implement `/api/evidence/ingest` endpoint
- [ ] Implement `/api/evidence/documents` endpoint
- [ ] Implement `/api/evidence/sync` endpoint
- [ ] Implement `/api/evidence/auto-collect` endpoint
- [ ] Implement document upload endpoint
- [ ] Implement document search endpoint
- [ ] Add user authentication
- [ ] Add user-specific data filtering

## 🚀 Implementation Roadmap

### Phase 3.1: Gmail Ingestion Integration (Priority 1)
**Goal**: Connect Gmail API to evidence ingestion

**Tasks**:
1. Create Gmail ingestion service
2. Connect Gmail service to evidence ingestion
3. Implement email search and filtering
4. Extract attachments from emails
5. Store email metadata in database
6. Test Gmail ingestion flow

### Phase 3.2: Parsing Pipeline Integration (Priority 2)
**Goal**: Integrate OCR and parsers into ingestion flow

**Tasks**:
1. Integrate OCR service
2. Connect PDF parser
3. Connect email parser
4. Extract structured fields
5. Store extracted metadata
6. Test parsing pipeline

### Phase 3.3: Evidence Repository (Priority 3)
**Goal**: Implement document storage and retrieval

**Tasks**:
1. Implement document storage service
2. Store documents in Supabase Storage
3. Store metadata in database
4. Implement document retrieval
5. Implement document search
6. Test repository functionality

### Phase 3.4: Metadata-First Ingestion (Priority 4)
**Goal**: Implement fast metadata extraction and storage

**Tasks**:
1. Extract basic metadata first
2. Store metadata immediately
3. Queue full parsing jobs
4. Update metadata after parsing
5. Test metadata-first flow

### Phase 3.5: Ingestion Jobs & Scheduling (Priority 5)
**Goal**: Implement background job processing

**Tasks**:
1. Implement job queue
2. Schedule periodic syncs
3. Process jobs in background
4. Track job progress
5. Handle job failures
6. Test job scheduling

### Phase 3.6: Evidence Endpoints (Priority 6)
**Goal**: Complete evidence API endpoints

**Tasks**:
1. Implement all evidence endpoints
2. Add authentication
3. Add user-specific filtering
4. Add error handling
5. Add observability logging
6. Test all endpoints

## 📋 Detailed Task Breakdown

### Task 1: Gmail Ingestion Service
**File**: `Integrations-backend/src/services/gmailIngestionService.ts`

**Implementation**:
```typescript
class GmailIngestionService {
  async ingestEmails(userId: string): Promise<IngestionResult>
  async searchInvoiceEmails(userId: string): Promise<Email[]>
  async extractAttachments(emailId: string, userId: string): Promise<Attachment[]>
  async storeEmailMetadata(email: Email, userId: string): Promise<Document>
}
```

### Task 2: Evidence Ingestion Service Integration
**File**: `src/evidence/ingestion_service.py`

**Enhancement**:
- Connect Gmail service to ingestion pipeline
- Implement automatic email search
- Extract and store attachments
- Trigger parsing pipeline

### Task 3: Parsing Pipeline Integration
**File**: `src/evidence/parsing_pipeline.py` (new)

**Implementation**:
```python
class EvidenceParsingPipeline:
    async def parse_document(document: Document) -> ParsedDocument
    async def extract_metadata(document: Document) -> Metadata
    async def run_ocr(document: Document) -> OCRResult
    async def extract_structured_fields(ocr_text: str) -> StructuredData
```

### Task 4: Evidence Repository Service
**File**: `src/evidence/repository_service.py` (new)

**Implementation**:
```python
class EvidenceRepositoryService:
    async def store_document(document: Document, user_id: str) -> StoredDocument
    async def get_document(document_id: str, user_id: str) -> Document
    async def search_documents(user_id: str, filters: Dict) -> List[Document]
    async def update_metadata(document_id: str, metadata: Dict) -> Document
```

### Task 5: Ingestion Job Scheduler
**File**: `Integrations-backend/src/jobs/evidenceIngestionJob.ts` (new)

**Implementation**:
```typescript
class EvidenceIngestionJob {
  async schedulePeriodicSync(userId: string): Promise<void>
  async processIngestionJob(jobId: string): Promise<void>
  async trackJobProgress(jobId: string, progress: number): Promise<void>
}
```

### Task 6: Evidence Endpoints
**Files**: 
- `src/api/evidence.py` (enhance)
- `Integrations-backend/src/routes/evidenceRoutes.ts` (new)

**Endpoints**:
- `POST /api/evidence/ingest` - Trigger ingestion
- `GET /api/evidence/documents` - Get documents
- `POST /api/evidence/sync` - Sync evidence sources
- `POST /api/evidence/auto-collect` - Enable auto-collect
- `POST /api/evidence/upload` - Upload document
- `GET /api/evidence/search` - Search documents

## 🔍 Success Criteria

### Phase 3.1: Gmail Ingestion ✅
- [ ] Gmail OAuth working
- [ ] Emails can be fetched
- [ ] Attachments can be extracted
- [ ] Email metadata stored in database
- [ ] Ingestion triggered automatically

### Phase 3.2: Parsing Pipeline ✅
- [ ] OCR service integrated
- [ ] PDF parser working
- [ ] Email parser working
- [ ] Structured fields extracted
- [ ] Metadata stored in database

### Phase 3.3: Evidence Repository ✅
- [ ] Documents stored in Supabase Storage
- [ ] Metadata stored in database
- [ ] Documents linked to user ID
- [ ] Document retrieval working
- [ ] Document search working

### Phase 3.4: Metadata-First Ingestion ✅
- [ ] Basic metadata extracted first
- [ ] Metadata stored immediately
- [ ] Full parsing queued as background job
- [ ] Metadata updated after parsing
- [ ] Fast queries possible with metadata

### Phase 3.5: Ingestion Jobs ✅
- [ ] Job queue implemented
- [ ] Periodic syncs scheduled
- [ ] Jobs processed in background
- [ ] Job progress tracked
- [ ] Job failures handled

### Phase 3.6: Evidence Endpoints ✅
- [ ] All endpoints implemented
- [ ] Authentication working
- [ ] User-specific filtering working
- [ ] Error handling implemented
- [ ] Observability logging added

## 🧪 Testing Plan

### Test 1: Gmail Ingestion
- Connect Gmail account
- Trigger ingestion
- Verify emails fetched
- Verify attachments extracted
- Verify metadata stored

### Test 2: Parsing Pipeline
- Upload test document
- Verify OCR runs
- Verify parser extracts fields
- Verify metadata stored
- Verify structured data correct

### Test 3: Evidence Repository
- Store test document
- Retrieve document
- Search documents
- Verify user-specific filtering
- Verify metadata queries

### Test 4: Metadata-First Ingestion
- Upload document
- Verify metadata stored immediately
- Verify full parsing queued
- Verify metadata updated after parsing
- Verify fast queries work

### Test 5: Ingestion Jobs
- Schedule periodic sync
- Verify job created
- Verify job processed
- Verify job progress tracked
- Verify job completion

### Test 6: Evidence Endpoints
- Test all endpoints
- Verify authentication
- Verify user-specific data
- Verify error handling
- Verify observability logging

## 📝 Next Steps

1. **Start with Phase 3.1**: Gmail Ingestion Integration
2. **Then Phase 3.2**: Parsing Pipeline Integration
3. **Then Phase 3.3**: Evidence Repository
4. **Then Phase 3.4**: Metadata-First Ingestion
5. **Then Phase 3.5**: Ingestion Jobs
6. **Finally Phase 3.6**: Evidence Endpoints

## 🎯 Timeline Estimate

- **Phase 3.1**: 2-3 days
- **Phase 3.2**: 2-3 days
- **Phase 3.3**: 2-3 days
- **Phase 3.4**: 1-2 days
- **Phase 3.5**: 2-3 days
- **Phase 3.6**: 2-3 days

**Total**: ~12-17 days for complete Phase 3 implementation

## 🔗 Integration Points

### With Phase 2
- **Claims**: Evidence will be matched to claims from Phase 2
- **Sync**: Evidence ingestion can be triggered after sync
- **Detection**: Evidence can validate detected claims

### With Phase 4 (Future)
- **Matching**: Evidence will be matched to claims
- **Smart Prompts**: Evidence will inform smart prompts
- **Auto-Submit**: Evidence will enable auto-submit

## 📚 Documentation Needed

- [ ] Gmail ingestion setup guide
- [ ] Parsing pipeline documentation
- [ ] Evidence repository API documentation
- [ ] Ingestion jobs documentation
- [ ] Evidence endpoints API documentation
- [ ] Testing guide
- [ ] Deployment guide

