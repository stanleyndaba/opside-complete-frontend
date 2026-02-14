import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

type Props = {
  selectedLanguageLabel?: string;
};

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61587942041536',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    )
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/margincapital/',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0-2.163c-3.259 0-3.667.014-4.947.072-1.277.06-2.148.262-2.913.558-.788.306-1.459.718-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    )
  }
];

const FooterComponent: React.FC<Props> = ({ selectedLanguageLabel }) => {
  return (
    <div className="relative z-10 w-full bg-[#050505]">
      <footer id="core-footer" className="relative bg-[#050505] text-white w-full border-t border-white/5" style={{ width: '100%', maxWidth: '100%' }}>
        <div className="container mx-auto px-6 pt-12 pb-14 space-y-8">
          <div className="space-y-6">
            <Link to="/" className="inline-flex items-center gap-2.5 transition-colors hover:opacity-80">
              <img
                src="/logoimagetwo.png"
                alt="Margin"
                width="24"
                height="24"
                className="h-6 w-auto object-contain invert brightness-0"
              />
              <span className="font-merriweather font-bold text-white text-xl tracking-tight">Margin</span>
            </Link>
            <p className="font-montserrat text-sm text-white/40 leading-relaxed max-w-sm">
              Autonomous reimbursements crafted for modern Amazon operators. Secure data flows, transparent claims,
              and a finance-ready audit trail—no agency overhead.
            </p>
            {SOCIAL_LINKS.length > 0 && (
              <div className="flex items-center gap-6">
                {SOCIAL_LINKS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.label}
                      className="inline-flex items-center justify-center text-white/50 transition-all hover:text-white group">
                      <div className="transition-transform duration-300 group-hover:scale-110">
                        <Icon />
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-10 border-t border-white/5 pt-10">
            {/* Split layout on mobile: 2x2 grid for links + bottom status block */}
            <div className="grid grid-cols-2 gap-y-8 gap-x-4 md:flex md:flex-row md:items-center md:justify-between">

              {/* Policy Links Group */}
              <div className="grid grid-cols-1 gap-2.5 md:flex md:flex-row md:gap-x-6 text-[11px] font-semibold text-white/30 tracking-tight uppercase">
                <Link to="/pricing" className="transition hover:text-white">
                  Pricing
                </Link>
                <Link to="/privacy" className="transition hover:text-white">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="transition hover:text-white">
                  Terms of Service
                </Link>
                <Link to="/docs" className="transition hover:text-white">
                  Acceptable Use Policy
                </Link>
                <Link to="/refund-policy" className="transition hover:text-white">
                  Refund Policy
                </Link>
              </div>

              {/* Institutional Validation Badge & Copyright */}
              <div className="col-span-2 md:col-span-1 flex flex-col items-center md:items-end gap-4 pt-8 md:pt-0 border-t border-white/5 md:border-none">
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white/[0.02] border border-white/10 rounded-sm grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <span className="text-[9px] font-bold tracking-[0.15em] text-white/50 uppercase">
                    Verified Amazon SP-API Developer
                  </span>
                </div>

                <div className="flex flex-col items-center md:items-end gap-1">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-tighter">
                    © {new Date().getFullYear()} Margin. Built for operators.
                  </p>
                  {selectedLanguageLabel && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-white/30">
                      <Globe className="h-3 w-3" />
                      {selectedLanguageLabel}
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Global Legal Disclaimer */}
            <div className="pt-8 border-t border-white/5 opacity-40 hover:opacity-100 transition-opacity duration-300">
              <p className="text-[9px] md:text-[10px] font-montserrat text-white/40 leading-relaxed max-w-5xl">
                <span className="font-bold text-white/60">Disclaimer:</span> System performance metrics (Latency, Precision, Throughput) are based on internal benchmarks under controlled API load tests. "Recovery estimates" are projections based on historical FBA inventory error rates and are not guarantees of future refunds. All claims are generated in strict accordance with Amazon's reimbursement policy windows.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const BrandFooter = React.memo(FooterComponent);
export default BrandFooter;

