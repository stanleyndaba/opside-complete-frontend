import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';

type LanguageOption = {
  code: string;
  language: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'us-en', language: 'English (US)' },
  { code: 'ca-fr', language: 'Français (Canada)' },
  { code: 'es-es', language: 'Español' },
  { code: 'de-de', language: 'Deutsch' },
  { code: 'fr-fr', language: 'Français' },
  { code: 'it-it', language: 'Italiano' },
];

const Docs = () => {
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('clario.langPreference') || 'us-en' : 'us-en'
  );
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

  const selectedLanguage = LANGUAGE_OPTIONS.find(o => o.code === selectedLanguageCode) || LANGUAGE_OPTIONS[0];

  const handleLogin = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const res = await api.connectAmazon();
      const url = res.data?.auth_url || res.data?.redirect_url;
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_-5%,rgba(16,185,129,0.08),transparent_40%),radial-gradient(circle_at_85%_-10%,rgba(59,130,246,0.06),transparent_45%)]" />
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
                  <DropdownMenuContent align="end" className="min-w-[220px] bg-white border border-black/10 text-gray-900 shadow-xl">
                    {LANGUAGE_OPTIONS.map(opt => (
                      <DropdownMenuItem
                        key={opt.code}
                        onClick={() => setSelectedLanguageCode(opt.code)}
                        className="gap-2 hover:bg-gray-100 focus:bg-gray-100"
                      >
                        <span className="font-medium">{opt.language}</span>
                      </DropdownMenuItem>
                    ))}
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
                    <DropdownMenuContent align="start" className="min-w-[220px] bg-white border border-black/10 text-gray-900 shadow-xl">
                      {LANGUAGE_OPTIONS.map(opt => (
                        <DropdownMenuItem
                          key={opt.code}
                          onClick={() => {
                            setSelectedLanguageCode(opt.code);
                            setMobileMenuOpen(false);
                          }}
                          className="gap-2 hover:bg-gray-100 focus:bg-gray-100"
                        >
                          <span className="font-medium">{opt.language}</span>
                        </DropdownMenuItem>
                      ))}
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
          <div className="text-sm text-gray-500 space-y-1 mb-12">
            <p><strong>Effective Date:</strong> [Insert Date]</p>
            <p><strong>Last Updated:</strong> [Insert Date]</p>
          </div>

          <article className="bg-white/90 border border-black/5 rounded-3xl shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="px-6 py-10 md:px-12 md:py-14 space-y-10 text-gray-700">
              <header className="space-y-4">
                <div className="space-y-2">
                  <p className="uppercase text-xs tracking-[0.3em] text-emerald-600">Docs</p>
                  <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">Acceptable Use Policy (AUP)</h1>
                </div>
                <p className="text-sm text-gray-500 font-medium">Part of Clario Terms of Service</p>
              </header>

              <section className="space-y-4">
                <p>
                  This <strong>Acceptable Use Policy</strong> ("AUP") is incorporated into and forms a binding part of the
                  {' '}<strong>Clario Terms of Service</strong> ("TOS"). It defines the <strong>only permitted use</strong> of Clario and establishes
                  {' '}<strong>zero-tolerance enforcement</strong> for any behavior that could harm Amazon, its systems, or the integrity of the Seller Central ecosystem.
                </p>
                <p>
                  Violation of this AUP constitutes a <strong>material breach</strong> of the TOS and will result in <strong>immediate termination</strong> of access.
                </p>
              </section>

              <hr className="border-gray-200" />

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">1. The Single Permitted Use (The Scope)</h2>
                <p><strong>Clario may be used exclusively for:</strong></p>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  The automated financial reconciliation and submission of legitimate FBA reimbursement claims related to the User's own, approved Amazon Selling Partner accounts.
                </blockquote>
                <p className="font-medium text-gray-700">This limited, non-transferable right includes only:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Analysis of SP-API data from the User’s own Seller Central account</li>
                  <li>Matching with evidence (invoices, BOLs) from User-authorized external sources</li>
                  <li>Submission of claims via Amazon’s official channels</li>
                </ul>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-gray-700 space-y-2">
                  <p className="font-semibold text-rose-600 uppercase tracking-[0.2em] text-xs">Prohibited</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Using Clario for <strong>third-party accounts</strong>, <strong>agency services</strong>, or account management on behalf of others</li>
                    <li>Reselling, redistributing, or repurposing Clario data or functionality</li>
                    <li>Any use outside the User’s own internal FBA operations</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">2. Prohibited Conduct (The Absolute Red Flags)</h2>
                <p className="text-gray-600">You are strictly prohibited from using Clario to:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-700">
                    <thead className="uppercase text-xs tracking-wider text-gray-500">
                      <tr>
                        <th className="py-3 pr-6">Violation</th>
                        <th className="py-3">Consequence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-3 pr-6 font-medium">File fraudulent, false, fabricated, exaggerated, or unsupported claims (e.g., claims lacking valid invoices, BOLs, or shipment records)</td>
                        <td className="py-3 text-rose-600 font-semibold">Immediate termination + reporting to Amazon</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-6 font-medium">Interfere with, reverse engineer, or exploit Clario, SP-API, or Amazon systems</td>
                        <td className="py-3 text-rose-600 font-semibold">Immediate termination</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-6 font-medium">Submit excessive or automated claims that could constitute abuse or a Denial of Service (DoS) attack on Amazon’s systems</td>
                        <td className="py-3 text-rose-600 font-semibold">Immediate termination</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-6 font-medium">Use any PII obtained via Clario for marketing, solicitation, profiling, or any non-reimbursement purpose</td>
                        <td className="py-3 text-rose-600 font-semibold">Immediate termination</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-6 font-medium">Violate any Amazon Selling Partner Agreement, Policy, or Data Protection Policy</td>
                        <td className="py-3 text-rose-600 font-semibold">Immediate termination + full cooperation with Amazon</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  The User assumes 100% liability for the accuracy, legitimacy, and compliance of every claim submitted through Clario.
                </blockquote>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">3. Monitoring and Enforcement (The Alliance)</h2>
                <p className="text-gray-600">Clario actively protects the Amazon ecosystem.</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>We <strong>reserve the right to monitor</strong> account activity, claim volume, success rates, and data patterns for signs of abuse, fraud, or policy violation.</li>
                  <li>We use <strong>automated and manual review</strong> to detect suspicious behavior (e.g., high claim-to-inventory ratios, duplicate submissions, missing evidence).</li>
                </ul>
                <div className="space-y-3">
                  <p className="font-semibold text-gray-900">Immediate Action:</p>
                  <p className="text-gray-600">Upon detection of an AUP violation, Clario will:</p>
                  <ol className="list-decimal pl-6 space-y-2 text-gray-600">
                    <li><strong>Suspend service without notice</strong></li>
                    <li><strong>Terminate the account permanently</strong></li>
                    <li><strong>Retain logs and evidence</strong> for Amazon review</li>
                    <li><strong>Report the User to Amazon, Inc.</strong> where required or appropriate</li>
                  </ol>
                  <p className="text-rose-600 font-semibold uppercase text-xs tracking-[0.2em]">No refunds. No appeals.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">4. Indemnification</h2>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  You agree to indemnify, defend, and hold harmless Clario, its officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys’ fees) arising from:
                </blockquote>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Your breach of this AUP</li>
                  <li>Your submission of fraudulent or non-compliant claims</li>
                  <li>Any investigation, penalty, or action by Amazon resulting from your use of Clario</li>
                </ul>
                <p className="text-sm text-gray-500 italic">This obligation survives termination of your account.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">Contact for AUP Violations</h2>
                <p className="text-gray-600">
                  <strong>Report suspected abuse:</strong>{' '}
                  <a href="mailto:abuse@clario.app" className="underline text-emerald-600 hover:text-emerald-700">abuse@clario.app</a>
                </p>
                <p className="text-sm text-gray-500 italic">Internal escalation only — not for user support.</p>
              </section>

              <p className="text-sm text-gray-500 italic">
                Clario is a partner in integrity. We police our platform so Amazon doesn’t have to.
              </p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default Docs;
