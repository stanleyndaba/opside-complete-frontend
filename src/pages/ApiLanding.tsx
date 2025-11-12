import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Link2, ScrollText } from 'lucide-react';
import { api } from '@/lib/api';

const ApiLanding = () => {
  // Language preference (match platform + landing behavior)
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
  useEffect(() => {
    try { localStorage.setItem('clario.langPreference', selectedLanguageCode); } catch {}
  }, [selectedLanguageCode]);
  const selectedLanguage: LanguageOption =
    LANGUAGE_OPTIONS.find((o) => o.code === selectedLanguageCode) || LANGUAGE_OPTIONS[0];

  const filteredLanguages = useMemo(() => {
    const q = langQuery.trim().toLowerCase();
    if (!q) return LANGUAGE_OPTIONS;
    return LANGUAGE_OPTIONS.filter(o =>
      o.language.toLowerCase().includes(q) ||
      o.country.toLowerCase().includes(q)
    );
  }, [langQuery]);

  const [connecting, setConnecting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const res = await api.connectAmazon();
      const url = res.data?.auth_url;
      if (res.ok && url) window.location.assign(url as string);
      else window.location.assign('/auth/amazon-sandbox');
    } catch {
      window.location.assign('/auth/amazon-sandbox');
    }
  };

  return (
    <div className="relative min-h-screen bg-white text-gray-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(16,185,129,0.08),transparent_40%),radial-gradient(circle_at_80%_-10%,rgba(59,130,246,0.06),transparent_45%)]" />
      <header className="sticky top-0 z-40 border-transparent bg-transparent">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-6 px-6 py-4 rounded-[25px] border border-white/40 bg-white/30 supports-[backdrop-filter]:bg-white/30 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_25px_60px_rgba(15,23,42,0.1)] transition-colors">
            <div className="flex items-center gap-3">
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
            </div>
            <nav className="hidden md:flex items-center gap-3 text-sm text-gray-700">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex items-center gap-2 h-9 px-3 rounded-md text-sm text-gray-700 hover:bg-white/60 transition-colors"
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

              <Button
                variant="ghost"
                className="text-gray-800 hover:bg-gray-100 hover:text-gray-900"
                type="button"
                disabled={connecting}
                onClick={handleLogin}
              >
                Login
              </Button>
            </nav>
            <button
              type="button"
              className="md:hidden flex flex-col items-end gap-1.5 rounded-[16px] border border-white/40 bg-white/50 px-3 py-2 transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(prev => !prev)}
            >
              <span className="block h-[1px] w-6 bg-gray-900 rounded-full" />
              <span className="block h-[1px] w-5 bg-gray-900 rounded-full" />
              <span className="block h-[1px] w-4 bg-gray-900 rounded-full" />
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="mt-4 md:hidden">
              <div className="flex flex-col gap-3 rounded-[20px] border border-white/40 bg-white/80 supports-[backdrop-filter]:bg-white/70 backdrop-blur-2xl p-4 shadow-2xl text-sm text-gray-700">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-full rounded-lg px-3 py-2 text-left font-medium text-gray-800 hover:bg-white/70 transition-colors"
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

                <Button
                  variant="ghost"
                  className="w-full justify-center text-gray-800 hover:bg-gray-100 hover:text-gray-900"
                  type="button"
                  disabled={connecting}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogin();
                  }}
                >
                  Login
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main>
        <div className="relative w-full min-h-screen">

          <div className="relative mx-auto max-w-3xl px-6 pt-20 md:pt-28 pb-24 text-gray-600">
            <header>
              <h1 className="font-heading text-4xl md:text-5xl leading-tight text-gray-900 font-black">
                The Clario API: The Financial Engine for Modern Commerce
              </h1>
              <p className="mt-5 text-lg md:text-xl text-gray-600 font-body">
                At Clario, we are building more than a dashboard. We are building the intelligent financial recovery layer for e-commerce. Our future-facing API will allow developers, agencies, and enterprise brands to programmatically access the full power of our platform, integrating automated reimbursement data and workflows directly into their own systems.
              </p>
            </header>

            <section className="mt-10">
              <div className="rounded-2xl border border-gray-200 bg-[#111827] shadow-[0_25px_60px_rgba(15,23,42,0.18)]">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                  <span className="ml-3 text-xs uppercase tracking-wider text-gray-300">example.py</span>
                </div>
                <pre className="p-6 overflow-x-auto text-sm md:text-base leading-relaxed font-mono text-gray-200"><code>
                  <span className="text-gray-400"># Get the latest recovered claims</span>
                  <br />
                  <span className="text-emerald-400">from</span> clario <span className="text-emerald-400">import</span> <span className="text-sky-300">Clario</span>
                  <br />
                  <br />
                  clario <span className="text-emerald-400">=</span> <span className="text-sky-300">Clario</span>(api_key=<span className="text-amber-300">"YOUR_API_KEY"</span>)
                  <br />
                  <br />
                  recovered_claims <span className="text-emerald-400">=</span> clario.claims.list(
                  <br />
                  &nbsp;&nbsp;status=<span className="text-amber-300">"recovered"</span>,
                  <br />
                  &nbsp;&nbsp;limit=<span className="text-rose-300">10</span>
                  <br />
                  )
                  <br />
                  <br />
                  <span className="text-emerald-400">for</span> claim <span className="text-emerald-400">in</span> recovered_claims:
                  <br />
                  &nbsp;&nbsp;print(f<span className="text-amber-300">{"\"Recovered {claim.amount} for claim ID: {claim.id}\""}</span>)
                </code></pre>
              </div>
            </section>

            <section className="mt-12 space-y-10">
              <div>
                <h2 className="font-body text-xl md:text-2xl font-semibold text-gray-900">What You Will Be Able to Do</h2>
                <ul className="mt-4 space-y-3 text-gray-600">
                  <li><span className="text-gray-400">Sync Recovery Data:</span> Pull all detected claims, their statuses, and their financial value directly into your own internal dashboards, data warehouses, or ERP systems.</li>
                  <li><span className="text-gray-400">Build Custom Reporting:</span> Create bespoke financial reports and analytics for your team or your clients, leveraging real-time data from the Clario engine.</li>
                  <li><span className="text-gray-400">Automate Workflows:</span> Programmatically approve claims, trigger scans, and manage your recovery pipeline without ever needing to log into the Clario UI.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-body text-xl md:text-2xl font-semibold text-gray-900">How It Will Work</h2>
                <ul className="mt-4 space-y-3 text-gray-600">
                  <li><span className="text-gray-400">Modern REST Architecture:</span> A clean, predictable, and well-documented REST API that is easy to integrate with.</li>
                  <li><span className="text-gray-400">Real-Time Webhooks:</span> Receive real-time push notifications to your own services for key events like <code className="font-mono">claim.detected</code>, <code className="font-mono">claim.submitted</code>, and <code className="font-mono">funds.recovered</code>.</li>
                  <li><span className="text-gray-400">Secure and Scalable:</span> Built with the same enterprise-grade security and reliability as our core platform, ensuring your data is always safe and accessible.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-body text-xl md:text-2xl font-semibold text-gray-900">Get Notified</h2>
                <p className="mt-4 text-gray-600">Our developer API is currently in a private beta with select partners. If you are an enterprise brand, an agency, or a developer interested in building on the Clario platform, please contact us to be added to the early access list.</p>
                <div className="mt-6">
                  <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    <a href="mailto:hello@getclario.com?subject=Clario%20API%20Early%20Access">Request Early Access</a>
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApiLanding;
