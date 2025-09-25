import React from 'react';
import { Paper, Typography, Stepper, Step, StepLabel, Box } from '@mui/material';

const steps = ['Document Connection', 'Evidence Extraction', 'Verification', 'Complete'];

interface EvidenceProgressPanelProps {
  activeStep: number;
}

const EvidenceProgressPanel: React.FC<EvidenceProgressPanelProps> = ({ activeStep }) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Onboarding Progress
      </Typography>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Current step: {steps[activeStep]}
        </Typography>
      </Box>
    </Paper>
  );
};

export default EvidenceProgressPanel;
