import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ConnectionStatusBadgeProps {
  connected: boolean;
  sandboxMode?: boolean;
  useMockData?: boolean;
  className?: string;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({
  connected,
  sandboxMode,
  useMockData,
  className = '',
}) => {
  if (!connected) {
    return (
      <Badge variant="secondary" className={className}>
        Not Connected
      </Badge>
    );
  }

  if (sandboxMode && useMockData) {
    return (
      <Badge className={`bg-blue-500/20 text-blue-400 border-blue-500/30 ${className}`}>
        Connected (Test Data)
      </Badge>
    );
  }

  if (sandboxMode) {
    return (
      <Badge className={`bg-yellow-500/20 text-yellow-400 border-yellow-500/30 ${className}`}>
        Connected (Sandbox)
      </Badge>
    );
  }

  return (
    <Badge className={`bg-green-500/20 text-green-400 border-green-500/30 ${className}`}>
      Connected
    </Badge>
  );
};

