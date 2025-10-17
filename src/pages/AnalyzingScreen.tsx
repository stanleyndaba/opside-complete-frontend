import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Circular progress constants
  const radius = 36; // SVG circle radius
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

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
          navigate('/app');
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
        <div className="relative -m-4 lg:-m-6">
          <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24 text-gray-300">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />

            <div className="relative max-w-2xl mx-auto mt-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
                Analysis Complete!
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="space-y-2">
                    <div className="text-5xl font-bold text-gray-100">
                  {formatCurrency(recoveryData.totalAmount, recoveryData.currency)}
                    </div>
                    <div className="text-lg text-gray-400">
                  in Potential Recoveries Found
                    </div>
                    <Badge variant="outline" className="text-sm border-white/20">
                  {recoveryData.claimCount} claims identified
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 rounded-lg border border-white/10 bg-white/5">
                      <FileSearch className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                      <div>Lost Inventory</div>
                      <div className="font-semibold">{formatCurrency(recoveryData.totalAmount * 0.6, recoveryData.currency)}</div>
                    </div>
                    <div className="text-center p-3 rounded-lg border border-white/10 bg-white/5">
                      <Calculator className="h-6 w-6 mx-auto mb-2 text-amber-400" />
                      <div>Fee Errors</div>
                      <div className="font-semibold">{formatCurrency(recoveryData.totalAmount * 0.3, recoveryData.currency)}</div>
                    </div>
                    <div className="text-center p-3 rounded-lg border border-white/10 bg-white/5">
                      <Scan className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                      <div>Shipments</div>
                      <div className="font-semibold">{formatCurrency(recoveryData.totalAmount * 0.1, recoveryData.currency)}</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400">
                    Taking you to your Command Center...
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Analyzing Your Account">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24 text-gray-300">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />

          <div className="relative max-w-2xl mx-auto mt-10 text-center space-y-6">
            <div className="flex items-center justify-center">
              <span className="text-lg font-medium text-gray-100">Analyzing Your Amazon FBA History</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="text-sm text-gray-400">Progress</span>
              {/* Rotating cube logo as loader; falls back to smaller ring if asset not present */}
              <div className="h-16 w-16 flex items-center justify-center">
                <img src="/logo-abstract.svg" alt="Loading" className="h-10 w-10 animate-spin-slow opacity-90" onError={(e) => {
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (!parent) return;
                  parent.innerHTML = '';
                  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                  svg.setAttribute('viewBox', '0 0 100 100');
                  svg.setAttribute('class', 'w-16 h-16 -rotate-90');
                  svg.innerHTML = `
                    <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" class="text-white/10" stroke-width="6" />
                    <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" class="text-emerald-400" stroke-width="6" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}" />
                  `;
                  parent.appendChild(svg);
                }} />
              </div>
              <div className="text-sm font-medium text-gray-200">{progress}%</div>
            </div>
            <div className="py-2">
              <div className="text-lg font-medium mb-2 text-gray-100">
                {SCANNING_MESSAGES[currentMessage]}
              </div>
              <div className="text-sm text-gray-400">
                This usually takes about 90 seconds...
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
