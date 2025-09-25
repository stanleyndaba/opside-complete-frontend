import { api } from '@/lib/api';

export const detectionApi = {
  runDetection: async () => {
    const res = await api.runDetections();
    if (!res.ok) throw new Error(res.error || 'Failed to start detection');
    return res.data as { detection_id: string };
  },
  getStatus: async (detectionId: string) => {
    const res = await api.getDetectionStatus(detectionId);
    if (!res.ok) throw new Error(res.error || 'Failed to get detection status');
    return res.data as { status: 'in_progress' | 'complete' | 'failed'; newCases?: number; totalPotential?: number };
  },
};

