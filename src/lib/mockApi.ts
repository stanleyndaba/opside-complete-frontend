// Mock Amazon SP-API responses for demo workflow
// NOTE: Real recovery data should come from backend sync, not from these mocks
export const mockAmazonApi = {
  // Mock recovery data - returns nulls; actual values come from sync
  getRecoveries: () => ({
    totalAmount: null,  // Real value comes from backend sync
    currency: 'USD',
    claimCount: null,   // Real value comes from backend sync
    breakdown: {
      lostInventory: null,
      feeErrors: null,
      shipmentIssues: null
    }
  }),

  // Mock connection success
  connectAmazon: () => ({
    auth_url: '/auth/amazon-sandbox?state=demo_' + Date.now(),
    state: 'demo_' + Date.now()
  }),

  // Mock sandbox auth completion
  completeSandboxAuth: (state: string) => ({
    ok: true,
    connected: true,
    message: 'Amazon SP-API sandbox connected successfully'
  })
};