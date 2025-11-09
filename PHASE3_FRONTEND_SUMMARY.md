# Phase 3: Frontend Implementation Summary

## 🎯 What Frontend Needs to Build

Phase 3 adds **Evidence Ingestion & Document Parsing** functionality. Users can connect Gmail, ingest evidence documents, and view parsed data.

## 📋 Frontend Requirements

### ✅ Required Components

1. **Gmail Connection UI**
   - Connect Gmail button
   - Connection status indicator
   - Disconnect button
   - Last sync time

2. **Evidence Ingestion UI**
   - Trigger ingestion button
   - Progress indicator
   - Results display (documents ingested, emails processed)
   - Error handling

3. **Document Management UI**
   - Document list view
   - Document card component
   - Document details modal
   - Document search/filter
   - Document upload (optional)

4. **Parsing Status UI**
   - Parsing status badge
   - Parsing progress indicator
   - Parsed data display
   - Parsing errors display

5. **Dashboard Integration**
   - Evidence stats cards
   - Recent evidence list
   - Quick actions
   - Evidence section in dashboard

## 🔌 API Integration

### Node.js Backend Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/integrations/gmail/auth` | GET | Initiate Gmail OAuth |
| `/api/v1/integrations/gmail/status` | GET | Get Gmail connection status |
| `/api/v1/integrations/gmail/disconnect` | DELETE | Disconnect Gmail |
| `/api/evidence/ingest/gmail` | POST | Trigger Gmail evidence ingestion |
| `/api/evidence/status` | GET | Get ingestion status |

### Python API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/documents` | GET | Get documents list |
| `/api/documents/{id}` | GET | Get document details |
| `/api/documents/{id}/view` | GET | Get document view URL |
| `/api/documents/{id}/download` | GET | Get document download URL |
| `/api/documents/upload` | POST | Upload document |
| `/api/v1/evidence/parse/{document_id}` | POST | Trigger document parsing |
| `/api/v1/evidence/parse/jobs/{job_id}` | GET | Get parser job status |
| `/api/v1/evidence/parse/jobs` | GET | List parser jobs |
| `/api/v1/evidence/documents/{id}` | GET | Get document with parsed data |
| `/api/v1/evidence/documents/search` | GET | Search documents by metadata |

## 🎨 UI Component Structure

```
Evidence Dashboard
├── Gmail Connection Section
│   ├── Connection Status
│   ├── Connect/Disconnect Button
│   └── Last Sync Time
├── Evidence Ingestion Section
│   ├── Ingest Button
│   ├── Progress Indicator
│   └── Results Display
├── Evidence Stats
│   ├── Total Documents
│   ├── Processing Documents
│   ├── Completed Documents
│   └── Failed Documents
└── Documents List
    ├── Document Cards
    ├── Search/Filter
    └── Pagination
```

## 🔄 User Flow Diagrams

### Flow 1: Connect Gmail
```
User clicks "Connect Gmail"
    ↓
Redirect to Gmail OAuth
    ↓
User authorizes
    ↓
Return to app
    ↓
Gmail status: Connected
```

### Flow 2: Ingest Evidence
```
User clicks "Ingest Evidence"
    ↓
Show loading indicator
    ↓
Call POST /api/evidence/ingest/gmail
    ↓
Display results
    ↓
Documents appear in list
    ↓
Parsing starts automatically
```

### Flow 3: View Document
```
User clicks document card
    ↓
Open document details modal
    ↓
Show parsing status
    ↓
Show parsed data (if available)
    ↓
User can view/download
```

## 📊 Data Models

### Gmail Status Response
```typescript
interface GmailStatus {
  connected: boolean;
  lastSync?: string;
  email?: string;
}
```

### Ingestion Status Response
```typescript
interface IngestionStatus {
  hasConnectedSource: boolean;
  lastIngestion?: string;
  documentsCount: number;
  processingCount: number;
}
```

### Ingestion Result Response
```typescript
interface IngestionResult {
  success: boolean;
  documentsIngested: number;
  emailsProcessed: number;
  errors: string[];
  message: string;
}
```

### Document Response
```typescript
interface Document {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  parserStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  parserConfidence?: number;
  parsedMetadata?: ParsedMetadata;
}
```

