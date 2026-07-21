import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTenant } from '@/contexts/TenantContext';
import { Check, ArrowRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';

export default function StandardAgreement() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();
  const [status, setStatus] = useState<'pending' | 'agreed' | 'disagreed'>('pending');
  const activeSlug = tenantSlug || tenant?.slug || localStorage.getItem('active_tenant_slug') || '';

  const handleAgree = () => {
    setStatus('agreed');
    // Agreement acknowledgment is informational only. Billing stays on the tenant-scoped billing surface.
    setTimeout(() => {
      if (activeSlug) {
        navigate(`/app/${activeSlug}/billing`);
      } else {
        navigate('/pricing');
      }
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
    <PageLayout title="Service Agreement" noPadding hideNavbar={true} hideSidebar={true} hideLogo={true} midnight>
      <div className="min-h-screen bg-[#050505] text-white relative flex flex-col items-center pt-32 md:pt-40 lg:pt-48 pb-24 overflow-hidden font-sans">
        <PublicNavbar />
        {/* Noise Texture Overlay */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1]" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
        />

        <div className="relative z-10 w-full max-w-2xl mx-auto px-6">
          <AnimatePresence mode="wait">
            {status === 'pending' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex flex-col"
              >
                <div className="absolute inset-0 bg-white/[0.01] rounded-[32px] border border-white/5 group-hover:bg-white/[0.02] group-hover:border-white/10 transition-all duration-500 backdrop-blur-xl" />
                
                <div className="relative p-8 md:p-12 flex flex-col h-full z-10 space-y-8">
                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className="flex flex-col items-center gap-4">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase border-white/10 text-white/70 px-5 py-1.5 bg-white/5 backdrop-blur-sm">
                        Standard Agreement
                      </Badge>
                      <div className="h-px w-12 bg-white/10" />
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white/95 leading-tight">
                      Service Agreement
                    </h1>
                    <p className="text-sm md:text-base text-white/40 tracking-tight max-w-md mx-auto">
                      Review and acknowledge our subscription terms. Payment still happens from the tenant billing page after an invoice exists.
                    </p>
                  </div>

                  <div className="space-y-6 py-6 border-y border-white/5">
                    <div className="flex items-start gap-4">
                      <Check className="mt-1 h-3.5 w-3.5 text-white/40 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white tracking-tight">Selected Plan Terms</p>
                        <p className="text-[11px] text-white/30 uppercase tracking-tight font-light">
                          Your checkout controls the monthly fee, success fee, or Early Access credit that applies
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Check className="mt-1 h-3.5 w-3.5 text-white/40 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white tracking-tight">Founding 500 Credit</p>
                        <p className="text-[11px] text-white/30 uppercase tracking-tight font-light">
                          Early Access members keep 100% through 2026 and can credit $99 toward Pro or Scale
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      onClick={handleAgree}
                      className="flex-1 bg-white hover:bg-white/90 text-black font-bold h-14 rounded-2xl flex items-center justify-center gap-2 transition-all"
                    >
                      I Agree & Proceed
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleDisagree}
                      variant="outline"
                      className="flex-1 h-14 rounded-2xl border-white/10 bg-transparent text-white/40 hover:text-white hover:bg-white/5 font-bold transition-all"
                    >
                      Disagree
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {status === 'agreed' && (
              <motion.div
                key="agreed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex flex-col items-center"
              >
                <div className="absolute inset-0 bg-white/[0.01] rounded-[32px] border border-emerald-500/10 backdrop-blur-xl" />
                <div className="relative p-12 flex flex-col items-center text-center space-y-6 z-10">
                  <div className="flex flex-col items-center gap-4">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase border-emerald-500/20 text-emerald-400 px-5 py-1.5 bg-emerald-500/5 backdrop-blur-sm tracking-tight">
                      Confirmed
                    </Badge>
                    <div className="h-px w-12 bg-emerald-500/10" />
                  </div>
                  
                  <div className="space-y-3">
                    <h2 className="text-3xl md:text-4xl font-light tracking-tight text-white/95">Agreement Confirmed</h2>
                    <p className="text-sm md:text-base text-white/40 tracking-tight font-sans">
                      Redirecting you to Billing...
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {status === 'disagreed' && (
              <motion.div
                key="disagreed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex flex-col items-center"
              >
                <div className="absolute inset-0 bg-white/[0.01] rounded-[32px] border border-red-500/10 backdrop-blur-xl" />
                <div className="relative p-12 flex flex-col items-center text-center space-y-8 z-10">
                  <div className="flex flex-col items-center gap-4">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase border-red-500/20 text-red-400 px-5 py-1.5 bg-red-500/5 backdrop-blur-sm tracking-tight">
                      Notice
                    </Badge>
                    <div className="h-px w-12 bg-red-500/10" />
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-3xl md:text-4xl font-light tracking-tight text-white/95 leading-tight">Thank You</h2>
                    <p className="text-sm md:text-base text-white/40 tracking-tight max-w-sm mx-auto font-sans">
                      We understand. We look forward to working with you in the future when the time is right.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 w-full">
                    <p className="text-[10px] text-white/20 uppercase tracking-tight font-sans">Redirecting to home...</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="w-full mt-24 relative z-10">
          <BrandFooter />
        </div>
      </div>
    </PageLayout>
  );
}
