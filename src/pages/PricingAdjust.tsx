import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Clock, FileText, CheckCircle2, ArrowRight, Sparkles, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PricingAdjust() {
  return (
    <PageLayout title="Pricing Adjust" noPadding hideNavbar={true} hideSidebar={true} hideLogo={true} midnight>
      <div className="min-h-screen bg-[#050505] text-white relative flex flex-col items-center justify-center p-6 lg:p-10 overflow-hidden font-sans">
        {/* Noise Texture Overlay */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1]" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
        />

        {/* Main Content Container */}
        <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16 space-y-6"
          >
            <div className="flex flex-col items-center gap-4">
              <Badge variant="outline" className="text-[10px] font-bold uppercase border-white/10 text-white/70 px-5 py-1.5 bg-white/5 backdrop-blur-sm">
                Pricing
              </Badge>
              <div className="h-px w-12 bg-white/10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white/95 leading-tight max-w-4xl">
              Pricing
            </h1>
            <p className="text-sm md:text-base text-white/40 tracking-tight max-w-2xl mx-auto">
              Choose how you want Margin to monitor and recover your Amazon reimbursements.
            </p>
          </motion.div>

          {/* Pricing Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl items-stretch">
            {/* Option 1: Standard Recovery */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex flex-col"
            >
              <div className="absolute inset-0 bg-white/[0.01] rounded-2xl border border-white/5 group-hover:bg-white/[0.02] group-hover:border-white/10 transition-all duration-500 backdrop-blur-[2px]" />
              <div className="relative p-8 flex flex-col h-full z-10">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-2 py-0.5 border border-white/5">Option 1</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Standard</h2>
                    <span className="text-[10px] text-white/30 uppercase tracking-widest">(Default)</span>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-[11px] font-bold text-white/40">Includes:</span>
                </div>

                <div className="space-y-6 flex-grow mb-8">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <DollarSign className="h-3 w-3 text-white/40" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Success Fee: 20%</p>
                      <p className="text-[11px] text-white/30 uppercase tracking-wider">No upfront cost</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <Clock className="h-3 w-3 text-white/40" />
                    </div>
                    <div>
                      <p className="text-sm text-white/80">Audit Window: Last 90 Days</p>
                      <p className="text-[11px] text-white/20 uppercase tracking-wider">Inventory & fee error scans</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <ShieldCheck className="h-3 w-3 text-white/40" />
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed font-light">Payouts are only generated after Amazon approves your reimbursements.</p>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-6">
                  <Button 
                    variant="secondary"
                    className="bg-white hover:bg-white/90 text-black font-bold h-12 px-8 rounded-2xl w-fit flex items-center gap-2"
                  >
                    Get Standard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div className="pt-6 border-t border-white/5">
                    <p className="text-[11px] text-white/30 italic font-light tracking-wide">"Best if you want to keep everything on autopilot with zero risk."</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Option 2: Priority Audit Pass */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex flex-col"
            >
              <div className="absolute inset-0 bg-white/[0.02] rounded-2xl border border-white/10 group-hover:bg-white/[0.04] group-hover:border-white/20 transition-all duration-500 backdrop-blur-sm" />
              
              <div className="relative p-8 flex flex-col h-full z-10">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 py-0.5 border border-white/10">Option 2</span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <span className="text-[10px] font-bold text-white uppercase ml-4 tracking-tighter">Highly recommended</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Priority</h2>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-[11px] font-bold text-white/40">Everything in Standard, plus:</span>
                </div>

                <div className="space-y-6 flex-grow mb-8">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-6 w-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                      <Zap className="h-3 w-3 text-white/80 fill-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Cost: One-time $99</p>
                      <p className="text-[11px] text-white/50 font-bold uppercase tracking-tight">100% credited against success fees</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <Search className="h-3 w-3 text-white/60" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">18-Month Historical Deep Audit</p>
                      <p className="text-[11px] text-white/30 uppercase tracking-normal">Full account reconciliation scan</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <Zap className="h-3 w-3 text-white/60" />
                    </div>
                    <p className="text-sm text-white/80 font-medium">Immediate processing (start in &lt; 5m)</p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white/60" />
                    </div>
                    <p className="text-sm text-white/80">Priority support, and case follow ups</p>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-6">
                  <Button 
                    variant="ghost"
                    className="text-white/70 hover:text-white font-bold h-12 px-8 rounded-2xl w-fit flex items-center gap-2 hover:bg-transparent"
                  >
                    Get Priority
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div className="pt-6 border-t border-white/10">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                      <p className="text-[11px] text-white/60 leading-relaxed tracking-tight">
                        <span className="text-white/80">Example:</span> If our 20% fee is $350, you only pay <span className="text-white font-bold">$251</span> after your $99 credit is applied.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

const Search = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
