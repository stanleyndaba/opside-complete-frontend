// Centralized feature flags for the application
// Toggle visibility/availability of features here or via environment variables

// Evidence Locker (aka "Claim Documents") feature toggle
// Default: disabled. Can be overridden via Vite env var VITE_FEATURE_EVIDENCE_LOCKER
export const EVIDENCE_LOCKER_ENABLED: boolean =
  typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_FEATURE_EVIDENCE_LOCKER
    ? String((import.meta as any).env.VITE_FEATURE_EVIDENCE_LOCKER).toLowerCase() === 'true'
    : false;

