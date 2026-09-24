import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const root = createRoot(document.getElementById('root')!);

const app = (
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);

if (!clerkPublishableKey) {
  root.render(app);
} else {
  void import('@clerk/react').then(({ ClerkProvider }) => {
    root.render(<ClerkProvider publishableKey={clerkPublishableKey}>{app}</ClerkProvider>);
  }).catch((error) => {
    console.error('Margin failed to load Clerk', error);
    root.render(app);
  });
}

// Optional integrations are intentionally initialized after the first render path.
void import('@/lib/pwaInstall').then(({ startPwaInstallManager }) => {
  try {
    startPwaInstallManager();
  } catch (error) {
    console.warn('Margin PWA install manager unavailable during development', error);
  }
}).catch(() => undefined);

void Promise.all([
  import('web-vitals'),
  import('@/lib/analytics'),
]).then(([webVitals, { trackEvent }]) => {
  const report = (name: string, metric: { value: number; rating: string; id: string; navigationType?: string }) => {
    trackEvent('web_vital', {
      name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType || performance.getEntriesByType('navigation')[0]?.type,
    });
  };

  webVitals.onLCP(metric => report('LCP', metric));
  webVitals.onFID(metric => report('FID', metric));
  webVitals.onINP(metric => report('INP', metric));
  webVitals.onCLS(metric => report('CLS', metric));
  webVitals.onTTFB(metric => report('TTFB', metric));
  webVitals.onFCP(metric => report('FCP', metric));
}).catch(() => undefined);
