import { api } from '@/lib/api';

export const metricsApi = {
  fetchDashboardMetrics: async (window?: '7d' | '30d' | '90d', tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for fetchDashboardMetrics");
    const res = await api.getDashboardAggregates(window, tenantSlug);
    if (!res.ok) throw new Error(res.error || 'Failed to load dashboard metrics');
    return res.data!;
  },
  fetchRecoveryMetrics: async (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for fetchRecoveryMetrics");
    const res = await api.getRecoveriesMetrics(tenantSlug);
    if (!res.ok) throw new Error(res.error || 'Failed to load recoveries metrics');
    return res.data!;
  },
  trackMetric: async (name: string, payload?: Record<string, any>) => {
    const res = await api.trackEvent(name, payload);
    if (!res.ok) throw new Error(res.error || 'Failed to track metric');
    return res.data!;
  },
};

