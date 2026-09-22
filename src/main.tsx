import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const root = createRoot(document.getElementById('root')!);

void Promise.all([
  import('./App.tsx'),
  import('@/components/error/GlobalErrorBoundary'),
]).then(([{ default: App }, { GlobalErrorBoundary }]) => {
  const app = (
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  );

  if (!clerkPublishableKey) {
    root.render(app);
    return;
  }

  return import('@clerk/react').then(({ ClerkProvider }) => {
    root.render(<ClerkProvider publishableKey={clerkPublishableKey}>{app}</ClerkProvider>);
  });
}).catch((error) => {
  console.error('Margin failed to bootstrap the application', error);
  const message = error instanceof Error ? error.message : 'Unknown bootstrap error';
  document.getElementById('root')!.innerHTML = `<main class="route-loading-shell" aria-label="Margin bootstrap error"><div class="route-loading-shell__brand"><span>Margin</span></div><p style="margin-top:16px;font:14px system-ui;color:#66737F">${message}</p></main>`;
});

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
