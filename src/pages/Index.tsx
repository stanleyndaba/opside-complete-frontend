import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import { ArrowRight, Gift, Sparkles, CircleDollarSign, ShieldAlert, ShieldCheck, FileText, Search, Briefcase, BoxSelect, BadgePercent } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AmazonConnect } from '@/components/AmazonConnect';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { AGENT_HIGHLIGHTS, HERO_METRICS, SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { CookieConsent } from '@/components/landing/CookieConsent';
import { ProductsMegaMenu } from '@/components/landing/ProductsMegaMenu';
import { InteractiveDemo } from '@/components/landing/InteractiveDemo';

const heroImage = '/FRONTIMAGE.png';

const WORKFLOW_STEPS = [
  {
    title: "Import History",
    color: "bg-emerald-500/50",
    description: "This agent performs a continuous forensic audit of your Amazon SP-API data—cross-referencing inventory movements, shipments, returns, reimbursements, fees, and claims across 26 detection models to uncover financial discrepancies and recovery opportunities that standard tools miss.",
    duration: 3000
  },
  {
    title: "Deep Audit Review 18Mo",
    color: "bg-amber-500/50",
    description: "The engine automatically analyzes 18 months of inventory history to identify over 26 types of FBA errors, from lost inbound shipments to unpaid refunds, identifying funds that Amazon owes you.",
    duration: 9000
  },
  {
    title: "Verify Claims",
    color: "bg-emerald-500/50",
    description: "Our Evidence Engine autonomously locates and matches required documentation—like BOLs, PODs, and supplier invoices—directly from your email or Google Drive to build a watertight case.",
    duration: 6000
  },
  {
    title: "Hands-Free Filing",
    color: "bg-blue-500/50",
    description: "Margin constructs a perfect claim package and submits it directly to Amazon Seller Support. Our AI case managers handle all follow-up correspondence until the case is resolved.",
    duration: 5000
  },
  {
    title: "Reimbursement Payout",
    color: "bg-emerald-500/50",
    description: "Approved reimbursements are deposited directly into your Amazon account. You get paid first, and we only invoice our 20% commission after the funds are safely in your bank.",
    duration: 4000
  },
  {
    title: "Instant Ledger Update",
    color: "bg-emerald-500/50",
    description: "Stay in the loop with real-time alerts for every action—from new discrepancies found to successful reimbursements deposited. You never have to guess what Margin is doing.",
    duration: 6000
  }
];

const PadlockIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path
      d="M12 15V10C12 6.13401 15.134 3 19 3C22.866 3 26 6.13401 26 10V15"
      stroke="#065f46"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <rect x="9" y="15" width="20" height="17" rx="4" fill="#059669" />
    <path
      d="M19 21C20.1046 21 21 21.8954 21 23C21 23.8894 20.4212 24.6538 19.6154 24.9133L20 28H18L18.3846 24.9133C17.5788 24.6538 17 23.8894 17 23C17 21.8954 17.8954 21 19 21Z"
      fill="white"
    />
  </svg>
);

