import React from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import App from './App.tsx'
import './index.css'

// Core Web Vitals reporting (LCP, FID/INP, CLS, TTFB, FCP)
import { onLCP, onFID, onCLS, onTTFB, onFCP, onINP } from 'web-vitals'
import type { MetricType } from 'web-vitals'
import { trackEvent } from '@/lib/analytics'

type SentryBrowserRuntime = {
  init: (options: {
    dsn: string;
    integrations?: unknown[];
    tracesSampleRate: number;
    replaysSessionSampleRate: number;
  }) => void;
  BrowserTracing?: new (options?: { routingInstrumentation?: unknown }) => unknown;
  browserTracingIntegration?: { routingInstrumentation?: unknown };
};

// Sentry RUM (lazy init)
if (import.meta.env.VITE_SENTRY_DSN) {
  // Lazy load Sentry to avoid impact on TTI
  import('@sentry/browser').then((Sentry) => {
    const sentryRuntime = Sentry as unknown as SentryBrowserRuntime;
    const integrations = sentryRuntime.BrowserTracing
      ? [new sentryRuntime.BrowserTracing({
        routingInstrumentation: sentryRuntime.browserTracingIntegration?.routingInstrumentation,
      })]
      : [];

    sentryRuntime.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations,
      tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_RATE || 0.1),
      replaysSessionSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_RATE || 0.1),
    });
  }).catch(() => { });
}

import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={clerkPublishableKey}>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </ClerkProvider>
);

const report = (name: string, metric: MetricType) => {
  trackEvent('web_vital', {
    name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType || performance.getEntriesByType('navigation')[0]?.type,
  });
};

onLCP(m => report('LCP', m));
onFID(m => report('FID', m));
onINP(m => report('INP', m));
onCLS(m => report('CLS', m));
onTTFB(m => report('TTFB', m));
onFCP(m => report('FCP', m));
