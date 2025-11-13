import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TestTube } from 'lucide-react';

interface MockDataIndicatorProps {
  isMock: boolean;
  scenario?: string;
  className?: string;
}

export const MockDataIndicator: React.FC<MockDataIndicatorProps> = ({
  isMock,
  scenario,
  className = '',
}) => {
  if (!isMock) return null;

  return (
    <Badge 
      variant="outline" 
      className={`inline-flex items-center gap-1.5 border-blue-500/30 bg-blue-500/10 text-blue-400 ${className}`}
    >
      <TestTube className="h-3.5 w-3.5" />
      <span>Test Data{scenario ? ` (${scenario})` : ''}</span>
    </Badge>
  );
};

