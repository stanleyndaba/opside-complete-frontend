import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Core Web Vitals reporting (LCP, FID/INP, CLS, TTFB, FCP)
import { onLCP, onFID, onCLS, onTTFB, onFCP, onINP } from 'web-vitals'
import { api } from '@/lib/api'

createRoot(document.getElementById("root")!).render(<App />);

const report = (name: string, metric: any) => {
  api.trackEvent('web_vital', {
    name,
    value: metric.value,
    rating: (metric as any).rating,
    id: metric.id,
    navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type,
  });
};

onLCP(m => report('LCP', m));
onFID(m => report('FID', m));
onINP(m => report('INP', m));
onCLS(m => report('CLS', m));
onTTFB(m => report('TTFB', m));
onFCP(m => report('FCP', m));
