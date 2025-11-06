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
            <div className="text-sm text-gray-500 space-y-1 mb-12">
              <p><strong>Effective Date:</strong> January 1, 2025</p>
              <p className="text-xs text-gray-400">The day Clario's full-time operations and IP creation officially began.</p>
              <p><strong>Last Updated:</strong> November 6, 2025</p>
              <p className="text-xs text-gray-400">The day Clario legally executed and finalized this document.</p>
            </div>

          <article className="bg-white/90 border border-black/5 rounded-3xl shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="px-6 py-10 md:px-12 md:py-14 space-y-10 text-gray-700">
              <section className="space-y-4">
                <header className="space-y-3">
                  <p className="uppercase text-xs tracking-[0.3em] text-emerald-600">Privacy</p>
                  <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">Clario Data Privacy Policy</h1>
                  <p className="text-sm text-gray-500"><strong>Last Updated:</strong> November 6, 2025</p>
                </header>
                <p className="leading-relaxed">
                  Clario is committed to protecting the privacy and security of your data. This Data Privacy Policy ("Policy") explains how Clario ("we," "us," or "our") collects, uses, stores, and protects data obtained through the Amazon Selling Partner API ("SP-API") and user-linked external sources (e.g., email or cloud accounts). This Policy applies exclusively to data processed in connection with Clario's automated FBA reimbursement and financial reconciliation service ("Service").
                </p>
              </section>

              <hr className="border-gray-200" />

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">1. Data Collected (The "What")</h2>
                <p className="text-gray-600 leading-relaxed">Clario collects only the minimum data necessary to provide the Service. We do not collect irrelevant or excessive data.</p>

                <h3 className="text-xl font-medium text-gray-900">Amazon Data via SP-API</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li><strong>No End-Customer PII</strong>: Clario's AI Agents do not require or collect any end-customer PII (such as names, addresses, or phone numbers). Our service exclusively accesses non-PII operational, financial, and inventory reports to perform its function.</li>
                  <li>
                    <strong>Non-PII Operational Data</strong> includes:
                    <ul className="list-disc pl-6 space-y-2 text-gray-600">
                      <li>Financial reports (e.g., GET_FBA_REIMBURSEMENTS, GET_LEDGER_DETAIL_VIEW_DATA)</li>
                      <li>Inventory adjustments (e.g., GET_FBA_INVENTORY_ADJUSTMENTS)</li>
                      <li>FBA shipment tracking (e.g., GET_FBA_SHIPMENTS)</li>
                      <li>Fee and transaction statements (e.g., GET_AMAZON_FULFILLED_SHIPMENTS)</li>
                    </ul>
                  </li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">External Evidence Data</h3>
                <p className="text-gray-600 leading-relaxed">
                  Invoice and Bill of Lading (BOL) documents extracted from user-authorized email or cloud accounts (e.g., Gmail, Google Drive, Outlook).
                </p>
                <p className="text-gray-600 leading-relaxed">Data points include: supplier names, product SKUs, quantities, shipment dates, tracking numbers, and cost values.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">2. Purpose of Collection (The "Why")</h2>
                <p className="text-gray-600 leading-relaxed">All data collection is strictly limited to enabling the Service for the seller's internal benefit.</p>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  Amazon data is collected solely for the purpose of identifying and filing FBA reimbursement claims on the user's behalf and providing a consolidated financial reporting view.
                </blockquote>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  External evidence data is collected solely for the automated matching and validation of FBA claims, as required by Amazon's official reimbursement policies.
                </blockquote>
                <p className="text-gray-600 leading-relaxed">No data is used for Clario's independent business purposes, analytics, or third-party enrichment.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">3. Data Usage Limitation (The Rejection Shield)</h2>
                <p className="text-gray-600 leading-relaxed"><strong>We agree to and comply with the Amazon Selling Partner API Data Protection Policy (DPP).</strong></p>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  We will not use any Amazon data, including PII, for any purpose other than providing the agreed-upon automated financial reconciliation service to the seller. We will never use the data for advertising, marketing, or any purpose that benefits Clario directly without explicit, documented seller consent beyond the core service.
                </blockquote>
                <p className="text-gray-600 leading-relaxed">Violation of this limitation constitutes grounds for immediate termination of data access and user notification.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">4. Data Storage and Security (The "How Protected")</h2>
                <p className="text-gray-600 leading-relaxed">Clario implements industry-leading security controls aligned with Amazon DPP requirements.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-700">
                    <thead className="uppercase text-xs tracking-wider text-gray-500">
                      <tr>
                        <th className="py-3 pr-6">Security Measure</th>
                        <th className="py-3">Implementation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-600">
                      <tr>
                        <td className="py-3 pr-6 font-medium">Encryption</td>
                        <td className="py-3">All data, including Amazon PII and external evidence, is encrypted in transit (TLS 1.2 or higher) and at rest (AES-256 or equivalent).</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-6 font-medium">Access Control</td>
                        <td className="py-3">Access to data is restricted using the principle of least privilege and is only available to personnel required for service maintenance (e.g., developers) through secure access points (e.g., multi-factor authentication, VPNs).</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-6 font-medium">Data Separation</td>
                        <td className="py-3">Amazon PII is stored logically separate from other business data.</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-6 font-medium">Infrastructure</td>
                        <td className="py-3">Hosted on Amazon Web Services (AWS) in the us-east-1 region, with VPC isolation, WAF, and automated security scanning. (This shows we are co-locating the data in the primary region of our target market, which is best practice).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">5. Data Retention Policy (The "When Deleted")</h2>
                <p className="text-gray-600 leading-relaxed">We do not retain data longer than necessary.</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li><strong>Deauthorization</strong>: If a user deauthorizes Clario, we will initiate the secure deletion of all collected Amazon data, including PII, within 30 days, in full compliance with SP-API policy.</li>
                  <li><strong>User Request</strong>: Users can request immediate deletion of their data at any time via in-app settings or by emailing <a href="mailto:support@clario.app" className="underline text-emerald-600 hover:text-emerald-700">support@clario.app</a>. Deletion is completed within 7 business days.</li>
                </ul>
                <p className="text-gray-600 leading-relaxed">Audit logs confirming deletion are retained for compliance purposes only.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">6. Sharing and Disclosure (The "With Whom")</h2>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  Clario does not share or sell user data to third parties.
                </blockquote>
                <p className="text-gray-600 leading-relaxed"><strong>Sole Exception</strong>:</p>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  Data is shared only with Amazon, Inc., for the sole purpose of submitting reimbursement claims on the seller's behalf.
                </blockquote>
                <p className="text-gray-600 leading-relaxed">This transmission occurs exclusively via Amazon's secure SP-API endpoints and includes only the minimum required fields.</p>
                <p className="text-gray-600 leading-relaxed">No subcontractors, analytics providers, or affiliates receive access to Amazon data.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">7. Changes to This Policy</h2>
                <p className="text-gray-600 leading-relaxed">We reserve the right to update this Policy to reflect changes in our Service or legal requirements. <strong>Material changes</strong> (e.g., new data types, purposes, or sharing) will be communicated to users via:</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Email to the address associated with their Clario account</li>
                  <li>In-app notification banner</li>
                </ul>
                <p className="text-gray-600 leading-relaxed">Changes take effect 30 days after notification, during which users may review and deauthorize if desired. Continued use after this period constitutes acceptance.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">8. Your Data Protection Rights</h2>
                <p className="text-gray-600 leading-relaxed">Depending on your location, you may have the following rights regarding your data:</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>The right to access, update, or delete the information we have on you.</li>
                  <li>The right to rectification if that information is inaccurate.</li>
                  <li>The right to object to our processing of your data.</li>
                  <li>The right to restrict the processing of your data.</li>
                  <li>The right to data portability (request a copy of your data).</li>
                  <li>The right to withdraw consent at any time.</li>
                </ul>
                <p className="text-gray-600 leading-relaxed">
                  For users in the European Economic Area (EEA), UK, or California (CCPA), you may exercise these rights by contacting <a href="mailto:privacy@clario.app" className="underline text-emerald-600 hover:text-emerald-700">privacy@clario.app</a>.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">Contact Us</h2>
                <p className="text-gray-600 leading-relaxed">For questions, deletion requests, or compliance inquiries:</p>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Clario (A Mvelo P. Venture)</strong></p>
                  <p><strong>Email</strong>: <a href="mailto:privacy@clario.app" className="underline text-emerald-600 hover:text-emerald-700">privacy@clario.app</a></p>
                  <p><strong>Location</strong>: Durban, South Africa</p>
                  <p><strong>Response Time</strong>: Within 48 hours</p>
                </div>
              </section>

              <p className="text-sm text-gray-500 italic">Clario operates under the principle of Least Privilege. Your trust is our foundation.</p>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
};

export default Privacy;

