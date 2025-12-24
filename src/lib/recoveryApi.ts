import { api } from './api';

export const recoveryApi = {
  getRecoveries: async () => {
    let recoveries: any[] = [];

    // 1. Try new upcoming-payments endpoint first (gets real data from dispute_cases)
    try {
      const upcomingResponse = await api.get('/api/v1/integrations/amazon/upcoming-payments');
      if (upcomingResponse.ok && upcomingResponse.data?.recoveries) {
        recoveries = upcomingResponse.data.recoveries;
      }
    } catch (e) {
      console.warn('Upcoming payments endpoint failed:', e);
    }

    // 2. If no upcoming-payments, try fallback to old endpoint
    if (recoveries.length === 0) {
      try {
        const response = await api.get('/api/recoveries');
        if (response.ok) {
          if (Array.isArray(response.data)) {
            recoveries = response.data;
          } else if (response.data?.recoveries) {
            recoveries = response.data.recoveries;
          }
        }
      } catch (e) {
        console.warn('Fallback recoveries endpoint failed:', e);
      }
    }

    // 3. ALSO fetch detection results from Agent 3 (unfiled claims/anomalies)
    try {
      const detectionResponse = await api.get('/api/v1/integrations/detections/results');
      if (detectionResponse.ok && detectionResponse.data?.results) {
        const detectionClaims = detectionResponse.data.results
          .filter((d: any) => d.status !== 'filed' && d.status !== 'resolved') // Only include unfiled detections
          .map((d: any) => {
            // Extract evidence data for validateEvidencePolicy
            const ev = d.evidence || {};

            return {
              id: d.id,
              claim_number: `DET-${d.id.slice(0, 8).toUpperCase()}`,
              status: d.status || 'detected',
              type: d.anomaly_type,
              anomaly_type: d.anomaly_type,
              details: ev.summary || ev.description || `${d.anomaly_type} detected`,
              amount: d.estimated_value || 0,
              guaranteedAmount: d.estimated_value || 0,
              estimated_value: d.estimated_value,
              // Extract all evidence fields for validateEvidencePolicy
              sku: d.sku || ev.sku || ev.seller_sku,
              asin: d.asin || ev.asin,
              fnsku: ev.fnsku,
              quantity: ev.quantity || ev.missing_quantity || ev.qty,
              shipment_id: ev.shipment_id || ev.reference_id,
              order_id: ev.order_id,
              tracking_number: ev.tracking_number,
              fulfillment_center_id: ev.fulfillment_center_id || ev.fc_id,
              // Dates and metadata
              confidence_score: d.confidence_score,
              discovery_date: d.discovery_date,
              created_at: d.created_at || d.discovery_date,
              deadline_date: d.deadline_date,
              days_remaining: d.days_remaining,
              severity: d.severity,
              currency: d.currency || 'USD',
              // Store raw evidence for detailed views
              evidence: ev,
              // Flag to distinguish from filed claims
              isDetection: true,
              source: 'agent3_detection'
            };
          });

        // Merge detection results with existing recoveries
        // Avoid duplicates by checking IDs
        const existingIds = new Set(recoveries.map(r => r.id));
        const newDetections = detectionClaims.filter((d: any) => !existingIds.has(d.id));
        recoveries = [...recoveries, ...newDetections];

        console.log(`[RecoveryAPI] Merged ${newDetections.length} detection results with recoveries`);
      }
    } catch (e) {
      console.warn('Detection results fetch failed (Agent 3 may not have run yet):', e);
    }

    return recoveries;
  },

  getRecoveryMetrics: async () => {
    const response = await api.get('/api/metrics/recoveries');
    if (!response.ok) {
      throw new Error(response.error || 'Failed to fetch recovery metrics');
    }
    return response.data;
  },

  submitClaim: async (id: string) => {
    const response = await api.post(`/api/recoveries/${encodeURIComponent(id)}/submit`);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to submit claim');
    }
    return response.data;
  },

  resubmitClaim: async (id: string) => {
    const response = await api.post(`/api/recoveries/${encodeURIComponent(id)}/resubmit`);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to resubmit claim');
    }
    return response.data;
  },

  getRecoveryStatus: async (recoveryId: string) => {
    const response = await api.get(`/api/recoveries/${encodeURIComponent(recoveryId)}/status`);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to fetch recovery status');
    }
    return response.data;
  },

  submitRecoveryAnswer: async (id: string, body: { answer: string }) => {
    const response = await api.post(`/api/recoveries/${encodeURIComponent(id)}/answer`, body);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to submit answer');
    }
    return response.data;
  },

  uploadRecoveryDocuments: async (id: string, files: File[]) => {
    // This helper uses fetch directly because multipart is easier without the JSON helper
    const form = new FormData();
    for (const f of files) form.append('files', f);
    const res = await fetch(api.buildApiUrl(`/api/recoveries/${encodeURIComponent(id)}/documents/upload`), {
      method: 'POST',
      credentials: 'include',
      body: form as any,
    } as any);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
