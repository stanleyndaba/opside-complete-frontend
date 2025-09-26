import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const steps = ['Document Connection', 'Evidence Extraction', 'Verification', 'Complete'];

interface EvidenceProgressPanelProps {
  activeStep: number;
}

const EvidenceProgressPanel: React.FC<EvidenceProgressPanelProps> = ({ activeStep }) => {
  return (
    <Card className=\"p-6\">
      <CardHeader>
        <CardTitle>Onboarding Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className=\"flex justify-between mb-4\">
          {steps.map((step, index) => (
            <div key={step} className=\"flex flex-col items-center\">
              <div className={w-8 h-8 rounded-full flex items-center justify-center }>
                {index + 1}
              </div>
              <span className={	ext-xs mt-2 text-center }>
                {step}
              </span>
            </div>
          ))}
        </div>
        
        <div className=\"text-sm text-muted-foreground text-center\">
          Current step: {steps[activeStep]}
        </div>
      </CardContent>
    </Card>
  );
};

export default EvidenceProgressPanel;
