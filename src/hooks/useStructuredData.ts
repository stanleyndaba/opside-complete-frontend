import { useEffect } from 'react';

const SCRIPT_ID = 'route-structured-data';

const normalizeStructuredData = (data: unknown) => JSON.stringify(data);

export const useStructuredData = (data: unknown) => {
  useEffect(() => {
    if (typeof document === 'undefined' || !data) return;

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    script.textContent = normalizeStructuredData(data);

    return () => {
      if (script?.parentElement) {
        script.parentElement.removeChild(script);
      }
    };
  }, [data]);
};

