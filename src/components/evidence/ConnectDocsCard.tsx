import React from 'react';
import { Card, Button, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const ConnectDocsCard: React.FC = () => {
  return (
    <Card sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Connect Your Documents
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Securely link your documentation sources to begin evidence collection
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button 
          variant="contained" 
          component={Link} 
          to="/evidence-onboarding"
        >
          Start Setup
        </Button>
        <Button variant="outlined">
          Learn More
        </Button>
      </Box>
    </Card>
  );
};

export default ConnectDocsCard;
