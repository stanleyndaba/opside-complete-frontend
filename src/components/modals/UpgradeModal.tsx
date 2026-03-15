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
        {/* Content */}
        <div className="px-8 py-10 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[11px] text-white/60 font-medium">
                Active Case: {caseId ? caseId.substring(0, 8).toUpperCase() : 'PENDING_VALIDATION'}
              </p>
              <p className="text-[11px] text-white/40 uppercase font-bold tracking-tight">
                Subscription: $99.00 / Month
              </p>
            </div>
            
            {/* Benefits List - Matching ProofDocumentsModal list style */}
            <div className="border border-white/10 rounded-sm overflow-hidden">
              <div className="bg-white/5 px-4 py-2 border-b border-white/10">
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-tight">
                  Includes
                </span>
              </div>
              <div className="divide-y divide-white/10">
                <div className="px-4 py-3 bg-transparent flex items-center gap-3">
                  <div className="w-1 h-1 bg-white/40" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-white uppercase tracking-tight">Unlimited Auto-Filing</div>
                    <div className="text-[9px] text-white/30 uppercase mt-0.5 tracking-tight">Zero-Touch Submission Pipeline</div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-transparent flex items-center gap-3">
                  <div className="w-1 h-1 bg-white/40" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-white uppercase tracking-tight">Handshake Priority</div>
                    <div className="text-[9px] text-white/30 uppercase mt-0.5 tracking-tight">Amazon Case Management Overlay</div>
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
              Do Not Upgrade
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
