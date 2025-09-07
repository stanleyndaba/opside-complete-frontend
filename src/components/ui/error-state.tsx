import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="text-center p-8 border rounded-lg bg-red-50 text-red-800">
      <h3 className="text-base font-semibold">{message}</h3>
      {onRetry && (
        <Button className="mt-3" variant="destructive" onClick={onRetry}>Retry</Button>
      )}
    </div>
  );
}

