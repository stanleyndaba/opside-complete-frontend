# Phase 3: Evidence Ingestion & Document Parsing - Frontend Implementation Guide

## 🎯 Overview

This guide covers the frontend implementation for Phase 3: Evidence Ingestion & Document Parsing. The frontend needs to provide UI components for Gmail ingestion, document management, parsing status, and evidence display.

## 📋 Frontend Requirements

### 1. Gmail Connection UI
- Connect Gmail account button
- OAuth flow integration
- Connection status display
- Disconnect Gmail button

### 2. Evidence Ingestion UI
- Trigger Gmail ingestion button
- Ingestion status display
- Progress indicator
- Error handling

### 3. Document Management UI
- Document list view
- Document details view
- Document search/filter
- Document upload (manual)
- Document download/view

### 4. Parsing Status UI
- Parsing status indicator
- Parser job status display
- Parsed data display
- Parsing errors display

### 5. Evidence Dashboard Integration
- Evidence count display
- Recent evidence list
- Evidence by claim
- Evidence matching display

## 🔌 API Endpoints for Frontend

### Node.js Backend Endpoints

#### Gmail Integration
```
GET  /api/v1/integrations/gmail/auth          - Initiate Gmail OAuth
GET  /api/v1/integrations/gmail/callback      - Gmail OAuth callback
GET  /api/v1/integrations/gmail/status        - Get Gmail connection status
DELETE /api/v1/integrations/gmail/disconnect  - Disconnect Gmail
```

#### Evidence Ingestion
```
POST /api/evidence/ingest/gmail               - Trigger Gmail evidence ingestion
GET  /api/evidence/status                     - Get ingestion status
```

#### Evidence Documents (if implemented)
```
GET  /api/evidence/documents                  - Get evidence documents list
GET  /api/evidence/documents/{id}             - Get document details
POST /api/evidence/upload                     - Upload document manually
```

### Python API Endpoints

#### Document Parsing
```
POST /api/v1/evidence/parse/{document_id}     - Trigger document parsing
GET  /api/v1/evidence/parse/jobs/{job_id}     - Get parser job status
GET  /api/v1/evidence/parse/jobs              - List parser jobs
```

#### Document Retrieval
```
GET  /api/v1/evidence/documents/{id}          - Get document with parsed data
GET  /api/v1/evidence/documents/search        - Search documents by metadata
```

#### Evidence Documents (existing)
```
GET  /api/documents                           - Get documents list
GET  /api/documents/{id}                      - Get document details
GET  /api/documents/{id}/view                 - Get document view URL
GET  /api/documents/{id}/download             - Get document download URL
POST /api/documents/upload                    - Upload document
```

## 🎨 UI Components to Implement

### 1. Gmail Connection Component

**Location**: `/components/integrations/GmailConnection.tsx`

**Features**:
- Connect Gmail button
- Connection status indicator
- Disconnect button
- Last sync time display

**Example**:
```tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function GmailConnection() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Gmail status
    fetchGmailStatus();
  }, []);

  const fetchGmailStatus = async () => {
    try {
      const response = await fetch('/api/v1/integrations/gmail/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setStatus(data.connected ? 'connected' : 'disconnected');
      setLastSync(data.lastSync);
    } catch (error) {
      setStatus('disconnected');
    }
  };

  const handleConnect = async () => {
    // Redirect to OAuth flow
    const response = await fetch('/api/v1/integrations/gmail/auth', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (data.authUrl) {
      window.location.href = data.authUrl;
    }
  };

  const handleDisconnect = async () => {
    await fetch('/api/v1/integrations/gmail/disconnect', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    setStatus('disconnected');
  };

  return (
    <div className="gmail-connection">
      <div className="status">
        <Badge variant={status === 'connected' ? 'success' : 'default'}>
          {status === 'connected' ? 'Connected' : 'Disconnected'}
        </Badge>
        {lastSync && <span>Last sync: {new Date(lastSync).toLocaleString()}</span>}
      </div>
      {status === 'connected' ? (
        <Button onClick={handleDisconnect}>Disconnect Gmail</Button>
      ) : (
        <Button onClick={handleConnect}>Connect Gmail</Button>
      )}
    </div>
  );
}
```

### 2. Evidence Ingestion Component

**Location**: `/components/evidence/EvidenceIngestion.tsx`

**Features**:
- Trigger ingestion button
- Ingestion progress indicator
- Ingestion status display
- Error handling

