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
      <div className="min-h-screen bg-[#050505] text-white relative flex flex-col items-center justify-center p-6 lg:p-10 overflow-hidden">
        {/* Noise Texture */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1]" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
        />

        {/* Aesthetic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none z-[1]" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none z-[1]" />

        {/* Main Content Container */}
        <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16 space-y-4"
          >
            <Badge variant="outline" className="text-[10px] font-mono tracking-[0.4em] uppercase border-emerald-500/30 text-emerald-400 px-4 py-1 bg-emerald-500/5">
              Service Configuration
            </Badge>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white/90">
              Choose how you want <span className="font-semibold text-white">Margin</span> to recover your reimbursements
            </h1>
          </motion.div>

          {/* Pricing Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
            {/* Option 1: Standard Recovery */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-white/[0.01] rounded-3xl border border-white/5 group-hover:bg-white/[0.02] group-hover:border-white/10 transition-all duration-500" />
              <div className="relative p-10 flex flex-col h-full">
                <div className="mb-8">
                  <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest mb-4">Option 1</h3>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-white">Standard Recovery</h2>
                    <span className="text-xs text-white/20 font-mono">(Default)</span>
                  </div>
                </div>

                <div className="space-y-6 flex-grow">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <DollarSign className="h-3 w-3 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Cost: 20% success fee</p>
                      <p className="text-xs text-white/40 font-mono">No upfront cost</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-5 w-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <Clock className="h-3 w-3 text-white/40" />
                    </div>
                    <div>
                      <p className="text-sm text-white/80">Audit Depth: Last 90 days</p>
                      <p className="text-xs text-white/30">Fee and inventory error scans</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-5 w-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <Clock className="h-3 w-3 text-white/40" />
                    </div>
                    <p className="text-sm text-white/80">Speed: 1 business day processing</p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-5 w-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <ShieldCheck className="h-3 w-3 text-white/40" />
                    </div>
                    <p className="text-sm text-white/80">Terms: Payout after Amazon approval</p>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5">
                  <p className="text-[11px] text-white/30 italic">"Best if you’re not in a rush and just want money back on autopilot."</p>
                </div>
              </div>
            </motion.div>

            {/* Option 2: Priority Audit Pass */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-emerald-500/[0.02] rounded-3xl border border-emerald-500/20 group-hover:bg-emerald-500/[0.04] group-hover:border-emerald-500/40 transition-all duration-500 shadow-[0_0_40px_rgba(16,185,129,0.05)]" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-emerald-500 text-black text-[10px] font-bold tracking-widest uppercase px-4 py-1 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                  Highly Recommended
                </Badge>
              </div>
              
              <div className="relative p-10 flex flex-col h-full">
                <div className="mb-8">
                  <h3 className="text-sm font-mono text-emerald-500/60 uppercase tracking-widest mb-4">Option 2</h3>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-white">Priority Audit Pass</h2>
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                  </div>
                </div>

                <div className="space-y-6 flex-grow">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                      <Zap className="h-3 w-3 text-emerald-400 fill-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Cost: One-time $99</p>
                      <p className="text-xs text-emerald-500/60 font-mono">100% credited against success fee</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Search className="h-3 w-3 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white/90">18-Month Deep Dive</p>
                      <p className="text-xs text-white/40">Full historical legal audit scan</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Zap className="h-3 w-3 text-emerald-400" />
                    </div>
                    <p className="text-sm text-white/90">Speed: Immediate processing (&lt; 5m)</p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    </div>
                    <p className="text-sm text-white/90">Priority preparation & follow-ups</p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <FileText className="h-3 w-3 text-emerald-400" />
                    </div>
                    <p className="text-sm text-white/90">Full reporting breakdown</p>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-emerald-500/10">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-[11px] text-white/40 leading-relaxed font-mono">
                      <span className="text-white/60">Example:</span> If our 20% fee is $350, you only pay <span className="text-emerald-400 font-bold">$251</span> after your $99 credit.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-16 flex flex-col items-center gap-6"
          >
            <Button 
                size="lg"
                className="h-14 px-12 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-lg rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] group transition-all duration-300"
            >
              Start Immediately ($99 Priority Pass)
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
                variant="ghost"
                className="text-white/40 hover:text-white transition-colors tracking-widest text-[10px] font-bold uppercase"
            >
              Continue with Standard 20% Recovery
            </Button>
          </motion.div>

          {/* Bottom Explanation */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-24 max-w-3xl text-center space-y-8"
          >
            <div className="h-[1px] w-40 bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto" />
            
            <div className="space-y-6">
              <h3 className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-widest">Pricing Thesis</h3>
              <p className="text-base text-white/60 leading-relaxed font-light">
                "Margin works on a simple success-fee model: we take 20% of what we recover, and you only pay after Amazon actually deposits the funds into your bank account."
              </p>
              <p className="text-sm text-white/40 leading-relaxed max-w-2xl mx-auto italic font-serif">
                If you want us to jump on your account immediately and run a maximum 18-month historical audit, you can add a one-time Priority Audit Pass. You pay $99 today, we start processing in under 5 minutes, and that $99 is fully credited against your future success fees.
              </p>
            </div>
          </motion.div>
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
