# Phase 3: Evidence Ingestion & Parsing Pipeline - Test Guide

## 🧪 Test Overview

This guide covers testing the Phase 3 implementation: Gmail ingestion, document storage, and parsing pipeline integration.

## 📋 Prerequisites

1. **Node.js Backend Running**
   - URL: `http://localhost:3001` (or your deployed URL)
   - Evidence routes registered at `/api/evidence`

2. **Python API Running**
   - URL: `http://localhost:8000` (or your deployed URL)
   - Parser router enabled at `/api/v1/evidence/parse/*`

3. **Gmail Connected** (Optional)
   - Gmail OAuth connected via `/api/v1/integrations/gmail/auth`
   - Gmail token stored in database

4. **Database Access**
   - Supabase database with `evidence_documents` table
   - `parser_jobs` and `parser_job_results` tables

## 🚀 Running Tests

### Option 1: PowerShell Test Script

```powershell
# Basic test (default localhost URLs)
.\test-phase3-evidence-ingestion.ps1

# Custom URLs and user ID
.\test-phase3-evidence-ingestion.ps1 `
  -NodeBackendUrl "https://your-node-backend.onrender.com" `
  -PythonApiUrl "https://your-python-api.onrender.com" `
  -UserId "your-user-id" `
  -AuthToken "your-auth-token"
```

### Option 2: Manual API Testing

#### Test 1: Check Gmail Ingestion Status

```bash
curl -X GET "http://localhost:3001/api/evidence/status" \
  -H "X-User-Id: your-user-id" \
  -H "Authorization: Bearer your-token"
```

**Expected Response:**
```json
{
  "success": true,
  "hasConnectedSource": true,
  "lastIngestion": "2024-01-01T00:00:00Z",
  "documentsCount": 10,
  "processingCount": 2
}
```

#### Test 2: Trigger Gmail Ingestion

```bash
curl -X POST "http://localhost:3001/api/evidence/ingest/gmail" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: your-user-id" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "query": "from:amazon.com has:attachment",
    "maxResults": 10,
    "autoParse": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "documentsIngested": 5,
  "emailsProcessed": 10,
  "errors": [],
  "message": "Ingested 5 documents from 10 emails"
}
```

#### Test 3: Check Parser Jobs

```bash
curl -X GET "http://localhost:8000/api/v1/evidence/parse/jobs" \
  -H "X-User-Id: your-user-id" \
  -H "Authorization: Bearer your-token"
```

**Expected Response:**
```json
{
  "ok": true,
  "data": {
    "jobs": [
      {
        "id": "job-id",
        "document_id": "doc-id",
        "status": "completed",
        "parser_type": "pdf",
        "confidence_score": 0.85
      }
    ],
    "total": 1
  }
}
```

#### Test 4: Get Document with Parsed Data

```bash
curl -X GET "http://localhost:8000/api/v1/evidence/documents/{document_id}" \
  -H "X-User-Id: your-user-id" \
  -H "Authorization: Bearer your-token"
```

**Expected Response:**
```json
{
  "id": "doc-id",
  "filename": "invoice.pdf",
  "processing_status": "completed",
  "parser_status": "completed",
  "parser_confidence": 0.85,
  "parsed_metadata": {
    "supplier_name": "Amazon",
    "invoice_number": "INV-123",
    "invoice_date": "2024-01-01",
    "total_amount": 100.00,
    "currency": "USD",
    "line_items": [...]
  }
}
```

#### Test 5: Manually Trigger Parsing

```bash
curl -X POST "http://localhost:8000/api/v1/evidence/parse/{document_id}" \
  -H "X-User-Id: your-user-id" \
  -H "Authorization: Bearer your-token"
```

**Expected Response:**
```json
{
  "job_id": "job-id",
  "status": "pending",
  "message": "Document parsing started",
  "estimated_completion": "2-5 minutes"
}
```

## ✅ Test Checklist

