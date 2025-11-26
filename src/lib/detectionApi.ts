import { api } from '@/lib/api';

export const detectionApi = {
  /**
   * Run claim detection (Agent 3)
   */
  runDetection: async () => {
    const res = await api.runClaimDetection();
    if (!res.ok) throw new Error(res.error || 'Failed to start detection');
    return res.data as { detection_id: string; detectionId?: string; message?: string };
  },
  
  /**
   * Get detection job status
   */
  getStatus: async (detectionId: string) => {
    const res = await api.getDetectionStatus(detectionId);
    if (!res.ok) throw new Error(res.error || 'Failed to get detection status');
    return res.data as { 
      status: 'in_progress' | 'complete' | 'failed'; 
      detection_id: string;
      total_detected?: number;
      summary?: any;
    };
  },
  
  /**
   * Get all detection results
   */
  getDetectionResults: async (params?: { status?: string; limit?: number; offset?: number; userId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.userId) queryParams.append('userId', params.userId);
    const query = queryParams.toString();
    
    const res = await api.get<{
      success: boolean;
      results: Array<{
        id: string;
        seller_id: string;
        sync_id: string;
        anomaly_type: string;
        severity: string;
        estimated_value: number;
        currency: string;
        confidence_score: number;
        evidence: any;
        status: string;
        discovery_date: string;
        deadline_date: string;
        days_remaining: number;
      }>;
      total: number;
    }>(`/api/detections/results${query ? `?${query}` : ''}`);
    
    if (!res.ok) throw new Error(res.error || 'Failed to get detection results');
    return res.data;
  },
  
  /**
   * Get detection statistics
   */
  getDetectionStatistics: async (userId?: string) => {
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('userId', userId);
    const query = queryParams.toString();
    
    const res = await api.get<{
      success: boolean;
      statistics: {
        total_anomalies?: number;
        totalDetections?: number;
        total_value?: number;
        estimatedRecovery?: number;
        by_severity?: {
          high?: { count: number; value: number };
          medium?: { count: number; value: number };
          low?: { count: number; value: number };
        };
        by_type?: Record<string, { count: number; value: number }>;
        by_confidence?: { high: number; medium: number; low: number };
        averageConfidence?: number;
      };
    }>(`/api/detections/statistics${query ? `?${query}` : ''}`);
    
    if (!res.ok) throw new Error(res.error || 'Failed to get detection statistics');
    return res.data;
  },
};

