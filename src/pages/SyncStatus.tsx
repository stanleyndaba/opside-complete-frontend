import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CheckCircle2, Loader2, Gift } from 'lucide-react';
import { getActiveSyncStatus } from '@/lib/inventoryApi';
import { useNavigate } from 'react-router-dom';

export default function SyncStatus() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedSync, setHasCompletedSync] = useState(false);
  const [showReferralPopup, setShowReferralPopup] = useState(false);
  const [claimsDetected, setClaimsDetected] = useState(0);
  const [estimatedValue, setEstimatedValue] = useState(0);

  useEffect(() => {
    const checkSyncStatus = async () => {
      try {
        const data = await getActiveSyncStatus();
        if (data.lastSync) {
          const status = data.lastSync.status;
          setHasCompletedSync(status === 'completed' || status === 'complete');
          const claims = (data.lastSync as any).claimsDetected || 0;
          setClaimsDetected(claims);
          setEstimatedValue(claims * 48);
        }
      } catch (error) {
        console.error('Failed to get sync status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSyncStatus();
  }, []);

  if (isLoading) {
    return (
      <PageLayout title="Sync Status" hideNavbar hideSidebar plainBackground>
        <div className="flex min-h-[60vh] items-center justify-center bg-white">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Sync Status" hideNavbar hideSidebar plainBackground>
      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-md mx-auto text-center space-y-8">
            
            {hasCompletedSync ? (
              <>
                {/* Success State */}
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-gray-900">
                      Sync Complete
                    </h1>
                    <p className="text-gray-500">
                      Your Amazon data has been synchronized
                    </p>
                  </div>

                  {claimsDetected > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-6">
                      <p className="text-sm text-emerald-700 mb-1">Potential Recovery</p>
                      <p className="text-3xl font-bold text-emerald-700">
                        ${estimatedValue.toLocaleString()}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">
                        {claimsDetected} discrepancies found
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4">
                  <Button 
                    onClick={() => navigate('/app')}
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 h-11"
                  >
                    Go to Dashboard
                  </Button>
                  
                  <button
                    onClick={() => setShowReferralPopup(true)}
                    className="w-full text-sm text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-2"
                  >
                    <Gift className="h-4 w-4" />
                    Invite a seller friend
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* No Sync State */}
                <div className="space-y-4">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    No Sync Data
                  </h1>
                  <p className="text-gray-500">
                    Start a sync to analyze your Amazon data
                  </p>
                </div>

                <Button 
                  onClick={() => navigate('/sync')}
                  className="w-full bg-gray-900 text-white hover:bg-gray-800 h-11"
                >
                  Start Sync
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Referral Popup */}
      <Dialog open={showReferralPopup} onOpenChange={setShowReferralPopup}>
        <DialogContent className="max-w-sm bg-emerald-50/95 border border-emerald-200/80 shadow-lg rounded-lg p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100">
              <Gift className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-emerald-900">
                No commission on referrals
              </h3>
              <p className="text-sm text-emerald-700">
                Bring new sellers to Clario and keep 100% of their recovered funds.
              </p>
            </div>
            <Button
              onClick={() => setShowReferralPopup(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-md"
            >
              Invite Friend +
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