### Gmail Ingestion
- [ ] Gmail ingestion status endpoint returns correct data
- [ ] Gmail ingestion trigger works
- [ ] Documents are stored in `evidence_documents` table
- [ ] Document metadata is stored correctly
- [ ] Email attachments are extracted

### Parsing Pipeline
- [ ] Parsing pipeline is triggered after ingestion
- [ ] Parser job is created in `parser_jobs` table
- [ ] Document status is updated to 'processing'
- [ ] Parser processes document correctly
- [ ] Parsed data is stored in `parser_job_results` table
- [ ] Document status is updated to 'completed'

### Document Retrieval
- [ ] Document retrieval endpoint works
- [ ] Parsed metadata is returned correctly
- [ ] Document search by metadata works
- [ ] Parser job status endpoint works

## 🔍 Troubleshooting

### Issue: Gmail Ingestion Fails

**Symptoms:**
- `Gmail Ingestion Trigger` test fails
- Error: "No Gmail token found"

**Solution:**
1. Connect Gmail account:
   ```bash
   curl -X GET "http://localhost:3001/api/v1/integrations/gmail/auth" \
     -H "X-User-Id: your-user-id"
   ```
2. Complete OAuth flow
3. Verify token is stored in database

### Issue: Parsing Pipeline Not Triggered

**Symptoms:**
- Documents ingested but not parsed
- Parser jobs not created

**Solution:**
1. Check Python API is running
2. Verify parser router is enabled in `src/app.py`
3. Check `PYTHON_API_URL` environment variable in Node.js backend
4. Verify `X-User-Id` header is forwarded correctly

### Issue: Parser Jobs Not Processing

**Symptoms:**
- Parser jobs stuck in 'pending' status
- No parsed data in database

**Solution:**
1. Check parser worker is running
2. Verify database connection
3. Check parser worker logs
4. Verify document content is accessible

### Issue: Document Content Not Available

**Symptoms:**
- Documents stored but content not accessible
- Parser fails with "Document not found"

**Solution:**
1. Check Supabase Storage bucket is created
2. Verify document content is stored in storage
3. Check storage permissions
4. Verify `download_url` is set correctly

## 📊 Expected Test Results

### All Tests Pass
```
✅ PASS - Gmail Ingestion Status
✅ PASS - Gmail Ingestion Trigger
✅ PASS - Document Storage
✅ PASS - Parsing Pipeline Trigger
✅ PASS - Parser Job Creation
✅ PASS - Document Retrieval

📊 Test Summary: 6/6 tests passed
🎉 All tests passed! Phase 3 implementation is working correctly.
```

### Partial Tests Pass (Expected)
```
✅ PASS - Gmail Ingestion Status
⚠️  FAIL - Gmail Ingestion Trigger (Gmail not connected)
⚠️  FAIL - Document Storage (No documents ingested)
✅ PASS - Parsing Pipeline Trigger
✅ PASS - Parser Job Creation
✅ PASS - Document Retrieval

📊 Test Summary: 4/6 tests passed
⚠️  Some tests failed. This may be expected if Gmail is not connected.
```

## 🚀 Next Steps

After successful testing:

1. **Phase 3.3: Evidence Repository**
   - Set up Supabase Storage bucket
   - Implement document content storage
   - Implement document retrieval

2. **Phase 3.4: Evidence Endpoints**
   - Complete all evidence endpoints
   - Add dashboard integration
   - Add evidence search functionality

3. **Phase 3.5: Ingestion Jobs**
   - Implement periodic sync scheduling
   - Add job monitoring
   - Add error handling and retries

## 📝 Notes

- Some tests may fail if Gmail is not connected (this is expected)
- Python API must be running for parsing pipeline tests
- Database must be accessible for all tests
- Storage bucket must be set up for document content storage

## 🔗 Related Documentation

- `PHASE3_IMPLEMENTATION_PLAN.md` - Phase 3 implementation plan
- `PHASE3_GMAIL_INGESTION_IMPLEMENTATION.md` - Gmail ingestion implementation
- `PHASE3_PARSING_PIPELINE_INTEGRATION.md` - Parsing pipeline integration

