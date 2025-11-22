import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import { ChevronDown, Check, Gift, Globe, Linkedin, Twitter } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AmazonConnect } from '@/components/AmazonConnect';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const SOCIAL_LINKS: { label: string; href: string; icon: IconComponent }[] = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/clario-ai', icon: Linkedin },
  { label: 'Twitter', href: 'https://x.com/ClarioAI', icon: Twitter },
];

const AGENT_HIGHLIGHTS = [
  {
    title: 'Discovery (Agent 3)',
    description: 'Audits ledgers in milliseconds to find hidden claims humans miss.',
    accentClass: 'bg-gray-900',
  },
  {
    title: 'Auto-Evidence (Agent 5)',
    description: 'Securely hunts your email & drive for invoices. Zero manual uploads.',
    accentClass: 'bg-gray-800',
  },
  {
    title: '24/7 Recoveries (Agent 8)',
    description: 'Monitors every claim around the clock. If Amazon stalls, we flag it.',
    accentClass: 'bg-gray-700',
  },
  {
    title: 'Finance (Agent 9)',
    description: 'Confirms the actual deposit hit your bank before we count it.',
    accentClass: 'bg-gray-600',
  },
];

const Index = () => {
  const [showMoreFAQs, setShowMoreFAQs] = useState(false);

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
  const [agentHighlightIndex, setAgentHighlightIndex] = useState(0);
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

  const currentYear = new Date().getFullYear();

  return (
    <div 
      className="min-h-screen flex flex-col text-gray-900 relative overflow-x-hidden w-full"
      style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}
    >
      {/* Background image covering navbar and hero section */}
      <div 
        className="absolute inset-x-0 top-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/horizon.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          height: '100vh',
          minHeight: '100vh',
          width: '100%',
          filter: 'brightness(0.6)'
        }}
      />
      {/* Dark overlay for better text visibility */}
      <div 
        className="absolute inset-x-0 top-0 z-0 pointer-events-none"
        style={{
          height: '100vh',
          minHeight: '100vh',
          width: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.2)'
        }}
      />
      {/* Fixed navbar - stays at top while content scrolls underneath */}
      <header className="fixed top-0 left-0 right-0 z-40 border-transparent bg-transparent" style={{ background: 'transparent' }}>
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-6 px-6 py-4 rounded-[25px] border border-white/40 bg-white/25 supports-[backdrop-filter]:bg-white/25 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_25px_60px_rgba(15,23,42,0.12)] transition-colors">
              <div className="flex items-center gap-3">
              <Link to="/" className="inline-flex items-center px-3 py-1.5 rounded-[16px] transition-colors hover:bg-gray-100">
                      <span
                        className="font-black tracking-tight bg-gradient-to-r from-[#1f4037] to-[#99f2c8] bg-clip-text text-transparent"
                      >
                        CLARIO
                      </span>
                      </Link>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full p-2 text-emerald-600 transition-colors hover:text-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      aria-label="No commission on referrals"
                    >
                      <Gift className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">No commission on referrals</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="start" className="w-80 p-0 border-0 shadow-xl">
                    <div className="bg-emerald-50 rounded-lg p-5 space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-emerald-900 text-base">No commission on referrals</h3>
                        <p className="text-sm text-emerald-800">
                          Sellers who bring new sellers to Clario keep 100% value of their recovered funds
                        </p>
                      </div>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                        Invite Friend +
                      </Button>
              </div>
                  </PopoverContent>
                </Popover>
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
            <div className="mt-4 md:hidden relative z-50">
              <div className="flex flex-col gap-2 rounded-[20px] border border-white/40 bg-white/80 supports-[backdrop-filter]:bg-white/70 backdrop-blur-2xl p-4 shadow-2xl">
                  <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4" aria-hidden="true" />
                      <span>No commission on referrals</span>
                    </div>
                    <p className="mt-1 text-xs font-normal text-emerald-700/80">
                      Sellers who bring new sellers to Clario keep 100% value of their recovered funds
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
      <div className="relative z-10" style={{ background: 'transparent' }}>
        <main className="flex-1 relative z-10" style={{ background: 'transparent' }}>
          <section 
            className="relative container mx-auto px-6 pt-32 md:pt-36 pb-12 md:pb-16 overflow-hidden"
            style={{ background: 'transparent' }}
          >
          {/* Content */}
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
            {/* Trust chip removed per request */}
              <div className="relative inline-flex items-center gap-2 md:gap-4 rounded-[20px] md:rounded-[25px] border border-emerald-100 bg-white/85 px-3 py-1.5 md:px-5 md:py-2 shadow-[0_12px_45px_rgba(16,185,129,0.25)] backdrop-blur supports-[backdrop-filter]:bg-white/70 mx-auto overflow-hidden">
                <span className="pointer-events-none absolute inset-0 rounded-[20px] md:rounded-[25px] bg-gradient-to-r from-emerald-200/40 via-white/10 to-sky-200/40 blur-xl" aria-hidden="true" />
                <span className="pointer-events-none absolute inset-0 rounded-[20px] md:rounded-[25px] border border-white/40" aria-hidden="true" />
                <span className="relative flex items-center gap-1 md:gap-2">
                  <span className="relative h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-800">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                  </span>
                </span>
                  <div className="relative flex items-center gap-1.5 md:gap-3 text-xs md:text-sm font-medium text-gray-700">
                    <span>Links seamlessly with</span>
                    <span className="inline-flex items-center gap-1.5 md:gap-3">
                      <span className="relative inline-flex h-5 w-5 md:h-7 md:w-7 items-center justify-center rounded-full bg-transparent">
                        <img
                          src="/gmailicon.png"
                          alt="Gmail"
                          className="h-5 w-5 md:h-7 md:w-7 object-contain"
                        />
                      </span>
                      <span className="relative inline-flex h-5 w-5 md:h-7 md:w-7 items-center justify-center rounded-full bg-transparent">
                        <img
                          src="/outlookicon.webp"
                          alt="Outlook"
                          className="h-5 w-5 md:h-7 md:w-7 object-contain"
                        />
                      </span>
                      <span className="text-emerald-500 font-bold text-sm md:text-lg">+</span>
                      <span className="relative inline-flex h-5 w-5 md:h-7 md:w-7 items-center justify-center rounded-full bg-transparent">
                        <img
                          src="/gd.png"
                          alt="Google Drive"
                          className="h-5 w-5 md:h-7 md:w-7 object-contain"
                        />
                      </span>
                    </span>
                </div>
              </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
              FBA Reimbursements on Autopilot
            </h1>
              <p className="font-body text-sm md:text-base text-white font-normal max-w-3xl mx-auto">
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
                  <span className="text-white text-sm md:text-base">No credit cards</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  <span className="text-white text-sm md:text-base">Cancel anytime</span>
                </div>
              </div>
              {/* Email capture moved to bottom-left above the legal footer */}
            </div>
          </div>
        </section>
        </main>
      </div>
      {/* End of background image area - white content starts here - no gap */}
      <div className="relative z-10 w-full" style={{ background: 'white', marginTop: '3rem' }}>
        <section className="relative isolate bg-white text-gray-900 w-full" style={{ width: '100%', maxWidth: '100%' }}>
          <div className="container mx-auto px-6 pt-12 md:pt-20 pb-24 md:pb-28">
            <div className="relative grid gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="relative space-y-8">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight" style={{ color: '#a6a6a6' }}>
                  Recover lost revenue on complete <span className="bg-gradient-to-r from-[#1f4037] to-[#99f2c8] bg-clip-text text-transparent">autopilot.</span>
                </h2>
                <p className="text-base md:text-lg text-black max-w-3xl leading-relaxed">
                  Bypass the manual grind. From deep-dive audits to final deposit, our 11-agent engine autonomously identifies, files, and tracks every claim with <span className="font-semibold text-emerald-500">{precisionCount.toFixed(2)}%</span> precision.
                </p>
              </div>
              <div className="relative w-full max-w-sm space-y-5 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700 justify-self-end overflow-hidden">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Why 11 Clario Agents Beat 1 Human</div>
                <div className="relative h-44 overflow-hidden">
                  {AGENT_HIGHLIGHTS.map((item, index) => (
                    <div
                      key={item.title}
                      className={`absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center transition-all duration-500 ${
                        agentHighlightIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                      }`}
                      aria-hidden={agentHighlightIndex !== index}
                    >
                      <div>
                        <p className="text-base font-semibold" style={{ color: '#99f2c8' }}>{item.title}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600">Clario is your Autonomous AI Agent, not your boss. You maintain 100% command over your data, account and recovery processes!</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-24 w-full overflow-x-hidden" style={{ width: '100%', maxWidth: '100%' }}>
          <div className="container mx-auto px-6 w-full" style={{ width: '100%', maxWidth: '100%' }}>
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
                </Accordion>
                {!showMoreFAQs && (
                  <button
                    onClick={() => setShowMoreFAQs(true)}
                    className="text-base cursor-pointer mt-4 bg-transparent border-0 p-0 hover:no-underline"
                    style={{ color: '#303030', textDecoration: 'none' }}
                  >
                    more questions and answers
                  </button>
                )}
                {showMoreFAQs && (
                  <Accordion type="single" collapsible className="space-y-2 mt-2">
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
                )}
              </div>
            </div>
          </div>
        </section>
          <section className="relative bg-white py-20 w-full overflow-x-hidden" style={{ width: '100%', maxWidth: '100%' }}>
          <div className="container mx-auto px-6 w-full" style={{ width: '100%', maxWidth: '100%' }}>
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
                      <span className="relative flex items-center gap-2">
                        <span className="relative h-2 w-2 rounded-full bg-emerald-800">
                          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                        </span>
                      </span>
                      Try Clario
                    </span>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                      Run reimbursements with confident control.
                    </h2>
                    <p className="text-base text-slate-600 md:text-lg">
                      Switch on automated Amazon claims, surface evidence instantly, and keep your team ahead of every discrepancy.
                    </p>
                    <p className="text-base text-navy-900 italic" style={{ color: '#001f3f' }}>
                      Clario will never request your credit card
                    </p>
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
      </div>
      <div className="relative z-10">
        {/* CLARIO Brand Section */}
        <section className="relative bg-white py-24 md:py-32 w-full overflow-x-hidden" style={{ width: '100%', maxWidth: '100%' }}>
          <div className="container mx-auto px-6 w-full" style={{ width: '100%', maxWidth: '100%' }}>
            <div className="flex flex-col items-center justify-center text-center space-y-8">
              <h1 
                className="text-8xl md:text-9xl lg:text-[12rem] font-black tracking-tight bg-gradient-to-r from-[#1f4037] to-[#99f2c8] bg-clip-text text-transparent drop-shadow-[0_6px_12px_rgba(0,0,0,0.2)]"
                style={{ letterSpacing: '-0.02em' }}
              >
                CLARIO
              </h1>
              <Button 
                size="lg" 
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                asChild
              >
                <Link to="/integrations-hub">
                  Try Now
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="relative">
          <footer
            id="core-footer"
            className="relative bg-white text-gray-900 w-full"
            style={{ width: '100%', maxWidth: '100%' }}
          >
            <div className="container mx-auto px-6 py-14 space-y-8">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
                  Autonomous reimbursements crafted for modern Amazon operators. Secure data flows, transparent claims,
                  and a finance-ready audit trail—no agency overhead.
                </p>
                <div className="flex items-center gap-3">
                  {SOCIAL_LINKS.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={social.label}
                        className="inline-flex h-10 w-10 items-center justify-center text-gray-500 transition hover:text-gray-900"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-4 border-t border-gray-200 pt-6 text-xs text-gray-500 md:flex-row md:items-center md:justify-between">
                <div className="order-1 flex flex-wrap items-center gap-4 text-gray-600 md:order-2">
                  <Link to="/privacy" className="transition hover:text-gray-900">
                    Privacy Policy
                  </Link>
                  <Link to="/terms" className="transition hover:text-gray-900">
                    Terms of Service
                  </Link>
                  <Link to="/docs" className="transition hover:text-gray-900">
                    Acceptable Use Policy
                  </Link>
                  <span className="inline-flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" />
                    {selectedLanguage.language}
                  </span>
                </div>
                <p className="order-2 text-gray-600 md:order-1">
                  © {currentYear} Clario. Built for operators who need Amazon reimbursements and visibility in real time.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Index;
