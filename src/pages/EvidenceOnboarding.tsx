import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="container max-w-6xl py-8">
      <h1 className="text-4xl font-bold mb-4">Evidence Onboarding</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Zero-upload evidence collection setup
      </p>
      
      <EvidenceProgressPanel activeStep={activeStep} />
      
      <div className="mt-8">
        {activeStep === 0 ? (
          <ConnectDocsCard />
        ) : (
          <Card className="text-center p-8">
            <CardContent className="space-y-4">
              <h3 className="text-xl font-semibold">
                {activeStep === 1 && 'Connecting to your document sources...'}
                {activeStep === 2 && 'Extracting evidence patterns...'}
                {activeStep === 3 && 'Setup complete! Redirecting...'}
              </h3>
              <Button 
                variant="outline" 
                onClick={() => navigate('/evidence')}
              >
                Go to Evidence Search
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EvidenceOnboarding;
