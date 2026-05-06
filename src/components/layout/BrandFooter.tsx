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
  }
];

const FooterComponent: React.FC<Props> = ({ selectedLanguageLabel }) => {
  return (
    <div className="relative z-10 w-full bg-[#101820]">
      <footer id="core-footer" className="relative w-full border-t border-white/[0.08] bg-[#101820] text-[#EAF1F5]" style={{ width: '100%', maxWidth: '100%' }}>
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
              <span className="brand-wordmark font-merriweather text-[#F4F8FA] text-xl tracking-tight">Margin</span>
            </Link>
            <p className="font-montserrat text-sm text-[#9AA8B2] leading-relaxed max-w-sm">
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
                      className="inline-flex items-center justify-center text-[#9AA8B2] transition-all hover:text-[#8BC7FF] group">
                      <div className="transition-transform duration-300 group-hover:scale-110">
                        <Icon />
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
            <div className="flex flex-col gap-1.5 text-[12px] font-mono text-[#9AA8B2]">
              <span>Email: <a href="mailto:support@margin-finance.com" className="transition-colors hover:text-[#8BC7FF]">support@margin-finance.com</a></span>
            </div>
          </div>
          <div className="flex flex-col gap-10 border-t border-white/[0.08] pt-10">
            {/* Split layout on mobile: 2x2 grid for links + bottom status block */}
            <div className="grid grid-cols-2 gap-y-8 gap-x-4 md:flex md:flex-row md:items-center md:justify-between">

              {/* Policy Links Group */}
              <div className="grid grid-cols-1 gap-2.5 md:flex md:flex-row md:gap-x-6 text-[11px] font-semibold text-[#7F8E99] tracking-tight uppercase">
                <Link to="/pricing" className="transition hover:text-[#EAF1F5]">
                  Pricing
                </Link>
                <Link to="/developer-api" className="transition hover:text-[#EAF1F5]">
                  API
                </Link>
                <Link to="/privacy" className="transition hover:text-[#EAF1F5]">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="transition hover:text-[#EAF1F5]">
                  Terms of Service
                </Link>
                <Link to="/docs" className="transition hover:text-[#EAF1F5]">
                  Acceptable Use Policy
                </Link>
                <Link to="/refund-policy" className="transition hover:text-[#EAF1F5]">
                  Refund Policy
                </Link>
              </div>


              {/* Institutional Validation Badge & Copyright */}
              <div className="col-span-2 md:col-span-1 flex flex-col items-center md:items-end gap-4 pt-8 md:pt-0 border-t border-white/[0.08] md:border-none">
                <div className="flex items-center gap-2.5 rounded-full border border-[#2C4657] bg-white/[0.04] px-3 py-1.5 opacity-90 transition-all duration-300 hover:border-[#8BC7FF]/50 hover:bg-white/[0.06] hover:opacity-100">
                  <svg className="h-4 w-4 text-[#6FD0A2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <span className="text-[9px] font-bold tracking-[0.15em] text-[#B7C5CE] uppercase">
                    Verified Amazon SP-API Developer
                  </span>
                </div>

                <div className="flex flex-col items-center md:items-end gap-1">
                  <p className="text-[10px] font-mono text-[#7F8E99] uppercase tracking-tighter">
                    © {new Date().getFullYear()} Margin. Built for operators.
                  </p>
                  {selectedLanguageLabel && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#7F8E99]">
                      <Globe className="h-3 w-3" />
                      {selectedLanguageLabel}
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Global Legal Disclaimer */}
            <div className="pt-8 border-t border-white/[0.08] opacity-75 transition-opacity duration-300 hover:opacity-100">
              <p className="text-[9px] md:text-[10px] font-montserrat text-[#9AA8B2] leading-relaxed max-w-5xl">
                <span className="font-bold text-[#DCE8EE]">Disclaimer:</span> System performance metrics (Latency, Precision, Throughput) are based on internal benchmarks under controlled API load tests. "Recovery estimates" are projections based on historical FBA inventory error rates and are not guarantees of future refunds. All claims are generated in strict accordance with Amazon's reimbursement policy windows.
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

