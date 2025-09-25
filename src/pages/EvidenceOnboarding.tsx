import React, { useState } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EvidenceProgressPanel from '../components/evidence/EvidenceProgressPanel';
import ConnectDocsCard from '../components/evidence/ConnectDocsCard';

const EvidenceOnboarding: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Simulate zero-upload onboarding process
    setActiveStep(1);
    setTimeout(() => setActiveStep(2), 2000);
    setTimeout(() => {
      setActiveStep(3);
      setTimeout(() => navigate('/evidence'), 1000);
    }, 4000);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Evidence Onboarding
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Zero-upload evidence collection setup
      </Typography>
      
      <EvidenceProgressPanel activeStep={activeStep} />
      
      <Box sx={{ mt: 4 }}>
        {activeStep === 0 ? (
          <ConnectDocsCard />
        ) : (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" gutterBottom>
              {activeStep === 1 && 'Connecting to your document sources...'}
              {activeStep === 2 && 'Extracting evidence patterns...'}
              {activeStep === 3 && 'Setup complete! Redirecting...'}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/evidence')}
              sx={{ mt: 2 }}
            >
              Go to Evidence Search
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default EvidenceOnboarding;
