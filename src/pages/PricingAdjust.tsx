import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';

export default function PricingAdjust() {
  return (
    <PageLayout title="Pricing Adjust" noPadding hideNavbar={true} hideSidebar={true} hideLogo={true} midnight>
      <div className="min-h-screen bg-[#050505] text-white relative flex flex-col items-center pt-32 md:pt-40 lg:pt-48 pb-24 overflow-hidden font-sans">
        <PublicNavbar />
        {/* Noise Texture Overlay */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1]" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
        />

        {/* Main Content Container */}
        <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center px-6 lg:px-10">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16 space-y-6"
          >
            <div className="flex flex-col items-center gap-4">
              <Badge variant="outline" className="text-[10px] font-bold uppercase border-white/10 text-white/70 px-5 py-1.5 bg-white/5 backdrop-blur-sm">
                Margin Pricing
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl items-stretch">
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
                    <Check className="mt-1 h-3.5 w-3.5 text-white/40 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-white">Success Fee: 20%</p>
                      <p className="text-[11px] text-white/30 uppercase tracking-wider">No upfront cost</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Check className="mt-1 h-3.5 w-3.5 text-white/40 shrink-0" />
                    <div>
                      <p className="text-sm text-white/80">Audit Window: Last 90 Days</p>
                      <p className="text-[11px] text-white/20 uppercase tracking-wider">Inventory & fee error scans</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Check className="mt-1 h-3.5 w-3.5 text-white/40 shrink-0" />
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
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex flex-col"
            >
              <div className="absolute inset-0 bg-white/[0.02] rounded-2xl border border-emerald-500/20 group-hover:bg-white/[0.04] group-hover:border-emerald-500/40 transition-all duration-500 backdrop-blur-sm" />
              
              <div className="relative p-8 flex flex-col h-full z-10">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 py-0.5 border border-white/10">Option 2</span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold text-emerald-400 border-emerald-500/30 uppercase tracking-tighter">Recommended</Badge>
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
                    <Check className="mt-1 h-3.5 w-3.5 text-emerald-500/60 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">Cost: One-time $99</p>
                      <p className="text-[11px] text-emerald-400/60 font-bold uppercase tracking-tight">100% credited against success fees</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Check className="mt-1 h-3.5 w-3.5 text-emerald-500/60 shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">18-Month Historical Deep Audit</p>
                      <p className="text-[11px] text-white/30 uppercase tracking-normal">Full account reconciliation scan</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Check className="mt-1 h-3.5 w-3.5 text-emerald-500/60 shrink-0" />
                    <p className="text-sm text-white/80 font-medium">Immediate processing (start in &lt; 5m)</p>
                  </div>

                  <div className="flex items-start gap-4">
                    <Check className="mt-1 h-3.5 w-3.5 text-emerald-500/60 shrink-0" />
                    <div>
                      <p className="text-sm text-white/80">Priority support & case follow ups</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Check className="mt-1 h-3.5 w-3.5 text-emerald-500/60 shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">Expert Case Escalation</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-[0.1em] font-bold">Bypasses automated bot rejections</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-6">
                  <Button 
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 px-8 rounded-2xl w-fit flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
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

            {/* Option 3: Enterprise / Agency */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex flex-col"
            >
              <div className="absolute inset-0 bg-white/[0.01] rounded-2xl border border-white/5 group-hover:bg-white/[0.02] group-hover:border-white/10 transition-all duration-500 backdrop-blur-[2px]" />
              <div className="relative p-8 flex flex-col h-full z-10">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-2 py-0.5 border border-white/5">Option 3</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Enterprise</h2>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-[11px] font-bold text-white/40">Custom solutions for scale:</span>
                </div>

                <div className="space-y-6 flex-grow mb-8">
                  <div className="flex items-start gap-4">
                    <Check className="mt-1 h-3.5 w-3.5 text-white/40 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-white">Custom Volume Pricing</p>
                      <p className="text-[11px] text-white/30 uppercase tracking-wider">For aggregators with 10+ accounts</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Check className="mt-1 h-3.5 w-3.5 text-white/40 shrink-0" />
                    <div>
                      <p className="text-sm text-white/80">Dedicated Account Manager</p>
                      <p className="text-[11px] text-white/20 uppercase tracking-wider">Direct line for complex claims</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Sparkles className="mt-1 h-3.5 w-3.5 text-violet-400 shrink-0" />
                    <div>
                      <p className="text-sm text-white/80">API Access</p>
                      <p className="text-[11px] text-violet-400/60 uppercase tracking-wider font-bold">Coming Soon</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Check className="mt-1 h-3.5 w-3.5 text-white/40 shrink-0" />
                    <div>
                      <p className="text-sm text-white/80">Priority SLA Support</p>
                      <p className="text-[11px] text-white/20 uppercase tracking-wider">Guaranteed response times</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-6">
                  <Button 
                    asChild
                    variant="outline"
                    className="border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-bold h-12 px-8 rounded-2xl w-fit flex items-center gap-2"
                  >
                    <a href="mailto:billing@margin-finance.com?subject=Enterprise Inquiry - Margin Finance">
                        Contact Sales
                        <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                  <div className="pt-6 border-t border-white/5">
                    <p className="text-[11px] text-white/30 italic font-light tracking-wide">"Tailored strategies for agencies and high-volume sellers."</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="w-full mt-24 relative z-10">
          <BrandFooter />
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
