import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';

export default function StandardAgreement() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'agreed' | 'disagreed'>('pending');

  const handleAgree = () => {
    setStatus('agreed');
    // Navigate to data upload after a short delay
    setTimeout(() => {
      navigate('/app/default/data-upload');
    }, 1500);
  };

  const handleDisagree = () => {
    setStatus('disagreed');
    // Redirect to main landing page after a delay
    setTimeout(() => {
      window.location.href = 'https://margin-finance.com';
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      <PublicNavbar />
      
      <main className="relative pt-32 pb-24 px-6 flex flex-col items-center justify-center min-h-[80vh]">
        {/* Modern Background Accents */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        </div>

        <div className="relative z-10 w-full max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {status === 'pending' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 md:p-12 backdrop-blur-xl space-y-8"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white/95">
                    Standard Service Agreement
                  </h1>
                  <p className="text-white/40 text-sm md:text-base leading-relaxed">
                    Please review and acknowledge our performance-based fee structure to proceed with your automated audit.
                  </p>
                </div>

                <div className="space-y-6 py-6 border-y border-white/5">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-white tracking-tight">20% Performance Fee</p>
                      <p className="text-sm text-white/40 leading-relaxed font-light">
                        The platform will automatically charge a <span className="text-white/80 font-medium">20% commission fee</span> only on the capital recovered.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-white tracking-tight">Deferred Billing</p>
                      <p className="text-sm text-white/40 leading-relaxed font-light">
                        This fee is initiated <span className="text-white/80 font-medium">7 days after</span> your reimbursement clocks into your Amazon settlement balance.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    onClick={handleAgree}
                    className="flex-1 h-14 rounded-full bg-white text-black font-bold text-sm uppercase tracking-tight hover:bg-white/90 transition-all"
                  >
                    I Agree & Proceed
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleDisagree}
                    variant="outline"
                    className="flex-1 h-14 rounded-full border-white/10 text-white/40 hover:text-white hover:bg-white/5 font-bold text-sm uppercase tracking-tight transition-all"
                  >
                    Disagree
                  </Button>
                </div>
              </motion.div>
            )}

            {status === 'agreed' && (
              <motion.div
                key="agreed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-light tracking-tight">Agreement Confirmed</h2>
                  <p className="text-white/40">Redirecting you to the Data Upload engine...</p>
                </div>
              </motion.div>
            )}

            {status === 'disagreed' && (
              <motion.div
                key="disagreed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-light tracking-tight">Thank You</h2>
                  <p className="text-white/40 max-w-sm">
                    We understand. We look forward to working with you in the future when the time is right.
                  </p>
                  <p className="text-white/20 text-xs">Redirecting to home...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}
