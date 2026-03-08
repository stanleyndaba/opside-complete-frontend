import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface EvidenceStatusCardProps {
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  documentCount?: number;
}

const EvidenceStatusCard: React.FC<EvidenceStatusCardProps> = ({
  status,
  progress = 0,
  documentCount = 0
}) => {
  const statusColors = {
    pending: 'secondary',
    processing: 'default', 
    completed: 'default',
    error: 'destructive'
  };

  return (
    <Card className="p-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-bold tracking-tight uppercase">Evidence Status</CardTitle>
        <Badge variant={statusColors[status] as any} className="font-bold tracking-tight">
          {status.toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{documentCount}</div>
        <p className="text-[9px] font-sans font-bold text-muted-foreground uppercase tracking-tight">Documents Processed</p>
        
        {status === 'processing' && (
          <div className="mt-4 space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-[9px] font-sans font-bold text-muted-foreground uppercase tracking-tight">{progress}% complete</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EvidenceStatusCard;
