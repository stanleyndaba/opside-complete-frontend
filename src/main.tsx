import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from '@/components/util/ErrorBoundary'

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}
createRoot(rootEl).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
