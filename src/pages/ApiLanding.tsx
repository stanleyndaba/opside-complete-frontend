import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
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
    { code: 'us-en', country: 'USA', language: 'English', flag: '🇺🇸' },
    { code: 'ca-en', country: 'Canada', language: 'English', flag: '🇨🇦' },
    { code: 'ca-fr', country: 'Canada', language: 'Français', flag: '🇨🇦' },
    { code: 'gb-en', country: 'United Kingdom', language: 'English', flag: '🇬🇧' },
    { code: 'au-en', country: 'Australia', language: 'English', flag: '🇦🇺' },
    { code: 'de-de', country: 'Germany', language: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr-fr', country: 'France', language: 'Français', flag: '🇫🇷' },
    { code: 'es-es', country: 'Spain', language: 'Español', flag: '🇪🇸' },
    { code: 'it-it', country: 'Italy', language: 'Italiano', flag: '🇮🇹' },
    { code: 'nl-nl', country: 'Netherlands', language: 'Nederlands', flag: '🇳🇱' },
  ];
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('clario.langPreference') || 'us-en' : 'us-en'
  );
  useEffect(() => {
    try { localStorage.setItem('clario.langPreference', selectedLanguageCode); } catch {}
  }, [selectedLanguageCode]);
  const selectedLanguage = LANGUAGE_OPTIONS.find(o => o.code === selectedLanguageCode) || LANGUAGE_OPTIONS[0];

  const [connecting, setConnecting] = useState(false);

  return (
    <div className="min-h-screen landing" style={{ backgroundColor: '#0B1220' }}>
      <header className="sticky top-0 z-40 border-transparent bg-transparent">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between text-gray-100">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 hover:opacity-90">
              <img src="/logo-abstract.svg" alt="Logo" className="h-8 w-8" />
              <span className="font-medium">Clario</span>
            </Link>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            {/* Language selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-md text-sm text-gray-200 hover:bg-white/10 transition-colors"
                  aria-label="Language preference"
                >
                  <span>{selectedLanguage.language}</span>
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[220px] bg-[#0B1220]/70 backdrop-blur-md border border-white/10 text-gray-100 shadow-xl">
                {LANGUAGE_OPTIONS.map(opt => (
                  <DropdownMenuItem key={opt.code} onClick={() => setSelectedLanguageCode(opt.code)} className="gap-2 hover:bg-white/10 focus:bg-white/10">
                    <span className="font-medium">{opt.language}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Login */}
            <Button variant="ghost" className="text-gray-200 hover:bg-white/10 hover:text-white" type="button" disabled={connecting} onClick={async () => {
              if (connecting) return; setConnecting(true);
              try {
                const res = await api.connectAmazon();
                const url = (res as any)?.data?.auth_url || (res as any)?.data?.redirect_url;
                if ((res as any)?.ok && url) window.location.assign(url as string); else window.location.assign('/auth/amazon-sandbox');
              } catch {
                window.location.assign('/auth/amazon-sandbox');
              }
            }}>
              Login
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <div className="relative w-full min-h-[calc(100vh-64px)]">
          {/* Subtle blueprint glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />

          <div className="relative mx-auto max-w-3xl px-6 pt-20 md:pt-28 pb-24 text-gray-300">
            <header>
              <h1 className="font-heading text-4xl md:text-5xl leading-tight text-gray-100">
                The Clario API: The Financial Engine for Modern Commerce
              </h1>
              <p className="mt-5 text-lg md:text-xl text-gray-300 font-body">
                At Clario, we are building more than a dashboard. We are building the intelligent financial recovery layer for e-commerce. Our future-facing API will allow developers, agencies, and enterprise brands to programmatically access the full power of our platform, integrating automated reimbursement data and workflows directly into their own systems.
              </p>
            </header>

            <section className="mt-10">
              <div className="rounded-xl border border-white/10 bg-[#0F172A] shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                  <span className="ml-3 text-xs uppercase tracking-wider text-gray-400">example.py</span>
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
                <h2 className="font-body text-xl md:text-2xl font-semibold text-gray-200">What You Will Be Able to Do</h2>
                <ul className="mt-4 space-y-3 text-gray-300">
                  <li><span className="text-gray-400">Sync Recovery Data:</span> Pull all detected claims, their statuses, and their financial value directly into your own internal dashboards, data warehouses, or ERP systems.</li>
                  <li><span className="text-gray-400">Build Custom Reporting:</span> Create bespoke financial reports and analytics for your team or your clients, leveraging real-time data from the Clario engine.</li>
                  <li><span className="text-gray-400">Automate Workflows:</span> Programmatically approve claims, trigger scans, and manage your recovery pipeline without ever needing to log into the Clario UI.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-body text-xl md:text-2xl font-semibold text-gray-200">How It Will Work</h2>
                <ul className="mt-4 space-y-3 text-gray-300">
                  <li><span className="text-gray-400">Modern REST Architecture:</span> A clean, predictable, and well-documented REST API that is easy to integrate with.</li>
                  <li><span className="text-gray-400">Real-Time Webhooks:</span> Receive real-time push notifications to your own services for key events like <code className="font-mono">claim.detected</code>, <code className="font-mono">claim.submitted</code>, and <code className="font-mono">funds.recovered</code>.</li>
                  <li><span className="text-gray-400">Secure and Scalable:</span> Built with the same enterprise-grade security and reliability as our core platform, ensuring your data is always safe and accessible.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-body text-xl md:text-2xl font-semibold text-gray-200">Get Notified</h2>
                <p className="mt-4 text-gray-400">Our developer API is currently in a private beta with select partners. If you are an enterprise brand, an agency, or a developer interested in building on the Clario platform, please contact us to be added to the early access list.</p>
                <div className="mt-6">
                  <Button asChild className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
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