const Index = () => {
  usePageMeta(SITE_META);
  const { toast } = useToast();
  const [showMoreFAQs, setShowMoreFAQs] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [agentHighlightIndex, setAgentHighlightIndex] = useState(0);

  // Auto-Play Effect
  useEffect(() => {
    if (activeStep === -1 || isPaused) return;

    const stepDuration = WORKFLOW_STEPS[activeStep]?.duration || 5000;
    const timer = setTimeout(() => {
      setActiveStep((prev) => (prev + 1) % WORKFLOW_STEPS.length);
    }, stepDuration);

    return () => clearTimeout(timer);
  }, [activeStep, isPaused]);

  const handleSignIn = async () => {
    try {
      setSigningIn(true);

      // Start OAuth flow (same as Connect Amazon Account)
      const response = await api.connectAmazon();

      if (!response.ok) {
        console.error('[Index] Failed to get OAuth URL:', response.error);

        // Check if backend returned authUrl in error response (backwards compatibility)
        const errorData = typeof response.error === 'object' ? response.error as any : {};
        const authUrl = errorData.authUrl || errorData.auth_url || errorData.redirectTo;

        if (authUrl) {
          console.log('[Index] Backend returned authUrl in error, redirecting:', authUrl);
          window.location.href = authUrl;
          return;
        }

        toast({
          title: 'Connection Failed',
          description: response.error || 'Failed to start Amazon authentication. Please try again.',
          variant: 'destructive'
        });
        setSigningIn(false);
        return;
      }

      // Handle both auth_url and authUrl (backend may return either)
      const authUrl = response.data?.auth_url || response.data?.authUrl;
      const stateParam = response.data?.state;

      if (stateParam) {
        try {
          sessionStorage.setItem('amazon_sandbox_state', stateParam);
          localStorage.setItem('amazon_sandbox_state', stateParam);
        } catch { }
      }

      if (authUrl && authUrl.includes('/auth/amazon-sandbox')) {
        try {
          sessionStorage.setItem('amazon_sandbox_mode', 'true');
          localStorage.setItem('amazon_sandbox_mode', 'true');
        } catch { }
      }

      if (authUrl) {
        // Track the connection attempt
        await api.trackEvent('amazon_connect_initiated', {
          timestamp: new Date().toISOString(),
          source: 'navbar_sign_in'
        });

        // Redirect user to Amazon
        window.location.href = authUrl;
      } else {
        // No auth URL received
        console.error('[Index] No auth URL received from backend');
        toast({
          title: 'Connection Failed',
          description: 'No authorization URL received from backend. Please try again.',
          variant: 'destructive'
        });
        setSigningIn(false);
      }
    } catch (error: any) {
      console.error('[Index] Sign in failed:', error);
      toast({
        title: 'Connection Error',
        description: error?.message || 'An unexpected error occurred during authentication.',
        variant: 'destructive'
      });
      setSigningIn(false);
    }
  };
  const benefitWords = useMemo(
    () => [
      'Recover Faster',
      'Save More',
      'Gain Clarity',
      'Re-Assert More'
    ],
    []
  );
  const [benefitIndex, setBenefitIndex] = useState(0);
  const [precisionCount, setPrecisionCount] = useState(0);
  const [metricValues, setMetricValues] = useState<number[]>(() => HERO_METRICS.map(() => 0));
  const metricIntervals = React.useRef<number[]>([]);
  const metricsRef = React.useRef<HTMLDivElement>(null);
  const [metricsInView, setMetricsInView] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const previousBodyBg = document.body.style.backgroundColor;
    const previousHtmlBg = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = '#ffffff';
    document.documentElement.style.backgroundColor = '#ffffff';
    return () => {
      document.body.style.backgroundColor = previousBodyBg;
      document.documentElement.style.backgroundColor = previousHtmlBg;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const interval = window.setInterval(() => {
      setAgentHighlightIndex((prev) => (prev + 1) % AGENT_HIGHLIGHTS.length);
    }, 3200);
    return () => window.clearInterval(interval);
  }, []);

  // Prevent body scroll when mobile menu is open to prevent image movement
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Animate precision counter from 0 to 99.27
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const targetValue = 99.27;
    const duration = 1500; // 1.5 seconds for fast animation
    const steps = 60; // 60 steps for smooth animation
    const increment = targetValue / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = window.setInterval(() => {
      currentStep++;
      const newValue = Math.min(increment * currentStep, targetValue);
      setPrecisionCount(parseFloat(newValue.toFixed(2)));

      if (newValue >= targetValue) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);



  // Scroll detection for banner visibility
  // Banner hides when scrolling down (towards footer)
  // Banner shows when scrolling up (towards top)
  const lastScrollYRef = React.useRef(0);
  const tickingRef = React.useRef(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const getScrollTop = () => window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    lastScrollYRef.current = getScrollTop();

    const updateBanner = () => {
      const currentScrollY = getScrollTop();
      const lastScrollY = lastScrollYRef.current;
      const diff = currentScrollY - lastScrollY;

      // Lower threshold for mobile touch scrolling
      if (diff > 8) {
        setShowBanner(false);
        lastScrollYRef.current = currentScrollY;
      } else if (diff < -8) {
        setShowBanner(true);
        lastScrollYRef.current = currentScrollY;
      }
      tickingRef.current = false;
    };

    const handleScroll = () => {
      if (!tickingRef.current) {
        tickingRef.current = true;
        requestAnimationFrame(updateBanner);
      }
    };

    // Listen on multiple targets for maximum compatibility
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Touch events for mobile
    document.addEventListener('touchmove', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('touchmove', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const ticker = window.setInterval(() => {
      setBenefitIndex((prev) => (prev + 1) % benefitWords.length);
    }, 3200);
    return () => window.clearInterval(ticker);
  }, [benefitWords]);


  const primaryLinks: { label: string; href: string }[] = [
    // { label: 'API', href: '/developer-api' } // Hidden temporarily
  ];


  // Intersection Observer to detect when metrics section scrolls into view
  useEffect(() => {
    if (typeof window === 'undefined' || !metricsRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Reset and trigger animation when scrolling into view
            setMetricsInView(false);
            // Small delay to ensure state resets before re-animating
            setTimeout(() => setMetricsInView(true), 50);
          }
        });
      },
      {
        threshold: 0.3, // Trigger when 30% of the element is visible
        rootMargin: '0px'
      }
    );

    observer.observe(metricsRef.current);

    // Trigger initial animation
    setMetricsInView(true);

    return () => observer.disconnect();
  }, []);

  // Animate metrics when they come into view
  useEffect(() => {
    if (typeof window === 'undefined' || !metricsInView) return;

    // Clear any existing intervals
    metricIntervals.current.forEach(id => window.clearInterval(id));

    // Reset values to 0
    setMetricValues(HERO_METRICS.map(() => 0));

    // Start counting up animations
    metricIntervals.current = HERO_METRICS.map((metric, index) => {
      const duration = 1500; // 1.5 seconds for the animation
      const steps = 60; // 60 steps for smooth animation
      const increment = metric.target / steps;
      const stepDuration = duration / steps;

      const intervalId = window.setInterval(() => {
        setMetricValues(prev => {
          const next = [...prev];
          const nextValue = Math.min(next[index] + increment, metric.target);
          next[index] = nextValue;
          if (nextValue >= metric.target) {
            window.clearInterval(metricIntervals.current[index]);
          }
          return next;
        });
      }, stepDuration);
      return intervalId;
    });

    return () => {
      metricIntervals.current.forEach(id => window.clearInterval(id));
    };
  }, [metricsInView]);

  const currentYear = new Date().getFullYear();

  return (
    <div
      className="min-h-screen flex flex-col text-gray-900 relative overflow-x-hidden w-full"
      style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Fixed navbar - stays at top while content scrolls underneath */}
      <header className="fixed top-0 left-0 right-0 z-40 border-transparent bg-transparent" style={{ background: 'transparent' }}>
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-6 px-6 py-4 rounded-[25px] border border-white/40 bg-white/25 supports-[backdrop-filter]:bg-white/25 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_25px_60px_rgba(15,23,42,0.12)] transition-colors">
            <div className="flex items-center gap-3">
              <Link to="/" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[16px] transition-colors hover:bg-gray-100">
                <img
                  src="/logoimagetwo.png"
                  alt="Margin"
                  className="h-5 w-auto object-contain"
                />
                <span className="font-montserrat text-gray-900" style={{ fontWeight: 600 }}>Margin</span>
              </Link>
              <span className="hidden md:inline text-gray-300">|</span>
              <Link
                to="/ultra-beta"
                className="flex items-center gap-2 group px-3 py-1.5 rounded-[16px] transition-colors hover:bg-emerald-50/50 border border-transparent hover:border-emerald-100/50">
                <span className="text-[13px] font-montserrat text-emerald-700" style={{ fontWeight: 600 }}>Ultra Beta</span>
                <span className="px-1.5 py-0.5 bg-emerald-500 text-[9px] font-bold text-white rounded-full leading-none">NEW</span>
              </Link>
              <span className="hidden md:inline text-gray-300">|</span>
              <div className="hidden md:block">
                <ProductsMegaMenu />
              </div>
            </div>


            <nav className="hidden md:flex items-center gap-4 text-sm text-gray-700">
              {/* Gift icon - hidden temporarily
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full p-2 text-emerald-600 transition-colors hover:text-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    aria-label="No commission on referrals">
                    <Gift className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">No commission on referrals</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="start" className="w-80 p-0 border-0 shadow-xl">
                  <div className="bg-emerald-50 rounded-lg p-5 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-emerald-900 text-base">No commission on referrals</h3>
                      <p className="text-sm text-emerald-800">
                        Sellers who bring new sellers to Margin keep 100% value of their recovered funds
                      </p>
                    </div>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                      Invite Friend +
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              */}
              {primaryLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="px-3 py-1.5 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors">
                  {link.label}
                </Link>
              ))}

              <Link
                to="/sales"
                className="h-9 px-5 text-sm font-medium text-white bg-black hover:bg-gray-900 transition-colors inline-flex items-center"
                style={{ borderRadius: '0px' }}>
                Enterprise
              </Link>
              <Link
                to="/contact"
                className="h-9 px-4 text-sm font-medium text-gray-700 bg-transparent hover:text-gray-900 transition-colors inline-flex items-center gap-1.5"
                style={{ borderRadius: '0px' }}>
                Talk to Sales <span aria-hidden="true">→</span>
              </Link>
            </nav>
            <button
              type="button"
              className="md:hidden flex flex-col items-end gap-1.5 rounded-[16px] border border-white/40 bg-white/40 px-3 py-2 transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}>
              <span className="block h-[1px] w-6 bg-gray-900 rounded-full" />
              <span className="block h-[1px] w-5 bg-gray-900 rounded-full" />
              <span className="block h-[1px] w-4 bg-gray-900 rounded-full" />
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="mt-4 md:hidden relative z-50">
              <div className="flex flex-col gap-2 rounded-[20px] border border-blue-100/50 bg-blue-50/90 [backdrop-filter:blur(32px)_saturate(180%)] p-4 shadow-2xl max-h-[calc(100vh-120px)] overflow-y-auto">
                <div className="rounded-[18px] border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4" aria-hidden="true" />
                    <span>No commission on referrals</span>
                  </div>
                  <p className="mt-1 text-xs font-normal text-gray-700/80">
                    Sellers who bring new sellers to Margin keep 100% value of their recovered funds
                  </p>
                </div>
                <Link
                  to="/ultra-beta"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50/50 border border-emerald-100/50 hover:bg-emerald-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>Ultra Beta</span>
                    <span className="px-1.5 py-0.5 bg-emerald-500 text-[9px] font-bold text-white rounded-full leading-none">NEW</span>
                  </div>
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                </Link>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="products" className="border-none">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-800 hover:bg-white/70 hover:text-gray-900 transition-colors hover:no-underline">
                      Products
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 px-4 space-y-5">
                      {/* Trust & Scale Section */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em] pl-1">Trust & Scale</h5>
                        <div className="grid gap-2">
                          <a href="#forensic-auditor" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-blue-200/50">
                            <div className="p-2 bg-white/40 rounded-lg text-gray-600 border border-white/40">
                              <Search className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-gray-900 tracking-tight">Inbound Fee Governance</div>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5 font-medium">Line-by-line proof for every claim filed.</p>
                            </div>
                          </a>
                          <a href="#portfolio-manager" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-blue-200/50">
                            <div className="p-2 bg-white/40 rounded-lg text-gray-600 border border-white/40">
                              <Briefcase className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-gray-900 tracking-tight">Agency Portfolio Manager</div>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5 font-medium">Multi-account reconciliation for high-volume agencies.</p>
                            </div>
                          </a>
                          <a href="#commission-governance" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-blue-200/50">
                            <div className="p-2 bg-white/40 rounded-lg text-gray-600 border border-white/40">
                              <BadgePercent className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-gray-900 tracking-tight">Commission Rate Governance</div>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5 font-medium">Detect category misclassifications and referral fee overcharges.</p>
                            </div>
                          </a>
                        </div>
                      </div>

                      {/* Core Platform Section */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em] pl-1">Core Platform</h5>
                        <div className="grid gap-2">
                          <a href="#reimbursements" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-blue-200/50">
                            <div className="p-2 bg-white/40 rounded-lg text-gray-600 border border-white/40">
                              <CircleDollarSign className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-gray-900 tracking-tight">FBA Reimbursements</div>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5 font-medium">Automated recovery for lost & damaged inventory.</p>
                              <div className="mt-1.5 inline-block text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">18-month lookback</div>
                            </div>
                          </a>
                          <a href="#fee-guard" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-blue-200/50">
                            <div className="p-2 bg-white/40 rounded-lg text-gray-600 border border-white/40">
                              <ShieldAlert className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-gray-900 tracking-tight">Inbound Variance Monitor</div>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5 font-medium">Audit Inbound Placement & Defect fees in real-time.</p>
                            </div>
                          </a>
                          <a href="#invoice-sync" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-blue-200/50">
                            <div className="p-2 bg-white/40 rounded-lg text-gray-600 border border-white/40">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-gray-900 tracking-tight">Auto-Invoice Sync</div>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5 font-medium">Zero-touch Gmail integration for evidence matching.</p>
                            </div>
                          </a>
                          <a href="#dimension-auditor" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-blue-200/50">
                            <div className="p-2 bg-white/40 rounded-lg text-gray-600 border border-white/40">
                              <BoxSelect className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-gray-900 tracking-tight">Dimension & Weight Auditor</div>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5 font-medium">Auto-detect storage tier overcharges and trigger re-measurements.</p>
                            </div>
                          </a>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                {primaryLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-800 hover:bg-white/70 hover:text-gray-900 transition-colors">
                    {link.label}
                  </Link>
                ))}

                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-800 hover:bg-white/70 hover:text-gray-900 transition-colors flex items-center justify-between">
                  <span>Talk to Sales</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>

                <Link
                  to="/sales"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-800 hover:bg-white/70 hover:text-gray-900 transition-colors flex items-center justify-between">
                  <span>Margin Enterprise</span>
                  <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">VIP</span>
                </Link>

                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignIn();
                  }}
                  disabled={signingIn}
                  variant="outline"
                  className="mt-1 w-full justify-center h-9 rounded-full border border-gray-200 bg-gray-100/80 text-sm font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors">
                  {signingIn ? 'Connecting...' : 'Sign in'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>
      <div className="relative z-10" style={{ background: 'white' }}>
        <main className="flex-1 relative z-10" style={{ background: 'white' }}>
          <section className="relative container mx-auto px-6 pt-24 md:pt-32 lg:pt-36 pb-12 lg:pb-16 overflow-hidden">
            {/* Premium Dual-Layer Background */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
              {/* Layer 1: Radial Mesh Gradients */}
              <div className="absolute -top-[20%] -right-[10%] w-[1000px] h-[1000px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_70%)] blur-[120px]" />
              <div className="absolute top-[10%] -left-[5%] w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06),transparent_70%)] blur-[100px]" />
              <div className="absolute -bottom-[20%] right-[15%] w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.05),transparent_70%)] blur-[110px]" />

              {/* Layer 2: Technical Noise Grain */}
              <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center max-w-3xl mx-auto">

              {/* Text content - now centered */}
              <div className="flex flex-col items-center space-y-6">

                {/* Institutional Trust Badge */}
                <div className="relative inline-flex items-center gap-3 md:gap-5 rounded-[22px] md:rounded-[30px] border border-white/40 bg-white/30 backdrop-blur-2xl backdrop-saturate-150 px-4 py-2 md:px-6 md:py-2.5 shadow-[0_20px_50px_rgba(31,64,55,0.08),0_1px_2px_rgba(255,255,255,0.4)_inset] overflow-hidden group transition-all duration-500 hover:bg-white/40 hover:shadow-[0_25px_60px_rgba(31,64,55,0.12)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/20 via-blue-100/10 to-emerald-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <span className="relative flex items-center gap-1.5 md:gap-2">
                    <span className="relative h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-600">
                      <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                    </span>
                  </span>
                  <div className="relative flex items-center gap-2 md:gap-4 text-[10px] md:text-xs font-bold text-gray-800 tracking-tight">
                    <span className="opacity-60 uppercase tracking-widest font-mono">Links seamlessly with</span>
                    <span className="inline-flex items-center gap-2 md:gap-4">
                      {[
                        { src: '/gmailicon.png', alt: 'Gmail' },
                        { src: '/outlookicon.webp', alt: 'Outlook' }
                      ].map((icon, i) => (
                        <div key={i} className="relative h-5 w-5 md:h-6 md:w-6 p-0.5 rounded-md bg-white/40 border border-white/60 shadow-sm flex items-center justify-center">
                          <img src={icon.src} alt={icon.alt} className="h-full w-full object-contain" />
                        </div>
                      ))}
                      <span className="text-emerald-500 font-bold text-sm md:text-base">+</span>
                      <div className="relative h-5 w-5 md:h-6 md:w-6 p-0.5 rounded-md bg-white/40 border border-white/60 shadow-sm flex items-center justify-center">
                        <img src="/gd.png" alt="Google Drive" className="h-full w-full object-contain" />
                      </div>
                    </span>
                  </div>
                </div>

                <h1 className="font-merriweather text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 leading-[1.05] selection:bg-emerald-100">
                  FBA Reimbursements <br className="hidden lg:block" />
                  on <span className="bg-gradient-to-r from-[#1f4037] to-[#10B981] bg-clip-text text-transparent">Autopilot</span>
                </h1>

                <p className="font-montserrat text-base md:text-lg text-gray-600 font-medium max-w-xl leading-[1.6] opacity-80">
                  Margin provides the sovereign infrastructure for Amazon profit recovery. We link directly to your Seller Central to audit every micro-transaction and automate reimbursements—turning messy data into immediate capital.
                </p>

                {/* Buttons - centered */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <AmazonConnect className="w-full sm:w-auto min-w-[200px] h-11 text-sm font-medium" />
                </div>
              </div>
            </motion.div>
          </section>

          {/* Interactive Demo Section - Standalone Polished Block */}
          <section className="w-full relative z-20 mt-24 md:mt-36 mb-24">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-[1400px] mx-auto px-4 md:px-8">
              {/* Technical Header */}
              <div className="text-center space-y-6 max-w-3xl mx-auto mb-16 relative z-10">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="h-[1px] w-8 bg-gray-200" />
                  <span className="text-[10px] font-bold text-gray-400 font-mono tracking-[0.3em] uppercase">
                    Audit Node 01
                  </span>
                  <div className="h-[1px] w-8 bg-gray-200" />
                </div>
                <h2 className="text-3xl md:text-5xl font-merriweather font-bold tracking-tight text-gray-900 leading-tight">
                  Detect 18+ Hidden <br className="hidden sm:block" />
                  Discrepancies in &lt; 30s
                </h2>
                <p className="text-base md:text-lg text-gray-600 font-montserrat leading-relaxed max-w-xl mx-auto">
                  Watch our real-time audit engine scan a $1M+ seller portfolio for missed capital and logistical errors.
                </p>
              </div>

              {/* Dark container for "Startup" feel */}
              <div className="bg-[#050505] rounded-[24px] p-6 md:p-8 relative overflow-hidden shadow-2xl border border-white/5">

                {/* Background Accents (Subtle) */}
                <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-b from-indigo-500/5 to-purple-500/5 blur-[120px] pointer-events-none opacity-40" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[500px] bg-gradient-to-t from-emerald-500/5 to-blue-500/5 blur-[100px] pointer-events-none opacity-30" />

                <div className="flex flex-col gap-6 items-center relative z-10 w-full mx-auto">

                  {/* Video Demo Placeholder */}
                  <div className="w-full aspect-video rounded-xl overflow-hidden relative bg-[#0a0a0a] border border-white/5 shadow-2xl group cursor-pointer">
                    {/* Placeholder Background Pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                      <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl">
                          <svg className="w-6 h-6 text-black ml-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-center space-y-2 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Institutional Preview</p>
                        <p className="text-white/20 text-xs font-mono">ENCRYPTED_FEED_STREAM_V2</p>
                      </div>
                    </div>

                    {/* Corner Markers */}
                    <div className="absolute top-4 left-4 h-4 w-4 border-t border-l border-white/20" />
                    <div className="absolute top-4 right-4 h-4 w-4 border-t border-r border-white/20" />
                    <div className="absolute bottom-4 left-4 h-4 w-4 border-b border-l border-white/20" />
                    <div className="absolute bottom-4 right-4 h-4 w-4 border-b border-r border-white/20" />
                  </div>

                  {/* Real-time Status Bar */}
                  <div className="w-full flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-gray-500 font-mono tracking-widest uppercase">Live Audit Stream</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 font-mono uppercase">Engine Latency</span>
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">&lt; 10ms</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 font-mono uppercase">Detection Models</span>
                        <span className="text-[10px] font-bold text-white font-mono">26 Active</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded">
                        <span className="text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase">Node_Status: </span>
                        <span className="text-[10px] font-bold text-emerald-500 font-mono tracking-tight">OPERATIONAL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          <div className="relative z-10 w-full" style={{ background: 'white' }}>


            <section className="bg-white pt-16 pb-8 md:pt-24 md:pb-12 w-full overflow-x-hidden">
              <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-16 sm:mb-24 space-y-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="h-[1px] w-8 bg-gray-200" />
                    <span className="text-[10px] font-bold text-gray-400 font-mono tracking-[.3em] uppercase">
                      frequently asked questions
                    </span>
                    <div className="h-[1px] w-8 bg-gray-200" />
                  </div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-merriweather font-bold tracking-tight text-gray-900 leading-[1.1] md:leading-[1.2] max-w-4xl mx-auto">
                    Institutional Support <br className="hidden md:block" />
                    & Fundamental Inquiry
                  </h2>
                </div>

                <div className="space-y-4">
                  <Accordion type="single" collapsible className="w-full space-y-4">
                    {/* Hidden for now
                <AccordionItem value="safety" className="border border-gray-100 rounded-2xl bg-gray-50/30 px-6 py-1 transition-all hover:bg-gray-50/50 hover:border-gray-200 group">
                  <AccordionTrigger className="font-montserrat text-left text-lg font-semibold text-gray-900 hover:no-underline py-6">
                    Is this safe? Will linking my account get me suspended by Amazon?
                  </AccordionTrigger>
                  <AccordionContent className="font-montserrat pb-6 text-base text-gray-600 leading-relaxed space-y-4">
                    <p>
                      This is our most important priority. Yes, it is 100% safe. We are an officially-verified Amazon developer using the secure Selling Partner API (SP-API).
                    </p>
                    <p>
                      We only perform actions that are fully compliant with Amazon&apos;s Terms of Service. Margin simply does the work of a manual audit, but 1,000x faster and with perfect accuracy.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                */}

                    <AccordionItem value="data" className="border border-blue-100/30 rounded-2xl bg-blue-50/20 backdrop-blur-md px-6 py-1 transition-all hover:bg-blue-50/40 hover:border-blue-200/50 group overflow-hidden">
                      <AccordionTrigger className="font-montserrat text-left text-lg font-bold text-gray-900 hover:no-underline py-6 tracking-tight">
                        What data do you access? Do you look at my customer info or sales?
                      </AccordionTrigger>
                      <AccordionContent className="font-montserrat pb-6 text-base text-gray-600 leading-relaxed space-y-4">
                        <p>
                          We never look at your customer&apos;s personal information (PII). Our access is limited strictly to the data required for reimbursements: inventory reports, shipment details, and transaction history.
                        </p>
                        <p>
                          Our Evidence Engine can optionally scan your email or Google Drive, but only for invoice PDFs and proof-of-delivery documents. We don&apos;t care about your sales and we will never sell your data.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="cost" className="border border-blue-100/30 rounded-2xl bg-blue-50/20 backdrop-blur-md px-6 py-1 transition-all hover:bg-blue-50/40 hover:border-blue-200/50 group overflow-hidden">
                      <AccordionTrigger className="font-montserrat text-left text-lg font-bold text-gray-900 hover:no-underline py-6 tracking-tight">
                        How much does Margin cost?
                      </AccordionTrigger>
                      <AccordionContent className="font-montserrat pb-6 text-base text-gray-600 leading-relaxed space-y-4">
                        <p>
                          It&apos;s simple: We take a 20% commission on successfully recovered funds. There are no monthly fees, no setup fees, and no hidden costs. If you don&apos;t get paid, we don&apos;t get paid.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="comparison" className="border border-blue-100/30 rounded-2xl bg-blue-50/20 backdrop-blur-md px-6 py-1 transition-all hover:bg-blue-50/40 hover:border-blue-200/50 group overflow-hidden">
                      <AccordionTrigger className="font-montserrat text-left text-lg font-bold text-gray-900 hover:no-underline py-6 tracking-tight">
                        How is this different from GETIDA, Sellerise, or Helium 10?
                      </AccordionTrigger>
                      <AccordionContent className="font-montserrat pb-6 text-base text-gray-600 leading-relaxed space-y-4">
                        <p>
                          Those tools are dashboards or agencies. They identify problems, but you or their auditors still have to gather evidence and build the case. Margin is an autonomous AI agent.
                        </p>
                        <p>
                          Our Evidence Engine finds the error, locates the matching invoice from your email, builds the case, and files it for you. It&apos;s zero effort, not just less effort.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    {showMoreFAQs && (
                      <>
                        <AccordionItem value="roi" className="border border-blue-100/30 rounded-2xl bg-blue-50/20 backdrop-blur-md px-6 py-1 transition-all hover:bg-blue-50/40 hover:border-blue-200/50 group overflow-hidden">
                          <AccordionTrigger className="font-montserrat text-left text-lg font-bold text-gray-900 hover:no-underline py-6 tracking-tight">
                            How much money will I actually get back?
                          </AccordionTrigger>
                          <AccordionContent className="font-montserrat pb-6 text-base text-gray-600 leading-relaxed space-y-4">
                            <p>
                              On average, FBA sellers lose 1–3% of annual revenue to “small” errors. For a seller doing $1M a year, that&apos;s $10,000 to $30,000 in lost profit.
                            </p>
                            <p>
                              We can&apos;t guarantee an exact amount, but our AI audits 18 months of data to find every dollar Amazon owes you.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="onboarding" className="border border-blue-100/30 rounded-2xl bg-blue-50/20 backdrop-blur-md px-6 py-1 transition-all hover:bg-blue-50/40 hover:border-blue-200/50 group overflow-hidden">
                          <AccordionTrigger className="font-montserrat text-left text-lg font-bold text-gray-900 hover:no-underline py-6 tracking-tight">
                            What do I have to do to get started?
                          </AccordionTrigger>
                          <AccordionContent className="font-montserrat pb-6 text-base text-gray-600 leading-relaxed space-y-4">
                            <p>It takes about two minutes:</p>
                            <ul className="list-disc space-y-2 pl-5 text-gray-600">
                              <li>Sign up for a Margin account.</li>
                              <li>Securely connect your Amazon Seller Central account via the SP-API.</li>
                              <li>(Optional) Grant read-only access to your email or Google Drive so our AI can gather invoices.</li>
                            </ul>
                            <p>That&apos;s it. Margin begins auditing immediately.</p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="coexist" className="border border-blue-100/30 rounded-2xl bg-blue-50/20 backdrop-blur-md px-6 py-1 transition-all hover:bg-blue-50/40 hover:border-blue-200/50 group overflow-hidden">
                          <AccordionTrigger className="font-montserrat text-left text-lg font-bold text-gray-900 hover:no-underline py-6 tracking-tight">
                            What if I already use another reimbursement service?
                          </AccordionTrigger>
                          <AccordionContent className="font-montserrat pb-6 text-base text-gray-600 leading-relaxed space-y-4">
                            <p>
                              No problem. Run Margin alongside your current tool. We&apos;re confident our AI Evidence Engine will find dollars that manual audits missed. You only pay us for the new funds we recover.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="cancel" className="border border-blue-100/30 rounded-2xl bg-blue-50/20 backdrop-blur-md px-6 py-1 transition-all hover:bg-blue-50/40 hover:border-blue-200/50 group overflow-hidden">
                          <AccordionTrigger className="font-montserrat text-left text-lg font-bold text-gray-900 hover:no-underline py-6 tracking-tight">
                            What if I want to cancel?
                          </AccordionTrigger>
                          <AccordionContent className="font-montserrat pb-6 text-base text-gray-600 leading-relaxed space-y-4">
                            <p>
                              You can cancel anytime. Disconnect Margin from Seller Central and you&apos;re done—no lock-in contracts. We&apos;ll only invoice the 20% commission on claims that were successfully paid out before you canceled.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </>
                    )}
                  </Accordion>

                  {!showMoreFAQs && (
                    <div className="flex justify-center pt-8">
                      <button
                        onClick={() => setShowMoreFAQs(true)}
                        className="group flex items-center gap-3 text-[11px] font-bold text-gray-400 font-mono tracking-[.25em] hover:text-gray-900 transition-all uppercase">
                        <Search className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                        <span>Query Extended Database</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <section className="bg-white pt-24 pb-24 md:pt-32 md:pb-32 flex flex-col items-center text-center px-6 relative overflow-hidden">
            {/* Background Mesh Accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 space-y-8 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-[1px] w-8 bg-gray-200" />
                <span className="text-[10px] font-bold text-gray-400 font-mono tracking-[0.3em] uppercase">
                  RECOVERY_INIT
                </span>
                <div className="h-[1px] w-8 bg-gray-200" />
              </div>

              <h2 className="text-4xl md:text-6xl lg:text-7xl font-merriweather font-bold tracking-tight text-gray-900 leading-[1.1]">
                Ready to secure <br className="hidden md:block" />
                your recovery?
              </h2>

              <div className="flex flex-col items-center gap-6 pt-4">
                <AmazonConnect className="min-w-[220px] h-11 text-sm transition-all duration-500 font-medium active:scale-95" />
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[11px] font-bold text-gray-400 font-mono tracking-[0.2em] uppercase">
                    Verification Phase // Phase 01
                  </p>
                  <p className="text-sm text-gray-500 font-medium">
                    Audit your last 18 months for free. No credit card required.
                  </p>
                </div>
              </div>
            </motion.div>
          </section>

          <BrandFooter />
          <CookieConsent />
        </main>
      </div>

    </div>
  );
};

export default Index;
