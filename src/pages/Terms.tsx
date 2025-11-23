import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Gift } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { api } from '@/lib/api';
import { BrandFooter } from '@/components/layout/BrandFooter';

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

const Terms = () => {
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
              <div className="flex items-center gap-2">
                <Link to="/" className="inline-flex items-center px-3 py-1.5 rounded-[16px] transition-colors hover:bg-gray-100">
                  <span className="font-black text-[#b3b3b3] tracking-tight">
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
          <div className="max-w-4xl mx-auto space-y-10 text-gray-700">
            <div className="text-sm text-gray-500 space-y-1">
              <p><strong>Effective Date:</strong> January 1, 2025</p>
              <p className="text-xs text-gray-400">The day Clario&apos;s full-time operations and IP creation officially began.</p>
              <p><strong>Last Updated:</strong> November 17, 2025</p>
              <p className="text-xs text-gray-400">The day Clario legally executed and finalized this document.</p>
            </div>

              <section className="space-y-4">
                <header className="space-y-3">
                  <p className="uppercase text-xs tracking-[0.3em] text-emerald-600">Legal</p>
                  <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">Clario Terms of Service</h1>
                </header>
                <p className="leading-relaxed">
                  These Terms of Service ("TOS") govern your access to and use of Clario ("Clario," "we," "us," or "our"), a SaaS platform that automates the identification, evidence-matching, and submission of FBA reimbursement claims on behalf of Amazon sellers ("User," "you," or "Seller").
                </p>
                <p className="leading-relaxed">
                  By creating an account, connecting your Amazon Seller Central account via OAuth, or using any part of the Service, you agree to be bound by these TOS and the{' '}
                  <a href="https://clario.app/privacy" className="underline text-emerald-600 hover:text-emerald-700" target="_blank" rel="noreferrer">
                    Clario Data Privacy Policy
                  </a>{' '}
                  (which is incorporated herein by reference).
                </p>
              </section>

              <hr className="border-gray-200" />

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-gray-900">1. Acceptance and Service Scope</h2>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Clario</strong> is a software-as-a-service (SaaS) tool that automates the identification, evidence-matching, and submission of FBA reimbursement claims on the User's behalf.
                </p>
                <p className="text-gray-600 leading-relaxed">The Service includes:</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Automated analysis of Amazon SP-API data (e.g., inventory adjustments, shipment discrepancies)</li>
                  <li>Extraction and matching of supporting evidence (e.g., invoices, BOLs) from user-authorized external sources</li>
                  <li>Preparation and submission of reimbursement claims via Amazon's official channels</li>
                </ul>
                <p className="text-gray-700 leading-relaxed font-medium">By using Clario, you agree:</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>To these TOS and the Clario Data Privacy Policy</li>
                  <li><strong>To comply with all Amazon Selling Partner Agreements, Policies, and the Amazon Selling Partner API Developer Agreement</strong></li>
                </ul>
              </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-gray-900">2. User Responsibilities and Conduct</h2>
                <p className="text-gray-600 leading-relaxed">You are solely responsible for your use of Clario.</p>
                <p className="text-gray-600 leading-relaxed">You agree to:</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Provide accurate, complete, and authorized access to your Amazon Seller Central account and linked data sources (e.g., Gmail, Google Drive)</li>
                  <li><strong>Not use Clario to file fraudulent, fictitious, or unauthorized reimbursement claims</strong></li>
                  <li>Maintain the confidentiality and security of your Amazon Seller Central credentials and OAuth tokens</li>
                  <li>Immediately notify Clario of any unauthorized use of your account</li>
                </ul>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Prohibited Use:</strong> Any attempt to manipulate, falsify, or misrepresent data to generate invalid claims violates these TOS and may result in immediate termination and reporting to Amazon.
                </p>
              </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-gray-900">3. Fee Structure and Billing</h2>
                <p className="text-gray-600 leading-relaxed">Clario operates on a <strong>contingency commission basis</strong>.</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li><strong>Commission Rate</strong>: <strong>20%</strong> of the total reimbursement amount successfully credited to your Amazon account by Amazon</li>
                  <li><strong>Payment Trigger</strong>: Fees are calculated and invoiced <strong>only when Amazon credits funds</strong> to your Seller Central account as a result of a Clario-submitted claim</li>
                  <li><strong>No Recovery, No Fee</strong>: If no reimbursement is awarded, you owe nothing</li>
                </ul>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Founder's Council Exemption</strong>: Early-access users enrolled in the Founder's Council program may be exempt from fees for the initial 90-day period from activation. Standard commission applies thereafter.
                </p>
                <p className="text-gray-600 leading-relaxed">All fees are final and non-refundable unless required by law.</p>
                <h3 className="text-xl font-medium text-gray-900">3.1 Payment and Billing</h3>
                <p className="text-gray-600 leading-relaxed">
                  To use the Service, you must provide a valid payment method (e.g., credit card via Stripe). You authorize Clario to charge your payment method for all commission fees due under this TOS.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Invoices will be generated monthly in arrears, based on reimbursements successfully credited to your account. Payment is due upon receipt. Failure to pay may result in suspension or termination of your account.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">4. Intellectual Property (IP)</h2>
                <p className="text-gray-600 leading-relaxed">Clario retains full ownership of:</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>The Clario platform, software, and user interface</li>
                  <li>All algorithms, evidence-matching logic, claim-generation models, and automation workflows</li>
                  <li>Trademarks, logos, and branding</li>
                </ul>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Limited License</strong>: You are granted a <strong>non-exclusive, non-transferable, revocable license</strong> to use the Service solely for your internal FBA reimbursement operations during the term of your active account.
                </p>
                <p className="text-gray-600 leading-relaxed">You may not copy, modify, reverse-engineer, or create derivative works of any part of Clario.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">5. Termination and Suspension</h2>
                <h3 className="text-xl font-medium text-gray-900">Clario's Right to Suspend or Terminate</h3>
                <p className="text-gray-600 leading-relaxed">We may <strong>immediately suspend or terminate</strong> your access if:</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>You violate these TOS</li>
                  <li>We suspect fraudulent or policy-violating activity</li>
                  <li>Amazon revokes or restricts your SP-API access</li>
                  <li>Required for legal or security reasons</li>
                </ul>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Self-Policing Commitment</strong>: Clario actively monitors for abuse and will report suspected violations of Amazon policy to Amazon, Inc.
                </p>
                <h3 className="text-xl font-medium text-gray-900">Your Right to Cancel</h3>
                <p className="text-gray-600 leading-relaxed">
                  You may cancel your Clario account at any time via in-app settings or by emailing{' '}
                  <a href="mailto:support@clario.app" className="underline text-emerald-600 hover:text-emerald-700">support@clario.app</a>.
                  {' '}Cancellation takes effect immediately. No further claims will be filed after cancellation.
                </p>
                <h3 className="text-xl font-medium text-gray-900">5.1 Effect of Termination</h3>
                <p className="text-gray-600 leading-relaxed">
                  Upon termination by either party, your license to use the Service ceases immediately. However, you remain liable for all commission fees on claims submitted by Clario prior to termination that are subsequently approved and credited by Amazon. Clario reserves the right to invoice for these post-termination fees.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">6. Disclaimer of Warranties</h2>
                <p className="text-gray-600 leading-relaxed"><strong>CLARIO DOES NOT GUARANTEE:</strong></p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Recovery of any specific reimbursement amount</li>
                  <li>Approval or successful resolution of any claim submitted</li>
                  <li>Amazon's processing timeline or decision-making</li>
                </ul>
                <p className="text-gray-600 leading-relaxed"><strong>Final authority rests solely with Amazon, Inc.</strong></p>
                <p className="text-gray-600 leading-relaxed">
                  The Service is provided <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">7. Limitation of Liability and Governing Law</h2>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Liability Cap</strong>: To the fullest extent permitted by law, Clario's total liability to you shall not exceed the total fees paid by you to Clario in the <strong>12 months</strong> preceding the claim.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  <strong>No Consequential Damages</strong>: In no event shall Clario be liable for indirect, incidental, special, punitive, or consequential damages, including lost profits, data, or business opportunity.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Governing Law</strong>: These TOS shall be governed by the laws of the <strong>State of Delaware</strong>, without regard to conflict of law principles. Any disputes shall be resolved exclusively in the state or federal courts located in <strong>New Castle County, Delaware</strong>.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">8. Dispute Resolution by Binding Arbitration</h2>
                <p className="text-gray-600 leading-relaxed">
                  <strong>PLEASE READ THIS SECTION CAREFULLY AS IT AFFECTS YOUR RIGHTS.</strong>
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Any dispute, claim, or controversy arising out of or relating to these TOS or the breach, termination, enforcement, interpretation, or validity thereof, shall be determined by binding arbitration in New Castle County, Delaware, rather than in court. You agree to waive your right to a trial by jury or to participate in a class action. This arbitration provision shall survive termination of these TOS.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">9. Contact Us</h2>
                <p className="text-gray-600 leading-relaxed">For support, cancellation, or legal inquiries:</p>
                  <div className="space-y-2 text-gray-600">
                    <p><strong>Clario, Inc.</strong></p>
                  <p><strong>Email</strong>: <a href="mailto:legal@clario.app" className="underline text-emerald-600 hover:text-emerald-700">legal@clario.app</a></p>
                  <p><strong>Response Time</strong>: Within 48 hours</p>
                </div>
              </section>

              <p className="text-sm text-gray-500 italic">Clario empowers sellers. Compliance protects us all.</p>
          </div>
        </main>
        <BrandFooter selectedLanguageLabel={selectedLanguage.language} />
      </div>
    </div>
  );
};

export default Terms;
