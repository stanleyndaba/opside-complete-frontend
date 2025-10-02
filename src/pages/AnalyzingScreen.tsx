import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Scan, FileSearch, Calculator, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

const SCANNING_MESSAGES = [
  'Analyzing FBA transaction history...',
  'Scanning for lost inventory claims...',
  'Checking for fee calculation errors...',
  'Identifying reimbursement opportunities...',
  'Validating shipment discrepancies...',
  'Cross-referencing with Amazon policies...',
  'Calculating potential recoveries...',
  'Finalizing analysis...'
];

export default function AnalyzingScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{ totalAmount: number; currency: string; claimCount: number } | null>(null);

  const source = searchParams.get('source') || 'amazon';

  useEffect(() => {
    let currentProgress = 0;
    let currentMessageIndex = 0;

    const progressInterval = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);

      // Change message every 12.5% progress
      if (currentProgress % 12 === 0 && currentMessageIndex < SCANNING_MESSAGES.length - 1) {
        currentMessageIndex += 1;
        setCurrentMessage(currentMessageIndex);
      }

      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        setShowResults(true);
        
        // Fetch the actual recovery data
        api.getAmazonRecoveries().then(response => {
          if (response.ok) {
            setRecoveryData(response.data);
          }
        });

        // Auto-redirect to command center after showing results
        setTimeout(() => {
          navigate('/command-center');
        }, 3000);
      }
    }, 90); // 90ms * 100 = 9 seconds total

    return () => clearInterval(progressInterval);
  }, [navigate]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (showResults && recoveryData) {
    return (
      <PageLayout title="Analysis Complete">
        <div className="max-w-2xl mx-auto mt-10">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle2 className="h-8 w-8" />
                Analysis Complete!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="space-y-2">
                <div className="text-5xl font-bold text-green-700">
                  {formatCurrency(recoveryData.totalAmount, recoveryData.currency)}
                </div>
                <div className="text-lg text-muted-foreground">
                  in Potential Recoveries Found
                </div>
                <Badge variant="secondary" className="text-sm">
                  {recoveryData.claimCount} claims identified
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <FileSearch className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div>Lost Inventory</div>
                  <div className="font-semibold">{formatCurrency(recoveryData.totalAmount * 0.6, recoveryData.currency)}</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <Calculator className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                  <div>Fee Errors</div>
                  <div className="font-semibold">{formatCurrency(recoveryData.totalAmount * 0.3, recoveryData.currency)}</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <Scan className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div>Shipments</div>
                  <div className="font-semibold">{formatCurrency(recoveryData.totalAmount * 0.1, recoveryData.currency)}</div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Taking you to your Command Center...
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Analyzing Your Account">
      <div className="max-w-2xl mx-auto mt-20">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Scan className="h-6 w-6 animate-pulse" />
              Analyzing Your Amazon FBA History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="text-center py-4">
              <div className="text-lg font-medium mb-2">
                {SCANNING_MESSAGES[currentMessage]}
              </div>
              <div className="text-sm text-muted-foreground">
                This usually takes about 90 seconds...
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs text-center">
              <div className="p-2 bg-blue-50 rounded">
                <FileSearch className="h-4 w-4 mx-auto mb-1" />
                Transaction Analysis
              </div>
              <div className="p-2 bg-orange-50 rounded">
                <Calculator className="h-4 w-4 mx-auto mb-1" />
                Fee Reconciliation
              </div>
              <div className="p-2 bg-purple-50 rounded">
                <Scan className="h-4 w-4 mx-auto mb-1" />
                Claim Detection
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