**Example**:
```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function EvidenceIngestion() {
  const [ingesting, setIngesting] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleIngest = async () => {
    setIngesting(true);
    setError(null);
    try {
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
      const data = await response.json();
      setStatus(data);
      if (data.errors && data.errors.length > 0) {
        setError(data.errors.join(', '));
      }
    } catch (err) {
      setError('Failed to trigger ingestion');
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="evidence-ingestion">
      <Button onClick={handleIngest} disabled={ingesting}>
        {ingesting ? 'Ingesting...' : 'Ingest Evidence from Gmail'}
      </Button>
      {status && (
        <div className="status">
          <p>Documents Ingested: {status.documentsIngested}</p>
          <p>Emails Processed: {status.emailsProcessed}</p>
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
}
```

### 3. Evidence Documents List Component

**Location**: `/components/evidence/EvidenceDocumentsList.tsx`

**Features**:
- Document list with pagination
- Document status indicators
- Document search/filter
- Document actions (view, download, delete)

**Example**:
```tsx
import { useState, useEffect } from 'react';
import { DocumentCard } from './DocumentCard';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';

export function EvidenceDocumentsList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDocuments();
  }, [search, filter]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/documents?search=${search}&filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="evidence-documents-list">
      <div className="filters">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents..."
        />
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Documents</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </Select>
      </div>
      <div className="documents-grid">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  );
}
```

### 4. Document Card Component

**Location**: `/components/evidence/DocumentCard.tsx`

**Features**:
- Document thumbnail/preview
- Document metadata display
- Parsing status indicator
- Document actions

**Example**:
```tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function DocumentCard({ document }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="document-card">
      <div className="document-header">
        <h3>{document.filename}</h3>
        <Badge variant={getStatusColor(document.processing_status)}>
          {document.processing_status}
        </Badge>
      </div>
      <div className="document-metadata">
        <p>Source: {document.provider}</p>
        <p>Date: {new Date(document.created_at).toLocaleDateString()}</p>
        {document.parser_status && (
          <p>Parsing: {document.parser_status} ({document.parser_confidence * 100}%)</p>
        )}
      </div>
      <div className="document-actions">
        <Button onClick={() => viewDocument(document.id)}>View</Button>
        <Button onClick={() => downloadDocument(document.id)}>Download</Button>
      </div>
    </div>
  );
}
```

### 5. Parsing Status Component

**Location**: `/components/evidence/ParsingStatus.tsx`

**Features**:
- Parser job status display
- Parsing progress indicator
- Parsed data preview
- Parsing errors display

