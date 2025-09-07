import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="text-center p-8 border rounded-lg bg-muted/20">
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      {actionLabel && (
        <Button className="mt-3" variant="outline" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}

