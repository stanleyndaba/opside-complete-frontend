# Phase 3.1: Gmail Ingestion Implementation

## 🎯 Goal

Connect Gmail API to evidence ingestion pipeline to automatically collect evidence documents (invoices, receipts, FBA reports) from Gmail.

## ✅ Implementation Complete

### 1. Gmail Ingestion Service (`Integrations-backend/src/services/gmailIngestionService.ts`)

**Features**:
- ✅ Ingest evidence documents from Gmail
- ✅ Search for invoice/receipt emails automatically
- ✅ Extract attachments from emails
- ✅ Store email metadata in database
- ✅ Metadata-first ingestion (store metadata immediately)
- ✅ Link documents to user ID
- ✅ Track ingestion status

**Key Methods**:
- `ingestEvidenceFromGmail()` - Main ingestion method
- `extractAttachmentsFromEmail()` - Extract attachments from Gmail messages
- `storeEvidenceDocument()` - Store document metadata in database
- `triggerParsingPipeline()` - Trigger parsing pipeline (Phase 3.2)
- `getIngestionStatus()` - Get ingestion status for user

### 2. Evidence Routes (`Integrations-backend/src/routes/evidenceRoutes.ts`)

**Endpoints**:
- `POST /api/evidence/ingest/gmail` - Trigger Gmail evidence ingestion
- `GET /api/evidence/status` - Get evidence ingestion status

### 3. Route Registration (`Integrations-backend/src/index.ts`)

- ✅ Evidence routes registered at `/api/evidence`
- ✅ User authentication middleware applied
- ✅ Logging added for route registration

## 📋 Implementation Details

### Gmail Ingestion Flow

1. **Trigger Ingestion**
   - User calls `POST /api/evidence/ingest/gmail`
   - Service searches for emails matching query (default: invoices, receipts, FBA reports)
   - Fetches emails from Gmail API

2. **Extract Attachments**
   - For each email with attachments:
     - Get full message from Gmail API
     - Recursively extract attachments from message parts
     - Download attachment content

3. **Store Metadata**
   - Store document metadata in `evidence_documents` table
   - Create/update evidence source in `evidence_sources` table
   - Link document to user ID
   - Store email metadata (subject, from, date, etc.)

4. **Metadata-First Approach**
   - Store metadata immediately for fast queries
   - Document content can be stored later (requires storage bucket setup)
   - Processing status set to 'pending' (will be processed in Phase 3.2)

### Database Schema

Uses existing `evidence_documents` table:
- `source_id` - Links to `evidence_sources` table
- `user_id` - User who owns the document
- `provider` - 'gmail'
- `external_id` - Gmail message ID + attachment ID
- `filename` - Attachment filename
- `content_type` - MIME type
- `metadata` - JSONB with email and attachment metadata
- `processing_status` - 'pending', 'processing', 'completed', 'failed'

### Default Search Query

```
from:amazon.com OR from:amazon.co.uk OR subject:(invoice OR receipt OR "FBA" OR "reimbursement" OR "refund") has:attachment
```

This searches for:
- Emails from Amazon domains
- Emails with invoice/receipt/FBA keywords in subject
- Emails with attachments

## 🧪 Testing

### Test 1: Gmail Ingestion

```bash
# Trigger Gmail ingestion
curl -X POST https://your-node-backend.onrender.com/api/evidence/ingest/gmail \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-User-Id: YOUR_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "from:amazon.com has:attachment",
    "maxResults": 10,
    "autoParse": true
  }'
```

### Test 2: Get Ingestion Status

```bash
# Get ingestion status
curl -X GET https://your-node-backend.onrender.com/api/evidence/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-User-Id: YOUR_USER_ID"
```

## 📝 Next Steps

### Phase 3.2: Parsing Pipeline Integration

1. **Integrate OCR Service**
   - Connect OCR service to document processing
   - Extract text from PDFs/images
   - Store OCR text in database

2. **Connect Parsers**
   - Connect PDF parser
   - Connect email parser
   - Extract structured fields (ASIN, order ID, date, cost)

3. **Update Processing Status**
   - Update document status to 'processing'
   - Update document status to 'completed' after parsing
   - Store extracted data in `extracted_data` JSONB field

### Phase 3.3: Storage Bucket Setup

1. **Create Storage Bucket**
   - Create 'evidence-documents' bucket in Supabase Storage
   - Configure bucket permissions
   - Set up RLS policies

2. **Store Document Content**
   - Upload document content to storage bucket
   - Generate signed URLs for document access
   - Update document with storage URL

## 🔍 Known Issues

1. **Storage Bucket Not Configured**
   - Document content is not stored in Supabase Storage yet
   - Requires bucket creation and configuration
   - Metadata is stored, but content needs storage setup

2. **Parsing Pipeline Not Integrated**
   - Parsing pipeline trigger is stubbed
   - Will be implemented in Phase 3.2
   - Documents remain in 'pending' status until parsing is implemented

3. **Error Handling**
   - Some errors are logged but not fully handled
   - Need to improve error recovery
   - Need to handle rate limiting from Gmail API

## 📊 Success Criteria

- [x] Gmail OAuth working
- [x] Emails can be fetched
- [x] Attachments can be extracted
- [x] Email metadata stored in database
- [x] Ingestion triggered via API endpoint
- [x] User-specific data filtering
- [ ] Document content stored in storage (requires bucket setup)
- [ ] Parsing pipeline triggered (Phase 3.2)
- [ ] Full end-to-end testing

## 🚀 Status

**Phase 3.1: Gmail Ingestion Integration - ✅ COMPLETE**

Ready to proceed with Phase 3.2: Parsing Pipeline Integration.

