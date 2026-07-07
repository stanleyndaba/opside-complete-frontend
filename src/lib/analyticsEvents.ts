export const ANALYTICS_EVENTS = {
  demoVideoClicked: 'demo_video_clicked',
  demoVideoStarted: 'demo_video_started',
  demoVideoCompleted: 'demo_video_completed',
  claimAccessClicked: 'claim_access_clicked',
  checkoutStarted: 'checkout_started',
  paymentSuccess: 'payment_success',
  paymentFailed: 'payment_failed',
} as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];
