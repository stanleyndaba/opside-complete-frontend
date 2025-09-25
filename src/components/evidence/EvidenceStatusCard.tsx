import React from 'react';
import { Card, Typography, LinearProgress, Box, Chip } from '@mui/material';

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
    pending: 'default',
    processing: 'primary', 
    completed: 'success',
    error: 'error'
  };

  return (
    <Card sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Evidence Status</Typography>
        <Chip 
          label={status.toUpperCase()} 
          color={statusColors[status] as any}
          size="small"
        />
      </Box>
      
      <Typography variant="body2" sx={{ mb: 1 }}>
        Documents Processed: {documentCount}
      </Typography>
      
      {status === 'processing' && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ mb: 1 }}
          />
          <Typography variant="caption">{progress}% complete</Typography>
        </Box>
      )}
    </Card>
  );
};

export default EvidenceStatusCard;
