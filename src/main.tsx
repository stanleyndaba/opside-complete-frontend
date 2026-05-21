import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Sentry RUM (lazy init)
if ((import.meta as any).env?.VITE_SENTRY_DSN) {
  // Lazy load Sentry to avoid impact on TTI
  import('@sentry/browser').then((Sentry) => {
    Sentry.init({
      dsn: (import.meta as any).env?.VITE_SENTRY_DSN,
      integrations: [
        new (Sentry as any).BrowserTracing({ routingInstrumentation: (Sentry as any).browserTracingIntegration?.routingInstrumentation })
      ],
      tracesSampleRate: Number((import.meta as any).env?.VITE_SENTRY_TRACES_RATE || 0.1),
      replaysSessionSampleRate: Number((import.meta as any).env?.VITE_SENTRY_REPLAYS_RATE || 0.1),
    });
  }).catch(() => { });
}

import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary';

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);

const schedulePostPaint = (callback: () => void) => {
  const run = () => window.setTimeout(callback, 0);

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 3000 });
    return;
  }

  window.setTimeout(run, 2000);
};

schedulePostPaint(() => {
  void Promise.all([
    import('web-vitals'),
    import('@/lib/api'),
  ]).then(([vitals, apiModule]) => {
    const report = (name: string, metric: any) => {
      void apiModule.api.trackEvent('web_vital', {
        name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type,
      }).catch(() => undefined);
    };

    vitals.onLCP((metric) => report('LCP', metric));
    vitals.onFID((metric) => report('FID', metric));
    vitals.onINP((metric) => report('INP', metric));
    vitals.onCLS((metric) => report('CLS', metric));
    vitals.onTTFB((metric) => report('TTFB', metric));
    vitals.onFCP((metric) => report('FCP', metric));
  }).catch(() => undefined);
});
