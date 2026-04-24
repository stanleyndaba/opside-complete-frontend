import { useCallback, useState } from 'react';
import type { AiExplanation, AiExplanationEnvelope, ApiResponse } from '@/lib/api';

type ExplanationLoader = (id: string) => Promise<ApiResponse<AiExplanationEnvelope>>;

export function useAiExplanation(loadExplanation: ExplanationLoader, enabled = true) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<AiExplanation | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);

  const run = useCallback(async (id: string) => {
    if (!enabled) {
      setError('AI explanation is not enabled for this workspace yet.');
      return;
    }

    setLastId(id);
    setLoading(true);
    setError(null);

    try {
      const response = await loadExplanation(id);
      if (!response.ok || !response.data?.success || !response.data?.explanation) {
        throw new Error(
          response.data?.error?.message
          || response.error
          || 'AI explanation is unavailable right now.'
        );
      }
      setExplanation(response.data.explanation);
    } catch (loadError: any) {
      setExplanation(null);
      setError(loadError?.message || 'AI explanation is unavailable right now.');
    } finally {
      setLoading(false);
    }
  }, [enabled, loadExplanation]);

  const openFor = useCallback(async (id: string) => {
    setOpen(true);
    await run(id);
  }, [run]);

  const retry = useCallback(async () => {
    if (!lastId) return;
    await run(lastId);
  }, [lastId, run]);

  const close = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
  }, []);

  const reset = useCallback(() => {
    setOpen(false);
    setLoading(false);
    setError(null);
    setExplanation(null);
    setLastId(null);
  }, []);

  return {
    open,
    setOpen: close,
    loading,
    error,
    explanation,
    openFor,
    retry,
    reset,
  };
}
