# Phase 3: Frontend Quick Start Guide

## 🚀 Quick Overview

The frontend needs to implement UI components for Phase 3: Evidence Ingestion & Document Parsing. This allows users to:
1. Connect Gmail account
2. Ingest evidence documents from Gmail
3. View documents and parsing status
4. Search and filter documents
5. View parsed data (invoices, receipts, etc.)

## 📋 Required API Endpoints

### Node.js Backend
- `GET /api/v1/integrations/gmail/auth` - Initiate Gmail OAuth
- `GET /api/v1/integrations/gmail/status` - Get Gmail connection status
- `POST /api/evidence/ingest/gmail` - Trigger Gmail evidence ingestion
- `GET /api/evidence/status` - Get ingestion status

### Python API
- `GET /api/documents` - Get documents list
- `GET /api/documents/{id}` - Get document details
- `POST /api/v1/evidence/parse/{document_id}` - Trigger document parsing
- `GET /api/v1/evidence/parse/jobs/{job_id}` - Get parser job status
- `GET /api/v1/evidence/documents/{id}` - Get document with parsed data

## 🎨 Essential UI Components

### 1. Gmail Connection Button
```tsx
// Connect Gmail button that redirects to OAuth flow
<Button onClick={handleConnectGmail}>Connect Gmail</Button>
```

### 2. Evidence Ingestion Button
```tsx
// Trigger Gmail ingestion
<Button onClick={handleIngestEvidence}>Ingest Evidence from Gmail</Button>
```

### 3. Document List
```tsx
// Display list of evidence documents
<DocumentList documents={documents} />
```

### 4. Parsing Status Badge
```tsx
// Show parsing status for each document
<Badge status={document.parser_status}>
  {document.parser_status}
</Badge>
```

### 5. Parsed Data Display
```tsx
// Show parsed invoice data
<ParsedData data={document.parsed_metadata} />
```

## 📱 Key User Flows

### Flow 1: Connect Gmail
1. User clicks "Connect Gmail" button
2. Redirects to Gmail OAuth
3. User authorizes
4. Returns to app with Gmail connected

### Flow 2: Ingest Evidence
1. User clicks "Ingest Evidence from Gmail"
2. Shows loading/progress indicator
3. Displays results (documents ingested, emails processed)
4. Documents appear in document list

### Flow 3: View Document
1. User clicks on document card
2. Opens document details modal
3. Shows parsing status
4. Shows parsed data (if available)

## 🔗 Integration Points

### Dashboard Integration
- Add "Evidence" section to dashboard
- Show evidence count/stats
- Show recent evidence documents
- Link to evidence management page

### Claims Integration (Future)
- Link evidence to claims
- Show evidence matches
- Show evidence validation status

## 🎯 Implementation Priority

### Phase 1: Core Features (Do First)
1. ✅ Gmail connection button
2. ✅ Evidence ingestion button
3. ✅ Document list view
4. ✅ Parsing status display

### Phase 2: Enhanced Features (Do Next)
1. ✅ Document details modal
2. ✅ Document search/filter
3. ✅ Parsed data display
4. ✅ Document upload

### Phase 3: Advanced Features (Do Later)
1. ✅ Evidence matching display
2. ✅ Evidence by claim
3. ✅ Data visualization
4. ✅ Advanced search

## 📝 Example API Calls

### Connect Gmail
```typescript
const connectGmail = async () => {
  const response = await fetch('/api/v1/integrations/gmail/auth', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  window.location.href = data.authUrl;
};
```

### Ingest Evidence
```typescript
const ingestEvidence = async () => {
  const response = await fetch('/api/evidence/ingest/gmail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query: 'from:amazon.com has:attachment',
      maxResults: 50,
      autoParse: true
    })
  });
  return await response.json();
};
```

### Get Documents
```typescript
const getDocuments = async () => {
  const response = await fetch('/api/documents', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
```

### Get Parsing Status
```typescript
const getParsingStatus = async (documentId: string) => {
  const response = await fetch(`/api/v1/evidence/documents/${documentId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
```

## 🎨 UI/UX Recommendations

### Status Colors
- **Connected**: Green
- **Processing**: Yellow/Orange
- **Completed**: Green
- **Failed**: Red

### Loading States
- Show spinners during ingestion
- Show progress bars for parsing
- Disable buttons during operations

### Error Handling
- Show toast notifications for errors
- Provide retry buttons
- Display clear error messages

## 📊 Dashboard Integration Example

```tsx
// Add to dashboard
<div className="evidence-section">
  <h2>Evidence</h2>
  <div className="stats">
    <StatCard label="Total Documents" value={stats.totalDocuments} />
    <StatCard label="Processing" value={stats.processingDocuments} />
    <StatCard label="Completed" value={stats.completedDocuments} />
  </div>
  <Button onClick={handleIngestEvidence}>Ingest Evidence</Button>
  <DocumentList documents={recentDocuments} />
</div>
```

## 🔍 Testing Checklist

- [ ] Gmail connection works
- [ ] Evidence ingestion works
- [ ] Documents are displayed
- [ ] Parsing status is shown
- [ ] Parsed data is displayed
- [ ] Error handling works
- [ ] Loading states work
- [ ] Responsive design works

## 📚 Full Documentation

See `PHASE3_FRONTEND_IMPLEMENTATION_GUIDE.md` for complete implementation details, code examples, and UI component specifications.

## 🚀 Quick Start

1. **Read the guide**: `PHASE3_FRONTEND_IMPLEMENTATION_GUIDE.md`
2. **Check API endpoints**: Verify endpoints are available
3. **Implement core components**: Start with Gmail connection and ingestion
4. **Test integration**: Test with real Gmail account
5. **Add advanced features**: Document search, filtering, etc.

## 💡 Tips

- Start with core features first
- Test with real Gmail account
- Handle errors gracefully
- Show loading states
- Provide clear user feedback
- Make it responsive

