import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import { ChevronDown, Link2, ScrollText, Check, Gift } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AmazonConnect } from '@/components/AmazonConnect';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const Index = () => {
  const { toast } = useToast();

  type LanguageOption = {
    code: string;
    country: string;
    language: string;
    flag: string;
  };

  const LANGUAGE_OPTIONS: LanguageOption[] = [
    { code: 'en', country: 'Global', language: 'English', flag: '🇺🇸' },
    { code: 'es', country: 'Global', language: 'Spanish', flag: '🇪🇸' },
    { code: 'zh', country: 'Global', language: 'Chinese (Mandarin)', flag: '🇨🇳' },
    { code: 'fr', country: 'Global', language: 'French', flag: '🇫🇷' },
    { code: 'de', country: 'Global', language: 'German', flag: '🇩🇪' },
    { code: 'ja', country: 'Global', language: 'Japanese', flag: '🇯🇵' },
    { code: 'ar', country: 'Global', language: 'Arabic', flag: '🇸🇦' },
  ];

  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('clario.langPreference') || 'en' : 'en'
  );
  const [langQuery, setLangQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);
  const lastScrollYRef = useRef(0);
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
    try {
      localStorage.setItem('clario.langPreference', selectedLanguageCode);
    } catch {}
  }, [selectedLanguageCode]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const ticker = window.setInterval(() => {
      setBenefitIndex((prev) => (prev + 1) % benefitWords.length);
    }, 3200);
    return () => window.clearInterval(ticker);
  }, [benefitWords]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDelta = currentScrollY - lastScrollYRef.current;
          
          setScrollY(currentScrollY);
          setIsScrollingUp(scrollDelta < 0);
          
          // Create "waking up" flip effect
          // When scrolling down: flip up (negative rotateX)
          // When scrolling up: flip up more (positive rotateX)
          // The more you scroll, the more it "wakes up"
          const scrollProgress = Math.min(currentScrollY / 500, 1); // Normalize to 0-1 over 500px scroll
          const baseRotation = scrollProgress * 15; // Max 15 degrees
          
          // Add direction-based rotation for more dynamic effect
          const directionRotation = scrollDelta < 0 ? 5 : -5; // Extra rotation based on direction
          const rotation = Math.max(-25, Math.min(25, baseRotation + directionRotation));
          
          setImageRotation(rotation);
          setLastScrollY(currentScrollY);
          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const primaryLinks = [
    { label: 'API', href: '/developer-api' },
    { label: 'Docs', href: '/docs' }
  ];

  const selectedLanguage: LanguageOption =
    LANGUAGE_OPTIONS.find((o) => o.code === selectedLanguageCode) || LANGUAGE_OPTIONS[0];

  const filteredLanguages = useMemo(() => {
    const q = langQuery.trim().toLowerCase();
    if (!q) return LANGUAGE_OPTIONS;
    return LANGUAGE_OPTIONS.filter(o =>
      o.language.toLowerCase().includes(q) ||
      o.country.toLowerCase().includes(q) ||
      o.code.toLowerCase().includes(q)
    );
  }, [langQuery]);

  return (
    <div 
      className="min-h-screen flex flex-col bg-white text-gray-900"
      style={{ fontFamily: "var(--font-inter),-apple-system,Helvetica,Arial,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"" }}
    >
      <header className="sticky top-0 z-40 border-transparent bg-transparent">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-6 px-6 py-4 rounded-[25px] border border-white/40 bg-white/25 supports-[backdrop-filter]:bg-white/25 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_25px_60px_rgba(15,23,42,0.12)] transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                {/* Brand dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[16px] transition-colors hover:bg-gray-100">
                      <span className="font-black text-[#b3b3b3] tracking-tight">
                        CLARIO
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[220px] bg-white/80 supports-[backdrop-filter]:bg-white/70 backdrop-blur-xl border border-white/30 text-gray-900 shadow-2xl">
                    <DropdownMenuItem asChild>
                      <Link to="/integrations-hub" className="flex items-center gap-2 hover:bg-gray-100 focus:bg-gray-100">
                        <Link2 className="h-4 w-4 text-emerald-600" />
                        <span>Integrations</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/terms" className="flex items-center gap-2 hover:bg-gray-100 focus:bg-gray-100">
                        <ScrollText className="h-4 w-4 text-emerald-600" />
                        <span>Terms & Policies</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                  <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                        className="inline-flex items-center justify-center text-emerald-600 transition-colors hover:text-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      aria-label="No commission on referrals"
                    >
                      <Gift className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">No commission on referrals</span>
                    </button>
                  </TooltipTrigger>
                    <TooltipContent side="bottom" align="start" sideOffset={8} className="max-w-xs text-sm">
                    Invite sellers to Clario and enjoy 0% commission on every referral you bring.
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
              <nav className="hidden md:flex items-center gap-4 text-sm text-gray-700">
                {primaryLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="px-3 py-1.5 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex items-center gap-2 h-9 px-3 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    aria-label="Language preference"
                  >
                    <span>{selectedLanguage.language}</span>
                    <ChevronDown className="h-4 w-4 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[240px] bg-white/80 supports-[backdrop-filter]:bg-white/70 backdrop-blur-xl border border-white/30 text-gray-900 shadow-2xl p-0">
                  <div className="p-2 sticky top-0 bg-white border-b border-black/5" onKeyDown={(e) => e.stopPropagation()}>
                    <Input
                      value={langQuery}
                      onChange={(e) => setLangQuery(e.target.value)}
                      placeholder="Search language..."
                      className="h-8 bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="max-h-64 overflow-auto">
                    {filteredLanguages.length === 0 ? (
                      <DropdownMenuItem disabled className="text-gray-400">No matches</DropdownMenuItem>
                    ) : (
                      filteredLanguages.map((opt) => (
                        <DropdownMenuItem key={opt.code} onClick={() => { setSelectedLanguageCode(opt.code); setLangQuery(''); }} className="gap-2 hover:bg-gray-100 focus:bg-gray-100">
                          <span className="font-medium">{opt.language}</span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
                <Link to="/login" className="inline-flex">
                  <Button
                    variant="outline"
                    className="h-9 rounded-full border border-gray-200 bg-gray-100/80 px-4 text-sm font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                  >
                    Login
                  </Button>
                </Link>
            </nav>
            <button
              type="button"
              className="md:hidden flex flex-col items-end gap-1.5 rounded-[16px] border border-white/40 bg-white/40 px-3 py-2 transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <span className="block h-[1px] w-6 bg-gray-900 rounded-full" />
              <span className="block h-[1px] w-5 bg-gray-900 rounded-full" />
              <span className="block h-[1px] w-4 bg-gray-900 rounded-full" />
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="mt-4 md:hidden">
              <div className="flex flex-col gap-2 rounded-[20px] border border-white/40 bg-white/80 supports-[backdrop-filter]:bg-white/70 backdrop-blur-2xl p-4 shadow-2xl">
                  <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4" aria-hidden="true" />
                      <span>No commission on referrals</span>
                    </div>
                    <p className="mt-1 text-xs font-normal text-emerald-700/80">
                      Bring new sellers to Clario and keep 100% of their recovered funds.
                    </p>
                  </div>
                {primaryLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-800 hover:bg-white/70 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-800 hover:bg-white/70 transition-colors"
                      aria-label="Language preference"
                    >
                      Language: {selectedLanguage.language}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[220px] bg-white/80 supports-[backdrop-filter]:bg-white/70 backdrop-blur-xl border border-white/30 text-gray-900 shadow-2xl p-0">
                    <div className="p-2 sticky top-0 bg-white border-b border-black/5" onKeyDown={(e) => e.stopPropagation()}>
                      <Input
                        value={langQuery}
                        onChange={(e) => setLangQuery(e.target.value)}
                        placeholder="Search language..."
                        className="h-8 bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 focus-visible:ring-emerald-500"
                      />
                    </div>
                    <div className="max-h-64 overflow-auto">
                      {filteredLanguages.length === 0 ? (
                        <DropdownMenuItem disabled className="text-gray-400">No matches</DropdownMenuItem>
                      ) : (
                        filteredLanguages.map((opt) => (
                          <DropdownMenuItem
                            key={opt.code}
                            onClick={() => {
                              setSelectedLanguageCode(opt.code);
                              setLangQuery('');
                              setMobileMenuOpen(false);
                            }}
                            className="gap-2 hover:bg-gray-100 focus:bg-gray-100"
                          >
                            <span className="font-medium">{opt.language}</span>
                          </DropdownMenuItem>
                        ))
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-1"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-center h-9 rounded-full border border-gray-200 bg-gray-100/80 text-sm font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                  >
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        <section className="relative container mx-auto px-6 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Trust chip removed per request */}
            {/* Cursive Text */}
            <div className="text-center mb-4">
              <div
                className="inline-block"
                style={{
                  fontFamily: 'cursive, "Brush Script MT", "Lucida Handwriting", serif',
                  fontStyle: 'italic',
                  color: '#3F3E3F',
                  fontSize: '1.125rem',
                }}
              >
                Clario works best with your work email!
              </div>
            </div>
              <div className="relative inline-flex items-center gap-4 rounded-[25px] border border-emerald-100 bg-white/85 px-5 py-2 shadow-[0_12px_45px_rgba(16,185,129,0.25)] backdrop-blur supports-[backdrop-filter]:bg-white/70 mx-auto overflow-hidden">
                <span className="pointer-events-none absolute inset-0 rounded-[25px] bg-gradient-to-r from-emerald-200/40 via-white/10 to-sky-200/40 blur-xl" aria-hidden="true" />
                <span className="pointer-events-none absolute inset-0 rounded-[25px] border border-white/40" aria-hidden="true" />
                <span className="relative text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">New</span>
                  <div className="relative flex items-center gap-3 text-sm font-medium text-gray-700">
                    <span>Links seamlessly with</span>
                    <span className="inline-flex items-center gap-3">
                      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm shadow-red-400/20">
                        <img
                          src="/gmailicon.png"
                          alt="Gmail"
                          className="h-7 w-7 object-contain"
                        />
                      </span>
                      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm shadow-blue-400/20">
                        <img
                          src="/outlookicon.webp"
                          alt="Outlook"
                          className="h-7 w-7 object-contain"
                        />
                      </span>
                    </span>
                </div>
              </div>
            <h1 className="font-heading text-4xl md:text-6xl font-black tracking-tight text-gray-900">
              The <span className="text-emerald-600">end</span> of FBA reimbursement work.
            </h1>
              <p className="font-body text-base md:text-xl text-gray-600 font-normal max-w-3xl mx-auto">
                Think AI Agents for Finance. Clario automates the entire reimbursement process, recovering lost revenue from Amazon FBA errors in minutes—not months.
            </p>
            <div className="pt-2">
                <div className="max-w-md mx-auto flex justify-center">
                  <AmazonConnect className="w-full" />
                </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                <div className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  <span className="text-gray-600 text-sm md:text-base">No credit cards</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  <span className="text-gray-600 text-sm md:text-base">Cancel anytime</span>
                </div>
              </div>
              {/* Email capture moved to bottom-left above the legal footer */}
            </div>
          </div>
          {/* Gradient transition at bottom of hero section */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-white/50 to-white pointer-events-none" />
        </section>
        
        {/* Dashboard Image with Scroll Animation */}
        <div className="relative bg-gradient-to-b from-white via-gray-50/30 to-white">
          <div className="container mx-auto px-6 py-16">
            <div className="flex justify-center items-center min-h-[400px]">
              <div
                className="relative transition-transform duration-300 ease-out"
                style={{
                  transform: `perspective(1000px) rotateX(${imageRotation}deg) translateY(-30px)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                <img
                  src="/dashboardimg2.webp"
                  alt="Clario Dashboard"
                  className="w-full max-w-6xl h-auto rounded-[25px]"
                  style={{
                    transition: 'transform 0.3s ease-out',
                    boxShadow: '0 40px 100px rgba(0, 0, 0, 0.3), 0 20px 50px rgba(0, 0, 0, 0.2), 0 10px 25px rgba(0, 0, 0, 0.15)',
                    filter: 'drop-shadow(0 50px 120px rgba(0, 0, 0, 0.2))',
                  }}
                />
              </div>
            </div>
          </div>
          {/* Gradient transition at bottom of image section */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent via-white/60 to-white pointer-events-none" />
        </div>

        <section className="relative isolate bg-white text-gray-900">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            aria-hidden="true"
            style={{
              backgroundImage:
                'radial-gradient(rgba(179,179,179,0.45) 1.2px, transparent 1.2px), radial-gradient(rgba(209,213,219,0.35) 1.2px, transparent 1.2px)',
              backgroundSize: '18px 18px',
              backgroundPosition: '0 0, 9px 9px'
            }}
          />
          <div className="container mx-auto px-6 py-24 md:py-28">
            <div className="relative grid gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="relative space-y-8">
                <div className="relative h-24 overflow-hidden text-4xl font-black text-gray-900 md:text-6xl">
                  <span
                    key={benefitIndex}
                    className="absolute inset-0 flex items-center animate-[wordDrift_3.2s_ease-in-out] text-[#b3b3b3]"
                  >
                    {benefitWords[benefitIndex]}
                  </span>
                </div>
                <p className="max-w-xl text-base text-gray-600 md:text-lg">
                  Consolidate the chaos: reclaim hidden revenue, protect margins, and spotlight every insight your resilience team needs to stay ahead of marketplace errors.
                </p>
              </div>
              <div className="relative w-full max-w-sm space-y-5 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700 justify-self-end">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Why Clario Works Better Than Anything Else</div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-gray-50">
                      <Check className="h-4 w-4" />
                    </span>
                    Reimbursements ready in hours, not days or weeks.
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-50">
                      <Check className="h-4 w-4" />
                    </span>
                    Your evidence automatically pulls from your email or cloud.
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-gray-50">
                      <Check className="h-4 w-4" />
                    </span>
                    Real-time alerts catch issues before you lose money.
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-gray-50">
                      <Check className="h-4 w-4" />
                    </span>
                    All your claims and payouts tracked in one trusted dashboard.
                  </li>
                </ul>
                <p className="text-sm text-gray-600">It does the works on your behalf.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="bg-white py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-start">
              <div className="space-y-4 md:w-1/3">
                <span className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Frequently asked questions</span>
                <h2 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
                  Everything you wanted to ask before Clario starts recovering funds.
                </h2>
                <p className="text-base text-gray-600 md:text-lg">
                  From compliance to costs, here&apos;s the clarity you need before letting our Evidence Engine audit your Amazon account.
                </p>
              </div>
              <div className="space-y-2 md:w-2/3">
                <Accordion type="single" collapsible className="space-y-2">
                  <AccordionItem value="safety" className="border-b border-gray-200 py-4">
                    <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:no-underline">
                      Is this safe? Will linking my account get me suspended by Amazon?
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 text-sm text-gray-600 space-y-3">
                      <p>
                        This is our most important question. Yes, it is 100% safe. We are an officially-verified Amazon developer using the secure Selling Partner API (SP-API).
                      </p>
                      <p>
                        We only perform actions that are fully compliant with Amazon&apos;s Terms of Service. Clario simply does the work of a manual audit, but 1,000x faster. Your account&apos;s safety is our #1 priority.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="data" className="border-b border-gray-200 py-4">
                    <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:no-underline">
                      What data do you access? Do you look at my customer info or sales?
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 text-sm text-gray-600 space-y-3">
                      <p>
                        We never look at your customer&apos;s personal information (PII). Our access is limited only to the data required for reimbursements: inventory reports, shipment details, and transaction history.
                      </p>
                      <p>
                        Our Evidence Engine can optionally scan your email or Google Drive, but only for invoice PDFs and proof-of-delivery documents. We don&apos;t care about your sales and we will never sell your data.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cost" className="border-b border-gray-200 py-4">
                    <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:no-underline">
                      How much does Clario cost?
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 text-sm text-gray-600 space-y-3">
                      <p>
                        It&apos;s simple: We take a 20% commission on successfully recovered funds. There are no monthly fees, no setup fees, and no hidden costs. If you don&apos;t get paid, we don&apos;t get paid.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="comparison" className="border-b border-gray-200 py-4">
                    <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:no-underline">
                      How is this different from GETIDA, Sellerise, or Helium 10?
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 text-sm text-gray-600 space-y-3">
                      <p>
                        Those tools are dashboards or agencies. They identify problems, but you or their auditors still have to gather evidence and build the case. Clario is an autonomous AI agent.
                      </p>
                      <p>
                        Our Evidence Engine finds the error, locates the matching invoice from your email, builds the case, and files it for you. It&apos;s zero effort, not just less effort.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="roi" className="border-b border-gray-200 py-4">
                    <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:no-underline">
                      How much money will I actually get back?
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 text-sm text-gray-600 space-y-3">
                      <p>
                        On average, FBA sellers lose 1–3% of annual revenue to “small” errors. For a seller doing $1M a year, that&apos;s $10,000 to $30,000 in lost profit.
                      </p>
                      <p>
                        We can&apos;t guarantee an exact amount, but our AI audits 18 months of data to find every dollar Amazon owes you.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="onboarding" className="border-b border-gray-200 py-4">
                    <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:no-underline">
                      What do I have to do to get started?
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 text-sm text-gray-600 space-y-3">
                      <p>It takes about two minutes:</p>
                      <ul className="list-disc space-y-2 pl-5 text-gray-600">
                        <li>Sign up for a Clario account.</li>
                        <li>Securely connect your Amazon Seller Central account via the SP-API.</li>
                        <li>(Optional) Grant read-only access to your email or Google Drive so our AI can gather invoices.</li>
                      </ul>
                      <p>That&apos;s it. Clario begins auditing immediately.</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="coexist" className="border-b border-gray-200 py-4">
                    <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:no-underline">
                      What if I already use another reimbursement service?
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 text-sm text-gray-600 space-y-3">
                      <p>
                        No problem. Run Clario alongside your current tool. We&apos;re confident our AI Evidence Engine will find dollars that manual audits missed. You only pay us for the new funds we recover.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cancel" className="border-b border-gray-200 py-4">
                    <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:no-underline">
                      What if I want to cancel?
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 text-sm text-gray-600 space-y-3">
                      <p>
                        You can cancel anytime. Disconnect Clario from Seller Central and you&apos;re done—no lock-in contracts. We&apos;ll only invoice the 20% commission on claims that were successfully paid out before you canceled.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </section>
          <section className="relative bg-white py-20">
          <div className="container mx-auto px-6">
              <div className="relative overflow-hidden rounded-[36px] border border-gray-100 bg-gradient-to-br from-white via-slate-50 to-gray-100 text-slate-900 shadow-[0_30px_80px_rgba(148,163,184,0.25)]">
                <div
                  className="pointer-events-none absolute inset-0 opacity-70"
                  aria-hidden="true"
                  style={{
                    backgroundImage:
                      'radial-gradient(rgba(148,163,184,0.35) 1px, transparent 1px), radial-gradient(rgba(226,232,240,0.45) 1px, transparent 1px)',
                    backgroundSize: '26px 26px',
                    backgroundPosition: '0 0, 13px 13px'
                  }}
                />
                <div className="relative z-10 flex flex-col gap-10 px-10 py-14 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-2xl space-y-5">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Try Clario
                    </span>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                      Run reimbursements with confident control.
                    </h2>
                    <p className="text-base text-slate-600 md:text-lg">
                      Switch on automated Amazon claims, surface evidence instantly, and keep your team ahead of every discrepancy.
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-600">
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 uppercase tracking-widest shadow-sm">
                        No credit card
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 uppercase tracking-widest shadow-sm">
                        Cancel anytime
                      </span>
                    </div>
                  </div>
                  <div className="flex w-full max-w-sm flex-col items-stretch gap-4 md:items-end">
                    <AmazonConnect showUseExisting={false} className="w-full md:w-auto bg-emerald-500 text-white hover:bg-emerald-400 hover:text-white shadow-[0_18px_45px_rgba(147,197,253,0.35)]" />
                    <span className="text-sm text-slate-500 md:text-right">
                      Connect your Amazon account in minutes and see recoveries in motion.
                    </span>
                  </div>
                </div>
              </div>
          </div>
        </section>
      </main>

        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white via-white/80 to-gray-100 pointer-events-none" aria-hidden="true" />
          <footer id="core-footer" className="relative bg-gray-100 text-gray-700">
            <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-gray-700 text-center md:text-left">
              <span>© Clario 2025 | {selectedLanguage.language}</span>
              <p className="text-xs text-gray-600">
                By connecting your account, you agree to Clario's
                <Link to="/terms" className="mx-1 underline hover:text-gray-900">Terms of Service</Link>
                and acknowledge our
                <Link to="/security" className="mx-1 underline hover:text-gray-900">Data Security</Link>
                &
                <Link to="/privacy" className="mx-1 underline hover:text-gray-900">Privacy Policy</Link>.
              </p>
            </div>
          </footer>
        </div>
    </div>
  );
};

export default Index;
