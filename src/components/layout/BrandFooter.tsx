import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

type Props = {
  selectedLanguageLabel: string;
};

const SOCIAL_LINKS = [
  {
    label: 'LinkedIn', href: 'https://www.linkedin.com/company/clario-ai', icon: () => (
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
    label: 'X (Formerly Twitter)', href: 'https://x.com/ClarioAI', icon: () => (
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
      <section className="relative bg-white py-12 w-full overflow-x-hidden" style={{ width: '100%', maxWidth: '100%' }}>
        {/* Opside AI text removed */}
      </section>

      <footer id="core-footer" className="relative bg-white text-gray-900 w-full" style={{ width: '100%', maxWidth: '100%' }}>
        <div className="container mx-auto px-6 py-14 space-y-8">
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
                    className="inline-flex h-10 w-10 items-center justify-center transition hover:scale-105"
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-4 border-t border-gray-200 pt-6 text-xs text-gray-500 md:flex-row md:items-center md:justify-between">
            <div className="order-1 flex flex-wrap items-center gap-4 text-gray-600 md:order-2">
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
              <span className="inline-flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" />
                {selectedLanguageLabel}
              </span>
            </div>
            <p className="order-2 text-gray-600 md:order-1">
              © {new Date().getFullYear()} Opside. Built for operators. Operating from Durban, South Africa.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const BrandFooter = React.memo(FooterComponent);
export default BrandFooter;

