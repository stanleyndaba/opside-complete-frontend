// Mock Amazon SP-API responses for demo workflow
export const mockAmazonApi = {
  // Mock recovery data - realistic amounts for demo
  getRecoveries: () => ({
    totalAmount: 2847.32,
    currency: 'USD',
    claimCount: 12,
    breakdown: {
      lostInventory: 1708.39,
      feeErrors: 854.20,
      shipmentIssues: 284.73
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