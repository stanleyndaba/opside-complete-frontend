import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';

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

const Privacy = () => {
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('clario.langPreference') || 'en' : 'en'
  );
  const [langQuery, setLangQuery] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('clario.langPreference', selectedLanguageCode);
    } catch {}
  }, [selectedLanguageCode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleLogin = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const res = await api.connectAmazon();
      const url = res.data?.auth_url;
      if (res.ok && url) {
        window.location.assign(url as string);
      } else {
        window.location.assign('/auth/amazon-sandbox');
      }
    } catch {
      window.location.assign('/auth/amazon-sandbox');
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(16,185,129,0.08),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.06),transparent_45%)]" />
        <header className="sticky top-0 z-40 border-transparent bg-transparent">
          <div className="container mx-auto px-6 py-5">
            <div className="flex items-center justify-between gap-6 px-6 py-4 rounded-[25px] border border-white/40 bg-white/30 supports-[backdrop-filter]:bg-white/30 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_25px_60px_rgba(15,23,42,0.1)] transition-colors">
              <Link to="/" className="flex items-center gap-3 text-gray-800 hover:text-gray-950 transition-colors">
                <img src="/donelogo.png" alt="Clario" className="h-9 w-9 rounded-full object-cover border border-black/10" />
                <span className="sr-only">Clario home</span>
              </Link>
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

        <main className="relative container mx-auto px-6 py-12 md:py-20">
          <article className="bg-white/90 border border-black/5 rounded-3xl shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="px-6 py-10 md:px-12 md:py-14 space-y-10 text-gray-700">
              <section className="space-y-3">
                <p className="uppercase text-xs tracking-[0.3em] text-emerald-600">Privacy</p>
                <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">Clario Privacy Policy</h1>
                <p><strong>Last Updated:</strong> November 18, 2025</p>
                <p>
                  This Privacy Policy describes our policies on the collection, use, and disclosure of data when you use the Service and explains
                  how we comply with the Amazon Data Protection Policy (the “DPP”). By using the Service, you agree to the collection and use
                  of information in accordance with this Privacy Policy.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">1. Interpretation and Definitions</h2>
                <p>For the purposes of this Privacy Policy:</p>
                <ul className="space-y-3 list-disc pl-6 text-gray-700">
                  <li><strong>Company</strong> (“We”, “Us”, or “Our”) refers to Clario, Inc., a Delaware corporation.</li>
                  <li><strong>Service</strong> refers to the Clario AI application.</li>
                  <li><strong>Personal Data</strong> means any information that relates to an identified or identifiable individual (e.g., your name or email address).</li>
                  <li><strong>Amazon Information</strong> means all data accessed via the Amazon Selling Partner API (SP-API), including Restricted Data and Personally Identifiable Information (PII).</li>
                  <li><strong>DPP</strong> means the Amazon Data Protection Policy.</li>
                  <li><strong>Website</strong> refers to Clario AI, accessible from <a href="https://clario.app" className="underline text-emerald-600 hover:text-emerald-700">https://clario.app</a>.</li>
                  <li><strong>You</strong> means the individual or legal entity accessing or using the Service.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">2. Collecting and Using Your Data</h2>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">Types of Data Collected</h3>
                  <h4 className="text-lg font-medium text-gray-900">A. Personal Data</h4>
                  <p>When you use our Service, we collect limited account information necessary to operate your workspace:</p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Email address</li>
                    <li>First and last name</li>
                    <li>Payment information (processed securely via Stripe)</li>
                  </ul>
                  <h4 className="text-lg font-medium text-gray-900">B. Amazon Information (Restricted Data)</h4>
                  <p>
                    To perform automated reimbursement analysis, we must access SP-API data. This data is handled in strict compliance with the DPP.
                    We only ingest what is necessary to audit reimbursements, including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Inventory adjustment and reconciliation reports</li>
                    <li>Shipment and inbound discrepancy reports</li>
                    <li>FBA customer return reports</li>
                    <li>Financial and settlement reports</li>
                    <li>PII (e.g., order IDs) strictly limited to matching a claim to a reimbursement case</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">3. Use of Your Data (The Purpose)</h2>
                <p>
                  We use Personal Data and Amazon Information for a single purpose: to provide and improve the Clario reimbursement Service.
                  Specifically, we use data to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Manage and authenticate your Account.</li>
                  <li>Algorithmically identify (Agent 1) and file (Agent 7) reimbursement claims.</li>
                  <li>Reconcile payments (Agent 8) and calculate billing (Agent 9).</li>
                </ul>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">Strict Prohibition on PII Use</p>
                  <p>
                    As required by the Amazon DPP, we will never use Amazon Information—especially PII—for any purpose outside of delivering the Service.
                    We do not:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Sell, rent, or monetize Amazon Information.</li>
                    <li>Use Amazon Information for marketing, remarketing, or advertising.</li>
                    <li>Share Amazon Information with third parties that are not required to operate the core Service (e.g., our secure AWS infrastructure).</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">4. Data Protection &amp; Security (Amazon DPP Compliance)</h2>
                <p>We implement enterprise-grade technical, physical, and administrative safeguards:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-3">
                  <li><strong>Encryption at Rest</strong>: All Amazon Information stored in our databases is encrypted using AES-256.</li>
                  <li><strong>Encryption in Transit</strong>: All data traverses HTTPS endpoints secured with TLS 1.2 or higher.</li>
                  <li><strong>Access Control</strong>: We enforce least-privilege access. Only authorized engineers with MFA-protected sessions may access production systems, and every action is logged.</li>
                  <li><strong>Network Security</strong>: Infrastructure is hosted in Amazon Web Services (AWS) within a locked-down Virtual Private Cloud (VPC) protected by strict firewall policies.</li>
                  <li><strong>Incident Response</strong>: We maintain a formal Incident Response Plan and will notify Amazon at <a href="mailto:3p-security@amazon.com" className="underline text-emerald-600 hover:text-emerald-700">3p-security@amazon.com</a> within 24 hours of any confirmed incident involving Amazon Information, as mandated by the DPP.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">5. Data Retention &amp; Deletion</h2>
                <p>
                  We retain Personal Data only for as long as needed to operate your account. Consistent with the DPP, we permanently delete all Amazon Information
                  within 30 days of account termination or termination of our agreement. You may request deletion at any time by contacting us, and we will comply
                  unless retention is required by law.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">6. Links to Other Websites</h2>
                <p>
                  The Service may reference other websites. We do not control and are not responsible for the content, privacy practices, or security of those third-party sites.
                  We encourage you to review their policies.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">7. Changes to this Privacy Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will post any changes on this page and update the “Last Updated” date. Continued use of the Service after
                  changes become effective constitutes acceptance of the revised policy.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">8. Contact Us</h2>
                <p>If you have questions about this Privacy Policy or our compliance with the Amazon DPP, contact us at:</p>
                <p><strong>Email:</strong> <a href="mailto:legal@clario.app" className="underline text-emerald-600 hover:text-emerald-700">legal@clario.app</a></p>
              </section>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
};

export default Privacy;

