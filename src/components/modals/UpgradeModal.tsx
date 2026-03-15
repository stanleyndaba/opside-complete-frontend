import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, Lock, CreditCard, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useSession } from '@/contexts/SessionContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
}

export function UpgradeModal({ isOpen, onClose, caseId }: UpgradeModalProps) {
  const { user } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#0c0c0c] border border-white/10 p-0 shadow-2xl rounded-sm sm:rounded-sm z-[9999]">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-white/10">
          <h2 className="text-sm font-bold text-white tracking-tight uppercase">
            Unlock Agent 7 Execution Engine
          </h2>
          <p className="text-[11px] text-white/60 mt-2 font-medium">
            Active Case: {caseId ? caseId.substring(0, 8).toUpperCase() : 'PENDING_VALIDATION'}
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          <div className="space-y-4">
            <p className="text-[11px] text-white/40 uppercase font-bold tracking-tight">
              Subscription Protocol: $99.00 / Month
            </p>
            
            {/* Benefits List - Matching ProofDocumentsModal list style */}
            <div className="border border-white/10 rounded-sm overflow-hidden">
              <div className="bg-white/5 px-4 py-2 border-b border-white/10">
                <span className="text-[10px] text-white/40 font-bold uppercase">
                  Enabled Vector Protocols
                </span>
              </div>
              <div className="divide-y divide-white/10">
                <div className="px-4 py-3 bg-transparent flex items-center gap-3">
                  <div className="w-1 h-1 bg-white/40" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-white uppercase tracking-tight">Unlimited Auto-Filing</div>
                    <div className="text-[9px] text-white/30 uppercase mt-0.5">Zero-Touch Submission Pipeline</div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-transparent flex items-center gap-3">
                  <div className="w-1 h-1 bg-white/40" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-white uppercase tracking-tight">Handshake Priority</div>
                    <div className="text-[9px] text-white/30 uppercase mt-0.5">Amazon Case Management Overlay</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action */}
          <div className="space-y-4">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-10 bg-white/[0.02] border border-white/10 rounded-sm">
                <RefreshCw className="w-5 h-5 animate-spin text-white/40" strokeWidth={1} />
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-tight">Processing_Transaction...</p>
              </div>
            ) : (
              <PayPalScriptProvider options={{ "client-id": "AXZQsrMy-lI1ifLUoZLaMr9ZmED8fQhu4VA21SyRsI-v33-At4YVVcQPX-lIKlVPs7a2ccE0gqJ5tFN8" }}>
                <PayPalButtons 
                  style={{ layout: 'vertical', color: 'black', shape: 'rect', label: 'pay' }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [{
                        amount: { 
                          currency_code: "USD",
                          value: "99.00" 
                        },
                        custom_id: user?.id || 'anonymous'
                      }]
                    });
                  }}
                  onApprove={(data, actions) => {
                    setIsProcessing(true);
                    if (actions.order) {
                      return actions.order.capture().then(() => {
                        onClose();
                      });
                    }
                    return Promise.resolve();
                  }}
                />
              </PayPalScriptProvider>
            )}
            
            <button 
              onClick={onClose}
              disabled={isProcessing}
              className="w-full text-[10px] font-bold text-white/20 hover:text-white/60 uppercase tracking-tight transition-colors py-2 disabled:opacity-30"
            >
              [ ABORT_CONNECTION_SESSION ]
            </button>
          </div>
        </div>

        {/* Institutional Footer */}
        <div className="px-8 py-4 bg-white/[0.02] border-t border-white/10 flex justify-between items-center overflow-hidden">
          <span className="text-[8px] font-sans font-bold text-white/20 uppercase tracking-tight">Active Dispute Protection Engine</span>
          <div className="flex gap-1.5 grayscale opacity-20">
            <div className="w-1.5 h-1.5 bg-white" />
            <div className="w-1.5 h-1.5 bg-white" />
            <div className="w-1.5 h-1.5 bg-white" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
