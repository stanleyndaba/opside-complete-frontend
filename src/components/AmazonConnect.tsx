import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AmazonConnectProps {
  onConnectionStart?: () => void;
  onConnectionComplete?: (data: any) => void;
  className?: string;
  showUseExisting?: boolean;
}

export function AmazonConnect({ onConnectionStart, onConnectionComplete, className, showUseExisting = true }: AmazonConnectProps) {
  const [connecting, setConnecting] = useState(false);
  const [usingExisting, setUsingExisting] = useState(false);
  const [showSyncPopup, setShowSyncPopup] = useState(false);
  const [showNotificationSheet, setShowNotificationSheet] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [currentWord, setCurrentWord] = useState(0);
  const syncProgressRef = useRef(0);
  const notificationShownRef = useRef(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const syncWords = ['shipment', 'orders', 'returns', 'settlements'];

  // Update ref when progress changes
  useEffect(() => {
    syncProgressRef.current = syncProgress;
    
    // Show notification sheet when progress reaches 32%
    if (syncProgress >= 32 && !notificationShownRef.current && showSyncPopup) {
      setShowNotificationSheet(true);
      notificationShownRef.current = true;
    }
  }, [syncProgress, showSyncPopup]);

  // Cycle through words while loading
  useEffect(() => {
    if (!showSyncPopup) return;
    
    const wordInterval = setInterval(() => {
      // Check current progress from ref
      if (syncProgressRef.current >= 100) {
        return;
      }
      setCurrentWord((prev) => (prev + 1) % syncWords.length);
    }, 1500); // Change word every 1.5 seconds
    
    return () => clearInterval(wordInterval);
  }, [showSyncPopup, syncWords.length]);

  // Animate progress from 0 to 100%
  useEffect(() => {
    if (showSyncPopup) {
      const duration = 15000; // 15 seconds total
      const steps = 100;
      const intervalTime = duration / steps;
      
      let currentStep = 0;
      const progressInterval = setInterval(() => {
        currentStep++;
        const newProgress = Math.min((currentStep / steps) * 100, 100);
        setSyncProgress(newProgress);
        
        if (newProgress >= 100) {
          clearInterval(progressInterval);
        }
      }, intervalTime);

      return () => clearInterval(progressInterval);
    } else {
      // Reset progress when popup closes
      setSyncProgress(0);
      setCurrentWord(0);
      notificationShownRef.current = false;
      setShowNotificationSheet(false);
    }
  }, [showSyncPopup]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      if (showUseExisting) {
        setUsingExisting(false);
      }
      onConnectionStart?.();

      // ✅ CORRECT: Start OAuth flow
      // Step 1: Call /auth/start to get OAuth URL
      const response = await api.connectAmazon();

      if (!response.ok) {
        console.error('[AmazonConnect] Failed to get OAuth URL:', response.error);

        // Check if backend returned authUrl in error response (backwards compatibility)
        const errorData = typeof response.error === 'object' ? response.error : {};
        const authUrl = errorData.authUrl || errorData.auth_url || errorData.redirectTo;

        if (authUrl) {
          console.log('[AmazonConnect] Backend returned authUrl in error, redirecting:', authUrl);
          window.location.href = authUrl;
          return;
        }

        toast({
          title: 'Connection Failed',
          description: response.error || 'Failed to start Amazon authentication. Please try again.',
          variant: 'destructive'
        });
        setConnecting(false);
        return;
      }

      // Handle both auth_url and authUrl (backend may return either)
      const authUrl = response.data?.auth_url || response.data?.authUrl;
      const stateParam = response.data?.state;

      if (stateParam) {
        try {
          sessionStorage.setItem('amazon_sandbox_state', stateParam);
          localStorage.setItem('amazon_sandbox_state', stateParam);
        } catch {}
      }

      if (authUrl && authUrl.includes('/auth/amazon-sandbox')) {
        try {
          sessionStorage.setItem('amazon_sandbox_mode', 'true');
          localStorage.setItem('amazon_sandbox_mode', 'true');
        } catch {}
      }

      if (authUrl) {
        // Track the connection attempt
        await api.trackEvent('amazon_connect_initiated', {
          timestamp: new Date().toISOString(),
          source: 'zero_friction_onboarding'
        });

        // Step 2: Redirect user to Amazon (DO NOT call callback directly!)
        window.location.href = authUrl;
        // Step 3: Amazon will automatically redirect to /auth/callback?code=...
        // (This happens automatically - frontend shouldn't call this)
      } else {
        // No auth URL received
        console.error('[AmazonConnect] No auth URL received from backend');
        toast({
          title: 'Connection Failed',
          description: 'No authorization URL received from backend. Please try again.',
          variant: 'destructive'
        });
        setConnecting(false);
      }
    } catch (error: any) {
      console.error('[AmazonConnect] Connection failed:', error);
      toast({
        title: 'Connection Error',
        description: error?.message || 'An unexpected error occurred during authentication.',
        variant: 'destructive'
      });
      setConnecting(false);
    }
  };

  const handleUseExisting = async () => {
    if (!showUseExisting) return;
    try {
      setConnecting(true);
      setUsingExisting(true);
      onConnectionStart?.();

      // OPTIMIZATION: Check connection status first (lightweight endpoint)
      // This avoids calling the slow bypass endpoint if Amazon is already connected.
      // The bypass endpoint can be slow because:
      // 1. Backend might be sleeping (Render free tier takes 30-60s to wake up)
      // 2. It validates/refreshes tokens (involves API calls to Amazon)
      // 3. It might trigger automatic syncs
      // By checking status first, we can skip all of that if already connected.
      try {
        console.log('[AmazonConnect] Checking connection status...');
        const statusResponse = await api.getIntegrationsStatus();
        console.log('[AmazonConnect] Connection status response:', statusResponse);
        if (statusResponse.ok && statusResponse.data?.amazon_connected) {
          // Amazon is already connected! Show sync popup
          console.log('[AmazonConnect] ✅ Amazon already connected, showing sync popup');
          setConnecting(false);
          setUsingExisting(false);
          setShowSyncPopup(true);
          return;
        } else {
          console.log('[AmazonConnect] ⚠️ Amazon not connected yet, attempting bypass...');
        }
      } catch (statusError) {
        // If status check fails, continue with bypass endpoint (might be first time)
        console.log('[AmazonConnect] Status check failed, trying bypass endpoint:', statusError);
      }

      // If not connected, try the bypass endpoint with a shorter timeout
      // Use a promise race to timeout faster if backend is slow
      const bypassPromise = api.useExistingAmazonConnection();
      const timeoutPromise = new Promise<Awaited<typeof bypassPromise>>((_, reject) => {
        setTimeout(() => reject(new Error('Connection check timed out. The backend may be sleeping. Please try again in a moment.')), 15000); // 15s timeout instead of 45s
      });

      console.log('[AmazonConnect] Attempting bypass connection...');
      const response = await Promise.race([bypassPromise, timeoutPromise]);
      console.log('[AmazonConnect] Bypass response:', response);

      if (response.ok) {
        if (response.data?.bypassed && response.data?.redirectUrl) {
          console.log('[AmazonConnect] ✅ Bypass successful! Backend found refresh token and validated it.');
          console.log('[AmazonConnect] Redirect URL:', response.data.redirectUrl);
          
          // Handle bypass response according to Phase 1 requirements
          const data = response.data;
          if (data.sandboxMode && !data.connectionVerified) {
            // In sandbox mode with mock data
            toast({
              title: 'Connected!',
              description: 'Using test data.',
              duration: 3000,
            });
          } else {
            toast({
              title: 'Amazon connected successfully!',
              description: 'Your account is now connected.',
              duration: 3000,
            });
          }
          
          // Redirect to dashboard or provided redirect URL
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          } else {
            window.location.href = '/dashboard?amazon_connected=true';
          }
          return;
        }

        const authUrl = response.data?.auth_url || response.data?.authUrl;
        if (authUrl) {
          console.log('[AmazonConnect] ⚠️ No refresh token found, redirecting to OAuth flow');
          console.log('[AmazonConnect] OAuth URL:', authUrl);
          toast({
            title: 'Verification Required',
            description: 'Redirecting you to Amazon to refresh access.',
            duration: 2000,
          });
          window.location.href = authUrl;
          return;
        }

        console.log('[AmazonConnect] ❌ Bypass failed: No redirect URL or OAuth URL returned');
        toast({
          title: 'Existing Connection Unavailable',
          description: 'No saved connection found. Please use the main connect option.',
          variant: 'destructive'
        });
      } else {
        console.log('[AmazonConnect] ❌ Bypass failed:', response.error);
        toast({
          title: 'Connection Failed',
          description: response.error || 'Could not reuse the existing connection. Please try the main connect button.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('[AmazonConnect] Use existing failed:', error);
      
      // Provide more helpful error messages
      if (error?.message?.includes('timed out') || error?.message?.includes('sleeping')) {
        toast({
          title: '⏱️ Backend Slow to Respond',
          description: 'The backend is taking longer than expected. This usually means it\'s waking up from sleep. Please wait 30-60 seconds and try again, or use the main "Connect Amazon Account" button.',
          variant: 'destructive',
          duration: 8000,
        });
      } else {
        toast({
          title: 'Connection Error',
          description: error?.message || 'An unexpected error occurred. Please try the main connect button instead.',
          variant: 'destructive'
        });
      }
    } finally {
      setConnecting(false);
      setUsingExisting(false);
    }
  };

  const handleSyncData = () => {
    // Close both popups
    setShowSyncPopup(false);
    setShowNotificationSheet(false);
    // Reset notification flag
    notificationShownRef.current = false;
    // Navigate to sync page
    navigate('/smart-inventory-sync');
  };

  // Calculate circular progress for SVG
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (syncProgress / 100) * circumference;

  // Check if className includes w-full to make buttons full width
  const isFullWidth = className?.includes('w-full');
  
  return (
    <>
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleConnect}
          disabled={connecting}
          className={cn(
            isFullWidth ? 'w-full' : 'w-auto',
            'justify-center bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg transition-colors px-8',
            connecting && (!showUseExisting || !usingExisting) && 'opacity-80',
            className
          )}
          size="lg"
        >
          {connecting && (!showUseExisting || !usingExisting) ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Amazon Account'
          )}
        </Button>
          {showUseExisting && (
            <Button
              onClick={handleUseExisting}
              disabled={connecting}
              variant="outline"
              className={cn(
                isFullWidth ? 'w-full' : 'w-auto',
                'justify-center border-emerald-500 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors px-8',
                connecting && usingExisting && 'opacity-80'
              )}
              size="lg"
            >
              {connecting && usingExisting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Reconnecting...
                </>
              ) : (
                'Use Existing Connection (Skip OAuth)'
              )}
            </Button>
          )}
      </div>

      {/* Sync Data Popup */}
      <Dialog open={showSyncPopup} onOpenChange={(open) => {
        // Prevent closing while loading (before 100%)
        if (!open && syncProgress >= 100) {
          setShowSyncPopup(false);
        }
      }}>
        <DialogContent 
          className="max-w-lg bg-[whitesmoke] backdrop-blur-md border border-gray-200 text-gray-900 shadow-[0_20px_80px_rgba(15,23,42,0.25)] rounded-2xl"
          onInteractOutside={(e) => {
            // Prevent closing by clicking outside while loading
            if (syncProgress < 100) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing with Escape key while loading
            if (syncProgress < 100) {
              e.preventDefault();
            }
          }}
        >
          {/* CLARIO Logo - Top Left */}
          <div className="absolute top-4 left-4">
            <span className="font-black text-[#b3b3b3] tracking-tight text-sm">
              CLARIO
            </span>
          </div>
          
          <DialogHeader>
            <DialogTitle className="text-lg text-gray-900 text-center">
              Analysing 18 months of seller data
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            {/* Circular Progress Indicator */}
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="rgb(229, 231, 235)"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="rgb(156, 163, 175)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                />
              </svg>
              {/* Percentage text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-semibold text-gray-700">
                  {Math.round(syncProgress)}%
                </span>
              </div>
            </div>

            {/* Cycling word */}
            {syncProgress < 100 && (
              <div className="text-center">
                <p className="text-sm text-gray-600 animate-pulse">
                  Processing {syncWords[currentWord]}...
                </p>
              </div>
            )}

            {/* Sync Data Button */}
            <Button
              onClick={handleSyncData}
              disabled={syncProgress < 100}
              className={cn(
                "w-full font-semibold shadow-lg transition-colors",
                syncProgress >= 100 
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
              size="lg"
            >
              Sync Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Panel - Slides from right at 32% */}
      {showNotificationSheet && (
        <div 
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-[whitesmoke] backdrop-blur-md border border-gray-200 text-gray-900 shadow-[0_20px_80px_rgba(15,23,42,0.25)] rounded-2xl p-6 transition-transform duration-500 ease-out"
          style={{ 
            transform: showNotificationSheet ? 'translateX(0) translateY(-50%)' : 'translateX(100%) translateY(-50%)',
            transition: 'transform 0.5s ease-out'
          }}
        >
          <div className="relative">
            {/* CLARIO Logo - Top Left */}
            <div className="absolute top-0 left-0">
              <span className="font-black text-[#b3b3b3] tracking-tight text-sm">
                CLARIO
              </span>
            </div>
            
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                Discrepancies Found
              </h3>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="space-y-3">
                  {/* First discrepancy - appears at 32% */}
                  {syncProgress >= 32 && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Orders</span>
                        <span className="text-lg font-semibold text-gray-900">23</span>
                      </div>
                      <div className="flex items-center justify-end mt-1">
                        <span className="text-xs text-gray-900">valued at: </span>
                        <span className="text-xs font-semibold text-blue-600 ml-1">$149.00</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Second discrepancy - appears at 39% */}
                  {syncProgress >= 39 && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Shipments</span>
                        <span className="text-lg font-semibold text-gray-900">15</span>
                      </div>
                      <div className="flex items-center justify-end mt-1">
                        <span className="text-xs text-gray-900">valued at: </span>
                        <span className="text-xs font-semibold text-blue-600 ml-1">$800.09</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Third discrepancy - appears at 45% */}
                  {syncProgress >= 45 && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Settlement</span>
                        <span className="text-lg font-semibold text-gray-900">45</span>
                      </div>
                      <div className="flex items-center justify-end mt-1">
                        <span className="text-xs text-gray-900">valued at: </span>
                        <span className="text-xs font-semibold text-blue-600 ml-1">$740.00</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Fourth discrepancy - appears at 50% */}
                  {syncProgress >= 50 && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Fee Dispute</span>
                        <span className="text-lg font-semibold text-gray-900">12</span>
                      </div>
                      <div className="flex items-center justify-end mt-1">
                        <span className="text-xs text-gray-900">valued at: </span>
                        <span className="text-xs font-semibold text-blue-600 ml-1">$450.00</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                These discrepancies will be analyzed and processed during the sync.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}