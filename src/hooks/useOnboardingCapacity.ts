import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type CapacityState = {
  max: number;
  active: number;
  allowed: boolean;
  nextBatchHours: number;
};

export function useOnboardingCapacity() {
  const [capacity, setCapacity] = useState<CapacityState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await api.getOnboardingCapacity();
        if (!mounted) return;
        if (res.ok && res.data) {
          setCapacity({
            max: res.data.max,
            active: res.data.active,
            allowed: res.data.allowed,
            nextBatchHours: res.data.nextBatchHours
          });
        }
      } catch {
        // Ignore capacity failures; default to open.
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const isFull = capacity ? !capacity.allowed : false;

  return {
    loading,
    capacity,
    isFull
  };
}

