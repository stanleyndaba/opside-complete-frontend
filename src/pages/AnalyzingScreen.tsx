import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scan, FileSearch, Calculator } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();

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
            toast({ title: 'Analysis complete', description: 'We found potential recoveries in your account.' });
          } else {
            toast({ title: 'Analysis completed with issues', description: response.error || 'Could not load recovery summary.' });
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
      <PageLayout title="Analysis Complete" hideNavbar hideSidebar>
        <div className="relative -m-4 lg:-m-6">
          <div className="relative w-full bg-transparent min-h-screen pt-4 text-gray-300">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />

            <div className="relative max-w-2xl mx-auto mt-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-emerald-400">
                    <span className="relative inline-flex items-center">
                      <span className="absolute -inset-4 rounded-full bg-emerald-400/20 blur-2xl" />
                      <img src="/logo-abstract.svg" alt="Clario cube" className="relative h-8 w-8 opacity-90" />
                    </span>
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
                  <div className="text-xs text-gray-500">
                    We provide read-only analysis. You can revoke access and purge data anytime.
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
    <PageLayout title="Analyzing Your Account" hideNavbar hideSidebar>
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-transparent min-h-screen pt-4 text-gray-300">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] bg-[linear-gradient(to_bottom,transparent_0,transparent_95%,rgba(255,255,255,0.08)_96%),linear-gradient(to_right,transparent_0,transparent_95%,rgba(255,255,255,0.08)_96%)] bg-[length:36px_36px]" />
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative max-w-2xl mx-auto mt-10 text-center space-y-6">
            <div className="flex items-center justify-center">
              <span className="text-lg font-medium text-gray-100">Analyzing Your Amazon FBA History</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="text-sm text-gray-400">Progress</span>
              <svg viewBox="0 0 100 100" className="w-14 h-14 -rotate-90">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" className="text-white/10" strokeWidth={6} />
                <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" className="text-emerald-400" strokeWidth={6} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
              </svg>
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

            <div className="max-w-md mx-auto text-left">
              <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                <p className="text-xs font-medium text-gray-200 mb-1">What happens now</p>
                <ul className="text-xs text-gray-400 space-y-1 list-disc pl-4">
                  <li>We compare orders, inventory adjustments, fees and shipments.</li>
                  <li>Only read-only data is used; nothing is changed in your account.</li>
                  <li>You can disconnect and purge at any time from Integrations.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