**Example**:
```tsx
import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export function ParsingStatus({ documentId }) {
  const [jobStatus, setJobStatus] = useState(null);
  const [parsedData, setParsedData] = useState(null);

  useEffect(() => {
    if (documentId) {
      fetchParsingStatus();
    }
  }, [documentId]);

  const fetchParsingStatus = async () => {
    try {
      // Get document with parsed data
      const response = await fetch(`/api/v1/evidence/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setJobStatus(data.parser_status);
      setParsedData(data.parsed_metadata);
    } catch (error) {
      console.error('Failed to fetch parsing status', error);
    }
  };

  return (
    <div className="parsing-status">
      <div className="status-header">
        <Badge variant={getStatusColor(jobStatus)}>{jobStatus}</Badge>
        {parsedData && (
          <span>Confidence: {(parsedData.confidence_score * 100).toFixed(1)}%</span>
        )}
      </div>
      {jobStatus === 'processing' && (
        <Progress value={50} className="progress-bar" />
      )}
      {parsedData && (
        <div className="parsed-data">
          <h4>Parsed Data</h4>
          <p>Supplier: {parsedData.supplier_name}</p>
          <p>Invoice Number: {parsedData.invoice_number}</p>
          <p>Date: {parsedData.invoice_date}</p>
          <p>Total: {parsedData.total_amount} {parsedData.currency}</p>
          {parsedData.line_items && (
            <div className="line-items">
              <h5>Line Items</h5>
              {parsedData.line_items.map((item, index) => (
                <div key={index}>
                  <p>{item.description} - {item.quantity} x {item.unit_price}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 6. Evidence Dashboard Integration

**Location**: `/components/dashboard/EvidenceDashboard.tsx`

**Features**:
- Evidence count display
- Recent evidence list
- Evidence by claim
- Quick actions

**Example**:
```tsx
import { useState, useEffect } from 'react';
import { EvidenceDocumentsList } from '@/components/evidence/EvidenceDocumentsList';
import { EvidenceIngestion } from '@/components/evidence/EvidenceIngestion';
import { GmailConnection } from '@/components/integrations/GmailConnection';

export function EvidenceDashboard() {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    processingDocuments: 0,
    completedDocuments: 0,
    failedDocuments: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/evidence/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setStats({
        totalDocuments: data.documentsCount || 0,
        processingDocuments: data.processingCount || 0,
        completedDocuments: data.documentsCount - data.processingCount || 0,
        failedDocuments: 0
      });
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  return (
    <div className="evidence-dashboard">
      <div className="dashboard-header">
        <h1>Evidence Management</h1>
        <GmailConnection />
      </div>
      <div className="stats">
        <div className="stat-card">
          <h3>Total Documents</h3>
          <p>{stats.totalDocuments}</p>
        </div>
        <div className="stat-card">
          <h3>Processing</h3>
          <p>{stats.processingDocuments}</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p>{stats.completedDocuments}</p>
        </div>
        <div className="stat-card">
          <h3>Failed</h3>
          <p>{stats.failedDocuments}</p>
        </div>
      </div>
      <div className="actions">
        <EvidenceIngestion />
      </div>
      <div className="documents">
        <EvidenceDocumentsList />
      </div>
    </div>
  );
}
```

## 🔄 User Flows

### Flow 1: Connect Gmail and Ingest Evidence

1. User navigates to Evidence Dashboard
2. User clicks "Connect Gmail" button
3. User is redirected to Gmail OAuth flow
4. User authorizes Gmail access
5. User is redirected back to dashboard
6. Gmail status shows "Connected"
7. User clicks "Ingest Evidence from Gmail"
8. Ingestion progress is displayed
9. Documents are listed in the documents list
10. Parsing status is displayed for each document

### Flow 2: View Parsed Document

1. User navigates to Evidence Documents list
2. User clicks on a document card
3. Document details modal opens
4. Parsing status is displayed
5. Parsed data is shown (if available)
6. User can view/download document
7. User can see line items and metadata

### Flow 3: Search and Filter Documents

1. User navigates to Evidence Documents list
2. User enters search query
3. Documents are filtered by search query
4. User selects filter (pending/processing/completed/failed)
5. Documents are filtered by status
6. User can sort by date, status, etc.

## 🎨 UI/UX Recommendations

### Status Indicators
- **Connected**: Green badge
- **Disconnected**: Gray badge
- **Processing**: Yellow/orange badge with spinner
- **Completed**: Green badge with checkmark
- **Failed**: Red badge with error icon

### Progress Indicators
- Use progress bars for ingestion progress
- Use spinners for parsing status
- Show estimated completion time

### Error Handling
- Display error messages in toast notifications
- Show retry buttons for failed operations
- Provide clear error messages

### Loading States
- Show skeleton loaders while fetching data
- Disable buttons during operations
- Show loading spinners for async operations

## 📱 Responsive Design

- Mobile-friendly document cards
- Collapsible filters on mobile
- Touch-friendly buttons
- Responsive grid layout

## 🔐 Authentication

- All API calls must include Authorization header
- Handle token expiration gracefully
- Redirect to login if unauthorized

## 📊 Data Visualization

- Chart showing evidence ingestion over time
- Pie chart showing document status distribution
- Bar chart showing parsing success rate
- Timeline showing document processing history

## 🚀 Implementation Priority

### Phase 1: Core Features (High Priority)
1. Gmail Connection UI
2. Evidence Ingestion UI
3. Document List View
4. Parsing Status Display

### Phase 2: Enhanced Features (Medium Priority)
1. Document Search/Filter
2. Document Details View
3. Document Upload
4. Evidence Dashboard Integration

### Phase 3: Advanced Features (Low Priority)
1. Evidence Matching Display
2. Evidence by Claim
3. Data Visualization
4. Advanced Search

## 🔗 API Integration Examples

### Fetch Gmail Status
```typescript
const fetchGmailStatus = async () => {
  const response = await fetch('/api/v1/integrations/gmail/status', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

### Trigger Gmail Ingestion
```typescript
const triggerIngestion = async () => {
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

### Fetch Documents
```typescript
const fetchDocuments = async (page = 1, limit = 20) => {
  const response = await fetch(`/api/documents?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

### Fetch Parsing Status
```typescript
const fetchParsingStatus = async (documentId: string) => {
  const response = await fetch(`/api/v1/evidence/documents/${documentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

## 📝 Next Steps

1. **Implement Core Components**
   - Gmail Connection Component
   - Evidence Ingestion Component
   - Document List Component
   - Parsing Status Component

2. **Integrate with Dashboard**
   - Add Evidence section to dashboard
   - Add Evidence stats to dashboard
   - Add Evidence quick actions

3. **Add Advanced Features**
   - Document search/filter
   - Document upload
   - Evidence matching display
   - Data visualization

4. **Test and Refine**
   - Test all user flows
   - Test error handling
   - Test responsive design
   - Gather user feedback

## 🔗 Related Documentation

- `PHASE3_IMPLEMENTATION_PLAN.md` - Phase 3 implementation plan
- `PHASE3_GMAIL_INGESTION_IMPLEMENTATION.md` - Gmail ingestion implementation
- `PHASE3_PARSING_PIPELINE_INTEGRATION.md` - Parsing pipeline integration
- `PHASE3_TEST_GUIDE.md` - Testing guide

