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
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <rect width="24" height="24" rx="4" fill="#0A66C2" />
        <path
          d="M9.5 9.5h2.4v1.4c.34-.68 1.22-1.47 2.64-1.47 2.82 0 3.46 1.53 3.46 3.86v4.7h-2.5v-4.16c0-1.24-.02-2.83-1.73-2.83-1.73 0-1.99 1.35-1.99 2.74v4.25H9.5V9.5Z"
          fill="white"
        />
        <path d="M6.43 8.06c.83 0 1.5-.67 1.5-1.49a1.5 1.5 0 0 0-3 0c0 .82.67 1.5 1.5 1.5Z" fill="white" />
        <path d="M5.2 9.5h2.5v8.5H5.2V9.5Z" fill="white" />
      </svg>
    )
  },
  {
    label: 'X (Formerly Twitter)', href: 'https://x.com/MarginAI', icon: () => (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <rect width="24" height="24" rx="4" fill="black" />
        <path
          d="M14.79 6.75h2.31l-5.06 5.62L17.5 17.5h-2.83l-3.18-3.8-3.64 3.8H5.54l5.39-5.64L6.5 6.75h2.92l2.9 3.48 3.47-3.48Z"
          fill="white"
        />
      </svg>
    )
  }
];

const FooterComponent: React.FC<Props> = ({ selectedLanguageLabel }) => {
  return (
    <div className="relative z-10 w-full bg-white">
      <footer id="core-footer" className="relative bg-white text-gray-900 w-full border-t border-gray-100" style={{ width: '100%', maxWidth: '100%' }}>
        <div className="container mx-auto px-6 pt-12 pb-14 space-y-8">
          <div className="space-y-4">
            <p className="font-montserrat text-sm text-gray-600 leading-relaxed max-w-sm">
              Autonomous reimbursements crafted for modern Amazon operators. Secure data flows, transparent claims,
              and a finance-ready audit trail—no agency overhead.
            </p>
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
                    className="inline-flex h-10 w-10 items-center justify-center transition hover:scale-105">
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-10 border-t border-gray-100 pt-10">
            {/* Split layout on mobile: 2x2 grid for links + bottom status block */}
            <div className="grid grid-cols-2 gap-y-8 gap-x-4 md:flex md:flex-row md:items-center md:justify-between">

              {/* Policy Links Group */}
              <div className="grid grid-cols-1 gap-2.5 md:flex md:flex-row md:gap-x-6 text-[11px] font-semibold text-gray-500 tracking-tight uppercase">
                <Link to="/privacy" className="transition hover:text-gray-900">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="transition hover:text-gray-900">
                  Terms of Service
                </Link>
                <Link to="/docs" className="transition hover:text-gray-900">
                  Acceptable Use Policy
                </Link>
                <Link to="/refund-policy" className="transition hover:text-gray-900">
                  Refund Policy
                </Link>
              </div>

              {/* Institutional Validation Badge & Copyright */}
              <div className="col-span-2 md:col-span-1 flex flex-col items-center md:items-end gap-4 pt-8 md:pt-0 border-t border-gray-50 md:border-none">
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-50/50 border border-gray-200/50 rounded-sm grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <span className="text-[9px] font-bold tracking-[0.15em] text-gray-700 uppercase">
                    Verified Amazon SP-API Developer
                  </span>
                </div>

                <div className="flex flex-col items-center md:items-end gap-1">
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">
                    © {new Date().getFullYear()} Margin. Built for operators.
                  </p>
                  {selectedLanguageLabel && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
                      <Globe className="h-3 w-3" />
                      {selectedLanguageLabel}
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const BrandFooter = React.memo(FooterComponent);
export default BrandFooter;

