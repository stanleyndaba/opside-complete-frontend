import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Link as LinkIcon, Mail, ChevronDown, Link2, HelpCircle, ScrollText, BookOpen, Building2, Handshake, Check, ShieldCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AmazonConnect } from '@/components/AmazonConnect';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);
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

  useEffect(() => {
    try {
      localStorage.setItem('clario.langPreference', selectedLanguageCode);
    } catch {}
  }, [selectedLanguageCode]);

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
    <div className="min-h-screen flex flex-col bg-[#0B1220] landing">
      <header className="sticky top-0 z-40 border-transparent bg-transparent">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo-abstract.svg" alt="Logo" className="h-8 w-8" />
            {/* Brand dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-1.5 text-gray-100 hover:text-white hover:bg-white/10 px-2 py-1 rounded-md">
                  <span className="font-medium">Clario</span>
                  <ChevronDown className="h-4 w-4 opacity-80" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[220px] bg-[#0B1220]/70 backdrop-blur-md border border-white/10 text-gray-100 shadow-xl">
                <DropdownMenuItem asChild>
                  <Link to="/integrations-hub" className="flex items-center gap-2 hover:bg-white/10 focus:bg-white/10">
                    <Link2 className="h-4 w-4" />
                    <span>Integrations</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/api-access" className="flex items-center gap-2 hover:bg-white/10 focus:bg-white/10">
                    <BookOpen className="h-4 w-4" />
                    <span>Documentation</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/help" className="flex items-center gap-2 hover:bg-white/10 focus:bg-white/10">
                    <HelpCircle className="h-4 w-4" />
                    <span>Help Center</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/about" className="flex items-center gap-2 hover:bg-white/10 focus:bg-white/10">
                    <Building2 className="h-4 w-4" />
                    <span>Enterprise</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="mailto:hello@getclario.com?subject=Partnerships" className="flex items-center gap-2 hover:bg-white/10 focus:bg-white/10">
                    <Handshake className="h-4 w-4" />
                    <span>Partnerships</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/terms" className="flex items-center gap-2 hover:bg-white/10 focus:bg-white/10">
                    <ScrollText className="h-4 w-4" />
                    <span>Terms & Policies</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            {/* API link */}
            <Link to="/developer-api" className="text-gray-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-md">API</Link>
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
              <DropdownMenuContent align="end" className="min-w-[240px] bg-[#0B1220]/70 backdrop-blur-md border border-white/10 text-gray-100 shadow-xl p-0">
                <div className="p-2 sticky top-0 bg-[#0B1220]/80 backdrop-blur-md border-b border-white/10" onKeyDown={(e) => e.stopPropagation()}>
                  <Input
                    value={langQuery}
                    onChange={(e) => setLangQuery(e.target.value)}
                    placeholder="Search language..."
                    className="h-8 bg-white/10 border-white/10 text-gray-100 placeholder:text-gray-400"
                  />
                </div>
                <div className="max-h-64 overflow-auto">
                  {filteredLanguages.length === 0 ? (
                    <DropdownMenuItem disabled className="text-gray-400">No matches</DropdownMenuItem>
                  ) : (
                    filteredLanguages.map((opt) => (
                      <DropdownMenuItem key={opt.code} onClick={() => { setSelectedLanguageCode(opt.code); setLangQuery(''); }} className="gap-2 hover:bg-white/10 focus:bg-white/10">
                        <span className="font-medium">{opt.language}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" className="text-gray-200 hover:bg-white/10 hover:text-white" onClick={() => navigate('/integrations-hub')}>
              Dashboard
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-6 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Trust chip removed per request */}
            <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight text-gray-100">
              The <span className="text-emerald-500">end</span> of FBA reimbursement work.
            </h1>
            <p className="font-body text-base md:text-xl text-gray-400 font-normal max-w-3xl mx-auto">
              Clario automates the entire reimbursement process, recovering lost revenue from Amazon FBA errors in minutes—not months.
            </p>
            <div className="pt-2">
              <div className="max-w-md mx-auto">
                <AmazonConnect 
                  onConnectionStart={() => setConnecting(true)}
                  onConnectionComplete={(data) => {
                    setConnecting(false);
                    if (data?.recovery_amount) {
                      navigate(`/integrations-hub?amazon_connected=true&recovery_amount=${data.recovery_amount}`);
                    } else {
                      navigate('/integrations-hub?amazon_connected=true');
                    }
                  }}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <p className="mt-3 text-xs text-gray-400 max-w-2xl mx-auto">
                By connecting your account, you agree to Clario's
                <Link to="/terms" className="mx-1 underline hover:text-gray-200">Terms of Service</Link>
                and acknowledge our
                <Link to="/security" className="mx-1 underline hover:text-gray-200">Data Security</Link>
                &
                <Link to="/privacy" className="mx-1 underline hover:text-gray-200">Privacy Policy</Link>.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                <div className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  <span className="text-gray-300 text-sm md:text-base">No credit card required</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  <span className="text-gray-300 text-sm md:text-base">Cancel anytime</span>
                </div>
              </div>
              {/* Email capture moved to bottom-left above the legal footer */}
            </div>
          </div>
        </section>
      </main>

      <div>
        <div className="container mx-auto px-6 py-4 flex items-center justify-end text-sm">
          <div className="flex items-center gap-6 text-gray-400">
            <Link to="/terms" className="hover:text-gray-200">Terms of use</Link>
            <Link to="/privacy" className="hover:text-gray-200">Privacy Policy</Link>
          </div>
        </div>
      </div>

      {/* Bottom-left email capture above legal footer */}
      <div className="container mx-auto px-6 pb-2">
        <div className="max-w-md">
          <h4 className="text-sm font-semibold text-gray-200 mb-2">Get Early Updates</h4>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); toast({ title: 'Thanks!', description: 'You are on the Finance Pilot list.' }); }}>
            <input type="email" required placeholder="Enter your email for Finance Pilot updates" className="flex-1 rounded-md bg-white/10 border border-white/10 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white">Sign up</Button>
          </form>
        </div>
      </div>

      <footer id="core-footer">
        <div className="container mx-auto px-6 py-6 flex items-center justify-center gap-3 text-xs text-gray-400 text-center">
          <span>
            © Clario 2025 | {selectedLanguage.language}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
