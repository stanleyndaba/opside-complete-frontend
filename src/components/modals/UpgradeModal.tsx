import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, Lock, CreditCard, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
}

export function UpgradeModal({ isOpen, onClose, caseId }: UpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Psychological Backdrop: Blurred Table Visibility */}
      <DialogContent className="max-w-md bg-zinc-950 border border-white/10 p-0 overflow-hidden shadow-2xl rounded-sm sm:rounded-sm flex flex-col items-center justify-center z-[9999]">
        {/* Header Visual: Security Core */}
        <div className="w-full bg-white/[0.02] border-b border-white/5 py-12 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="relative">
            <div className="w-20 h-20 rounded-none border border-white/20 flex items-center justify-center bg-black shadow-[0_0_50px_rgba(255,255,255,0.05)]">
              <Shield className="w-10 h-10 text-white/80" strokeWidth={1} />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-none bg-white border border-black flex items-center justify-center">
              <Lock className="w-4 h-4 text-black" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Institutional Content */}
        <div className="px-8 py-10 w-full space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight uppercase font-sans">Unlock Agent 7</h2>
            <p className="text-[11px] font-sans font-bold text-white/40 uppercase tracking-widest leading-relaxed px-4">
              Agent 7 is ready to file {caseId ? `Case ${caseId.substring(0, 8)}` : 'this claim'}. Upgrade your engine for $99/month to execute.
            </p>
          </div>

          {/* Benefits Grid - Monochrome Terminals */}
          <div className="grid grid-cols-1 gap-px bg-white/5 border border-white/5">
            <div className="bg-black/40 p-4 flex items-center gap-4 group hover:bg-white/[0.02] transition-colors">
              <div className="w-1 h-1 rounded-full bg-white/40 group-hover:bg-white transition-colors" />
              <div className="flex-1">
                <p className="text-[10px] font-sans font-bold text-white uppercase tracking-tight">Unlimited Auto-Filing</p>
                <p className="text-[9px] font-sans font-bold text-white/20 uppercase">Zero-Touch Submission Pipeline</p>
              </div>
            </div>
            <div className="bg-black/40 p-4 flex items-center gap-4 group hover:bg-white/[0.02] transition-colors">
              <div className="w-1 h-1 rounded-full bg-white/40 group-hover:bg-white transition-colors" />
              <div className="flex-1">
                <p className="text-[10px] font-sans font-bold text-white uppercase tracking-tight">Handshake Priority</p>
                <p className="text-[9px] font-sans font-bold text-white/20 uppercase">Amazon Case Management Overlay</p>
              </div>
            </div>
          </div>

          {/* Primary Action */}
          <div className="space-y-4 pt-2">
            <Button 
              className="w-full h-14 bg-white hover:bg-white/90 text-black font-black uppercase tracking-tighter text-lg rounded-none transition-all flex items-center justify-between px-8"
              onClick={() => {
                // Future: PayPal Handshake Logic
                window.open('https://paypal.com', '_blank');
              }}
            >
              PAY $99 VIA PAYPAL
              <ChevronRight className="w-6 h-6" strokeWidth={3} />
            </Button>
            
            <button 
              onClick={onClose}
              className="w-full text-[9px] font-bold text-white/20 hover:text-white uppercase tracking-widest transition-colors py-2"
            >
              ABORT_SESSION
            </button>
          </div>
        </div>

        {/* Ledger Footer */}
        <div className="w-full bg-black border-t border-white/5 px-8 py-4 flex justify-between items-center">
          <span className="text-[8px] font-mono text-white/10 uppercase">Security_Protocol://Agent_7_Alpha</span>
          <div className="flex gap-2">
            <div className="w-1 h-1 bg-white/10" />
            <div className="w-1 h-1 bg-white/10" />
            <div className="w-1 h-1 bg-white/10" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
