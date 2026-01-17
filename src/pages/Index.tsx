import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import { ArrowRight, Gift, Sparkles, CircleDollarSign, ShieldAlert, ShieldCheck, FileText, Search, Briefcase } from 'lucide-react';
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
    title: "Sync your FBA data",
    color: "bg-emerald-500/50",
    description: "This agent performs a continuous forensic audit of your Amazon SP-API data—cross-referencing inventory movements, shipments, returns, reimbursements, fees, and claims across 26 detection models to uncover financial discrepancies and recovery opportunities that standard tools miss."
  },
  {
    title: "Detect Discrepancies",
    color: "bg-amber-500/50",
    description: "The engine automatically analyzes 18 months of inventory history to identify over 26 types of FBA errors, from lost inbound shipments to unpaid refunds, identifying funds that Amazon owes you."
  },
  {
    title: "Match Evidence",
    color: "bg-emerald-500/50",
    description: "Our Evidence Engine autonomously locates and matches required documentation—like BOLs, PODs, and supplier invoices—directly from your email or Google Drive to build a watertight case."
  },
  {
    title: "File Disputes",
    color: "bg-blue-500/50",
    description: "Margin constructs a perfect claim package and submits it directly to Amazon Seller Support. Our AI case managers handle all follow-up correspondence until the case is resolved."
  },
  {
    title: "Recover Funds",
    color: "bg-emerald-500/50",
    description: "Approved reimbursements are deposited directly into your Amazon account. You get paid first, and we only invoice our 20% commission after the funds are safely in your bank."
  },
  {
    title: "Live Notifications",
    color: "bg-emerald-500/50",
    description: "Stay in the loop with real-time alerts for every action—from new discrepancies found to successful reimbursements deposited. You never have to guess what Margin is doing."
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
  const [activeStep, setActiveStep] = useState(-1);
  const [agentHighlightIndex, setAgentHighlightIndex] = useState(0);

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
              <div className="flex flex-col gap-2 rounded-[20px] border border-white/40 bg-white/80 supports-[backdrop-filter]:bg-white/70 backdrop-blur-2xl p-4 shadow-2xl max-h-[calc(100vh-120px)] overflow-y-auto">
                <div className="rounded-[18px] border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4" aria-hidden="true" />
                    <span>No commission on referrals</span>
                  </div>
                  <p className="mt-1 text-xs font-normal text-gray-700/80">
                    Sellers who bring new sellers to Margin keep 100% value of their recovered funds
                  </p>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="products" className="border-none">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-800 hover:bg-white/70 hover:text-gray-900 transition-colors hover:no-underline">
                      Products
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 px-4 space-y-5">
                      {/* Core Platform Section */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em] pl-1">Core Platform</h5>
                        <div className="grid gap-2">
                          <a href="#reimbursements" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/50 transition-colors border border-transparent hover:border-gray-100">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-600 border border-gray-100">
                              <CircleDollarSign className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-gray-900 tracking-tight">FBA Reimbursements</div>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5 font-medium">Automated recovery for lost & damaged inventory.</p>
                              <div className="mt-1.5 inline-block text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">18-month lookback</div>
                            </div>
                          </a>
                          <a href="#fee-guard" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/50 transition-colors border border-transparent hover:border-gray-100">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-600 border border-gray-100">
                              <ShieldAlert className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-gray-900 tracking-tight">Live Fee Guard</div>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5 font-medium">Audit Inbound Placement & Defect fees in real-time.</p>
                            </div>
                          </a>
                          <a href="#invoice-sync" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/50 transition-colors border border-transparent hover:border-gray-100">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-600 border border-gray-100">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-gray-900 tracking-tight">Auto-Invoice Sync</div>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5 font-medium">Zero-touch Gmail integration for evidence matching.</p>
                            </div>
                          </a>
                        </div>
                      </div>

                      {/* Trust & Scale Section */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em] pl-1">Trust & Scale</h5>
                        <div className="grid gap-2">
                          <a href="#forensic-auditor" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/50 transition-colors border border-transparent hover:border-gray-100">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-600 border border-gray-100">
                              <Search className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-gray-900 tracking-tight">Forensic Log Auditor</div>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5 font-medium">Line-by-line proof for every claim filed.</p>
                            </div>
                          </a>
                          <a href="#portfolio-manager" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/50 transition-colors border border-transparent hover:border-gray-100">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-600 border border-gray-100">
                              <Briefcase className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-gray-900 tracking-tight">Agency Portfolio Manager</div>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5 font-medium">Multi-account reconciliation for high-volume agencies.</p>
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
            {/* Gradient mesh background */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-emerald-100/60 via-teal-50/40 to-sky-100/50 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-50/40 via-white to-teal-50/30 rounded-full blur-3xl" />
            </div>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Right Column: Product Visualization */}
              <div className="order-2 lg:order-2 relative">
                {/* Main Dashboard Image */}
                <div className="relative rounded-2xl bg-gradient-to-b from-gray-50/50 to-white/50 p-2 shadow-2xl backdrop-blur-sm border border-gray-100/50 transform transition-transform duration-700 hover:scale-[1.01]">
                  <img
                    src={heroImage}
                    alt="Margin Dashboard"
                    className="w-full h-auto rounded-xl shadow-sm border border-black/5"
                  />
                </div>
                {/* Decorative blob behind image */}
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-100/30 to-sky-100/30 blur-3xl -z-10 rounded-full opacity-70" />
              </div>

              {/* Right Column: Text content */}
              <div className="order-1 lg:order-1 flex flex-col items-start text-left space-y-6">

                {/* Trust chip */}
                <div className="relative inline-flex items-center gap-2 md:gap-4 rounded-[20px] md:rounded-[25px] border border-emerald-100 bg-white/85 px-3 py-1.5 md:px-5 md:py-2 shadow-[0_12px_45px_rgba(16,185,129,0.25)] backdrop-blur supports-[backdrop-filter]:bg-white/70 overflow-hidden">
                  <span className="pointer-events-none absolute inset-0 rounded-[20px] md:rounded-[25px] bg-gradient-to-r from-emerald-200/40 via-white/10 to-sky-200/40 blur-xl" aria-hidden="true" />
                  <span className="pointer-events-none absolute inset-0 rounded-[20px] md:rounded-[25px] border border-white/40" aria-hidden="true" />
                  <span className="relative flex items-center gap-1 md:gap-2">
                    <span className="relative h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-800">
                      <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                    </span>
                  </span>
                  <div className="relative flex items-center gap-1.5 md:gap-3 text-xs md:text-sm font-bold text-gray-700">
                    <span>Links seamlessly with</span>
                    <span className="inline-flex items-center gap-1.5 md:gap-3">
                      <span className="relative inline-flex h-5 w-5 md:h-7 md:w-7 items-center justify-center rounded-full bg-transparent">
                        <img src="/gmailicon.png" alt="Gmail" width={28} height={28} className="h-5 w-5 md:h-7 md:w-7 object-contain" />
                      </span>
                      <span className="relative inline-flex h-5 w-5 md:h-7 md:w-7 items-center justify-center rounded-full bg-transparent">
                        <img src="/outlookicon.webp" alt="Outlook" width={28} height={28} className="h-5 w-5 md:h-7 md:w-7 object-contain" />
                      </span>
                      <span className="text-emerald-500 font-bold text-sm md:text-lg">+</span>
                      <span className="relative inline-flex h-5 w-5 md:h-7 md:w-7 items-center justify-center rounded-full bg-transparent">
                        <img src="/gd.png" alt="Google Drive" width={28} height={28} className="h-5 w-5 md:h-7 md:w-7 object-contain" />
                      </span>
                    </span>
                  </div>
                </div>

                <h1 className="font-merriweather text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                  FBA Reimbursements on
                  <span className="bg-gradient-to-r from-[#1f4037] to-[#10B981] bg-clip-text text-transparent ml-2">
                    Autopilot
                  </span>
                </h1>

                <p className="font-montserrat text-base md:text-lg text-gray-600 font-normal max-w-xl leading-relaxed">
                  Margin provides the infrastructure for Amazon profit recovery. We link directly to your Seller Central to audit every micro transaction, recover lost inventory, and automate reimbursements—turning messy data into immediate capital.
                </p>

                <div className="w-full flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <AmazonConnect className="w-full sm:w-auto min-w-[200px]" />
                    <Link
                      to="/contact"
                      className="w-full sm:w-auto min-w-[160px] h-11 rounded-lg bg-transparent text-gray-700 font-medium inline-flex items-center justify-center gap-2 hover:text-gray-900 transition-colors">
                      Talk to Sales <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                  {/* Trust text */}
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 font-medium">
                    <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-[#36454F]" />
                    <span>Verified Amazon SP-API Developer</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Demo Section - Standalone Polished Block */}
          <div className="w-full relative z-20 mt-24 md:mt-36 mb-24">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8">
              {/* Dark container for "Startup" feel */}
              <div className="bg-[#050505] rounded-[32px] p-8 md:p-12 lg:p-16 relative overflow-hidden shadow-2xl border border-white/5">

                {/* Background Accents (Subtle) */}
                <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-b from-indigo-500/5 to-purple-500/5 blur-[120px] pointer-events-none opacity-40" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[500px] bg-gradient-to-t from-emerald-500/5 to-blue-500/5 blur-[100px] pointer-events-none opacity-30" />

                <div className="flex flex-col gap-12 items-center relative z-10 w-full max-w-6xl mx-auto">

                  {/* 1. Centered Header */}
                  <div className="text-center space-y-4 max-w-2xl mx-auto mb-4">
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white leading-tight">
                      See Margin in Action
                    </h2>
                    <p className="text-base md:text-lg text-gray-400 font-normal leading-relaxed">
                      Run a live simulation to see how our engine detects lost revenue.
                    </p>
                  </div>

                  {/* 2. Full-Width Demo */}
                  <div className="w-full">
                    <div className="relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 transition-transform hover:scale-[1.005] duration-700 bg-black/40 backdrop-blur-sm">
                      <InteractiveDemo className="max-w-none w-full !h-[600px] md:!h-[650px] shadow-none border-0 rounded-none bg-transparent" />
                    </div>
                  </div>

                  {/* 3. Horizontal Timeline */}
                  <div className="w-full relative mt-8 px-4 md:px-12">
                    {/* Connecting Line */}
                    <div className="absolute top-3 left-12 right-12 h-0.5 bg-gray-800 rounded-full overflow-hidden -z-10" />

                    <div className="flex justify-between items-start w-full gap-4">
                      {WORKFLOW_STEPS.map((step, index) => (
                        <div
                          key={index}
                          className={`flex flex-col items-center gap-4 cursor-pointer group flex-1 ${activeStep === index ? 'opacity-100' : 'opacity-40 hover:opacity-70'} transition-all duration-300`}
                          onClick={() => setActiveStep(activeStep === index ? -1 : index)}
                        >
                          {/* Dot / Indicator */}
                          <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 z-10 flex items-center justify-center ${activeStep === index ? 'bg-white border-white scale-125 shadow-glow' : 'bg-gray-900 border-gray-600 group-hover:border-gray-400'}`}>
                            {activeStep === index && <div className="w-2 h-2 rounded-full bg-black" />}
                          </div>

                          {/* Label */}
                          <div className="text-center space-y-2">
                            <h4 className={`text-sm md:text-base font-medium transition-colors ${activeStep === index ? 'text-white' : 'text-gray-400'}`}>
                              {step.title}
                            </h4>
                            {/* Description Dropdown (Absolute or inline?) Inline fits better for timeline if text is short, but description is long. Let's make it a small tooltip-like block below. */}
                            <div className={`transition-all duration-500 overflow-hidden ${activeStep === index ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                              <p className="text-xs text-gray-500 max-w-[180px] mx-auto leading-relaxed">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 w-full" style={{ background: 'white' }}>


            <section className="bg-white pt-16 pb-8 md:pt-24 md:pb-12 w-full overflow-x-hidden">
              <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-20 space-y-6">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                    frequently asked questions
                  </span>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-gray-900 leading-[1.1]">
                    Everything you wanted to ask <br className="hidden md:block" />
                    before Margin starts recovering funds.
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

                    <AccordionItem value="data" className="border border-gray-100 rounded-2xl bg-gray-50/30 px-6 py-1 transition-all hover:bg-gray-50/50 hover:border-gray-200 group">
                      <AccordionTrigger className="font-montserrat text-left text-lg font-semibold text-gray-900 hover:no-underline py-6">
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

                    <AccordionItem value="cost" className="border border-gray-100 rounded-2xl bg-gray-50/30 px-6 py-1 transition-all hover:bg-gray-50/50 hover:border-gray-200 group">
                      <AccordionTrigger className="font-montserrat text-left text-lg font-semibold text-gray-900 hover:no-underline py-6">
                        How much does Margin cost?
                      </AccordionTrigger>
                      <AccordionContent className="font-montserrat pb-6 text-base text-gray-600 leading-relaxed space-y-4">
                        <p>
                          It&apos;s simple: We take a 20% commission on successfully recovered funds. There are no monthly fees, no setup fees, and no hidden costs. If you don&apos;t get paid, we don&apos;t get paid.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="comparison" className="border border-gray-100 rounded-2xl bg-gray-50/30 px-6 py-1 transition-all hover:bg-gray-50/50 hover:border-gray-200 group">
                      <AccordionTrigger className="font-montserrat text-left text-lg font-semibold text-gray-900 hover:no-underline py-6">
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
                        <AccordionItem value="roi" className="border border-gray-100 rounded-2xl bg-gray-50/30 px-6 py-1 transition-all hover:bg-gray-50/50 hover:border-gray-200 group">
                          <AccordionTrigger className="font-montserrat text-left text-lg font-semibold text-gray-900 hover:no-underline py-6">
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
                        <AccordionItem value="onboarding" className="border border-gray-100 rounded-2xl bg-gray-50/30 px-6 py-1 transition-all hover:bg-gray-50/50 hover:border-gray-200 group">
                          <AccordionTrigger className="font-montserrat text-left text-lg font-semibold text-gray-900 hover:no-underline py-6">
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
                        <AccordionItem value="coexist" className="border border-gray-100 rounded-2xl bg-gray-50/30 px-6 py-1 transition-all hover:bg-gray-50/50 hover:border-gray-200 group">
                          <AccordionTrigger className="font-montserrat text-left text-lg font-semibold text-gray-900 hover:no-underline py-6">
                            What if I already use another reimbursement service?
                          </AccordionTrigger>
                          <AccordionContent className="font-montserrat pb-6 text-base text-gray-600 leading-relaxed space-y-4">
                            <p>
                              No problem. Run Margin alongside your current tool. We&apos;re confident our AI Evidence Engine will find dollars that manual audits missed. You only pay us for the new funds we recover.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="cancel" className="border border-gray-100 rounded-2xl bg-gray-50/30 px-6 py-1 transition-all hover:bg-gray-50/50 hover:border-gray-200 group">
                          <AccordionTrigger className="font-montserrat text-left text-lg font-semibold text-gray-900 hover:no-underline py-6">
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
                        className="group flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors">
                        <span>View more questions</span>
                        <Search className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <section className="bg-white pt-12 pb-12 md:pt-16 md:pb-16 flex flex-col items-center text-center px-6">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-10 max-w-4xl">
              Get started with Margin
            </h2>
            <div className="flex flex-col items-center gap-4">
              <AmazonConnect className="min-w-[240px] h-14 text-lg rounded-full shadow-lg hover:shadow-xl transition-all font-normal" />
              <p className="text-sm text-gray-500 font-medium">
                Audit your last 18 months for free. No credit card required.
              </p>
            </div>
          </section>

          <BrandFooter />
          <CookieConsent />
        </main>
      </div>
    </div>
  );
};

export default Index;
