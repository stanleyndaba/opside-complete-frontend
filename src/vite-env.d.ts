/// <reference types="vite/client" />

interface Window {
  gtag?: (
    command: string,
    targetIdOrDate?: string | Date,
    params?: Record<string, unknown>
  ) => void;
}