### Parsed Metadata
```typescript
interface ParsedMetadata {
  supplierName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  currency?: string;
  lineItems?: LineItem[];
  confidenceScore?: number;
}
```

## 🎨 UI Design Recommendations

### Status Indicators
- **Connected**: 🟢 Green badge
- **Disconnected**: ⚪ Gray badge
- **Processing**: 🟡 Yellow badge with spinner
- **Completed**: 🟢 Green badge with checkmark
- **Failed**: 🔴 Red badge with error icon

### Layout
- Use card-based layout for documents
- Show status badges prominently
- Use progress bars for ingestion/parsing
- Show error messages in toast notifications

### Responsive Design
- Mobile-friendly document cards
- Collapsible filters on mobile
- Touch-friendly buttons
- Responsive grid layout

## 🚀 Implementation Steps

### Step 1: Gmail Connection (Day 1)
1. Create Gmail connection component
2. Implement OAuth flow
3. Add connection status display
4. Test Gmail connection

### Step 2: Evidence Ingestion (Day 2)
1. Create ingestion button component
2. Implement ingestion API call
3. Add progress indicator
4. Display results
5. Test ingestion flow

### Step 3: Document List (Day 3)
1. Create document list component
2. Implement document card component
3. Add search/filter functionality
4. Add pagination
5. Test document display

### Step 4: Parsing Status (Day 4)
1. Create parsing status component
2. Implement status polling
3. Display parsed data
4. Handle parsing errors
5. Test parsing status display

### Step 5: Dashboard Integration (Day 5)
1. Add evidence section to dashboard
2. Add evidence stats
3. Add recent evidence list
4. Add quick actions
5. Test dashboard integration

## 📝 Code Examples

### Gmail Connection Component
```tsx
const GmailConnection = () => {
  const [status, setStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
  const handleConnect = async () => {
    const res = await fetch('/api/v1/integrations/gmail/auth');
    const data = await res.json();
    window.location.href = data.authUrl;
  };
  
  return (
    <div>
      <Badge status={status}>
        {status === 'connected' ? 'Connected' : 'Disconnected'}
      </Badge>
      <Button onClick={handleConnect}>
        {status === 'connected' ? 'Disconnect' : 'Connect Gmail'}
      </Button>
    </div>
  );
};
```

### Evidence Ingestion Component
```tsx
const EvidenceIngestion = () => {
  const [ingesting, setIngesting] = useState(false);
  const [result, setResult] = useState(null);
  
  const handleIngest = async () => {
    setIngesting(true);
    const res = await fetch('/api/evidence/ingest/gmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoParse: true })
    });
    const data = await res.json();
    setResult(data);
    setIngesting(false);
  };
  
  return (
    <div>
      <Button onClick={handleIngest} disabled={ingesting}>
        {ingesting ? 'Ingesting...' : 'Ingest Evidence'}
      </Button>
      {result && (
        <div>
          <p>Documents: {result.documentsIngested}</p>
          <p>Emails: {result.emailsProcessed}</p>
        </div>
      )}
    </div>
  );
};
```

### Document List Component
```tsx
const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  
  useEffect(() => {
    fetchDocuments();
  }, []);
  
  const fetchDocuments = async () => {
    const res = await fetch('/api/documents');
    const data = await res.json();
    setDocuments(data.documents);
  };
  
  return (
    <div className="document-list">
      {documents.map(doc => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
};
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
- [ ] Search/filter works
- [ ] Pagination works

## 📚 Documentation

- **Complete Guide**: `PHASE3_FRONTEND_IMPLEMENTATION_GUIDE.md`
- **Quick Start**: `PHASE3_FRONTEND_QUICK_START.md`
- **This Summary**: `PHASE3_FRONTEND_SUMMARY.md`

## 🎯 Success Criteria

✅ Users can connect Gmail account
✅ Users can ingest evidence from Gmail
✅ Documents are displayed in list
✅ Parsing status is visible
✅ Parsed data is displayed
✅ Error handling works
✅ UI is responsive
✅ Integration with dashboard works

## 🚀 Ready to Implement!

All backend APIs are ready. Frontend can start implementing UI components using the provided documentation and API endpoints.

