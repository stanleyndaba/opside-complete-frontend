import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

type Props = {
  selectedLanguageLabel?: string;
};

const SOCIAL_LINKS = [
  {
    label: 'LinkedIn', href: 'https://www.linkedin.com/company/margin-ai', icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-[18px] w-[18px]">
        <circle cx="4.983" cy="5.009" r="2.188" />
        <path d="M9.237 8.855v12.139h3.769v-6.003c0-1.584.298-3.118 2.262-3.118 1.937 0 1.961 1.811 1.961 3.218v5.904H21v-6.657c0-3.27-.704-5.783-4.526-5.783-1.835 0-3.065 1.007-3.568 1.96h-.051v-1.66H9.237zm-6.142 0H6.87v12.139H3.095z" />
      </svg>
    )
  },
  {
    label: 'X (Formerly Twitter)', href: 'https://x.com/MarginAI', icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-[18px] w-[18px]">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  },
  {
    label: 'Facebook', href: 'https://facebook.com/MarginAI', icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-[18px] w-[18px]">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    )
  },
  {
    label: 'Instagram', href: 'https://instagram.com/MarginAI', icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-[18px] w-[18px]">
        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.731.009 3.691.052 1.02.045 1.574.215 1.944.359.49.19.839.418 1.207.786.368.368.596.717.786 1.207.144.37.314.924.359 1.944.043.96.052 1.261.052 3.691s-.009 2.731-.052 3.691c-.045 1.02-.215 1.574-.359 1.944-.19.49-.418.839-.786 1.207-.368.368-.717.596-1.207.786-.37.144-.924.314-1.944.359-.96.043-1.261.052-3.691.052s-2.731-.009-3.691-.052c-1.02-.045-1.574-.215-1.944-.359-.49-.19-.839-.418-1.207-.786-.368-.368-.596-.717-.786-1.207-.144-.37-.314-.924-.359-1.944-.043-.96-.052-1.261-.052-3.691s.009-2.731.052-3.691c.045-1.02.215-1.574.359-1.944.19-.49.418-.839.786-1.207.368-.368.717-.596 1.207-.786.37-.144.924-.314 1.944-.359.96-.043 1.261-.052 3.691-.052zm-3.04 1.314c-.818.037-1.263.173-1.558.287-.39.15-.668.33-.96.623-.293.292-.473.57-.623.96-.114.295-.25.74-.287 1.558-.04.945-.05 1.233-.046 3.498.004 2.264.045 2.551.086 3.496.04 2.266.04 2.551.086 3.496.04.818.173 1.263.287 1.558.15.39.33.668.623.96.292.293.57.473.96.623.295.114.74.25 1.558.287.945.04 1.233.05 3.498.046 2.264-.004 2.551-.045 3.496-.086.818-.04 1.263-.173 1.558-.287.39-.15.668-.33.96-.623.292-.293.57-.473.96-.623.114-.295.25-.74.287-1.558.04-.945.05-1.233.046-3.498-.004-2.264-.045-2.551-.086-3.496-.04-.818-.173-1.263-.287-1.558-.15-.39-.33-.668-.623-.96-.292-.293-.57-.473-.96-.623-.295-.114-.74-.25-1.558-.287-.945-.04-1.233-.05-3.498-.046-2.264.004-2.551.045-3.496.086zm3.04 2.846c-2.43 0-4.4 1.97-4.4 4.4s1.97 4.4 4.4 4.4 4.4-1.97 4.4-4.4-1.97-4.4-4.4-4.4zm0 7.486c-1.704 0-3.086-1.382-3.086-3.086 0-1.704 1.382-3.086 3.086-3.086 1.704 0 3.086 1.382 3.086 3.086 0 1.704-1.382 3.086-3.086 3.086zm5.275-8.733c0 .614-.497 1.111-1.111 1.111-.614 0-1.111-.497-1.111-1.111 0-.614.497-1.111 1.111-1.111.614 0 1.111.497 1.111 1.111z" clipRule="evenodd" />
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
                      className="inline-flex items-center justify-center text-white/20 transition-all hover:text-white group">
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

