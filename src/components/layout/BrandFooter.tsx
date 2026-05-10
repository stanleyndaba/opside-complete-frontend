import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Globe } from 'lucide-react';

type Props = {
  selectedLanguageLabel?: string;
};

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

const productLinks: FooterLink[] = [
  { label: 'Recovery Workflow', href: '/#how-margin-works' },
  { label: 'Event-to-Recovery Demo', href: '/#margin-demo' },
  { label: 'Managed Access', href: '/early-access' },
  { label: 'Pricing', href: '/pricing' }
];

const resourceLinks: FooterLink[] = [
  { label: 'FBA Reimbursement Research', href: '/fba-reimbursement-research' },
  { label: 'Docs', href: '/docs' },
  { label: 'Contact Support', href: '/contact' },
  { label: 'Sales', href: '/sales' }
];

const companyLinks: FooterLink[] = [
  { label: 'About', href: '/about' },
  { label: 'Careers', href: '/careers' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/refund-policy' }
];

const socialLinks = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/margin-finance',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
        <path d="M20.45 20.45h-3.56v-5.58c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.67H9.34V8.98h3.41v1.57h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29zM5.32 7.41a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.04H3.54V8.98H7.1v11.47zM22.23 0H1.76C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.76 24h20.47c.97 0 1.77-.77 1.77-1.73V1.73C24 .77 23.2 0 22.23 0z" />
      </svg>
    )
  },
  {
    label: 'X',
    href: 'https://x.com/marginfinance',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
        <path d="M18.9 2h3.68l-8.04 9.19L24 22h-7.4l-5.8-7.58L4.17 22H.49l8.6-9.83L0 2h7.58l5.24 6.93L18.9 2zm-1.29 18.1h2.04L6.47 3.8H4.28L17.61 20.1z" />
      </svg>
    )
  }
];

const FooterLinkItem: React.FC<{ item: FooterLink }> = ({ item }) => {
  const className =
    'group inline-flex w-fit items-center text-sm font-normal leading-6 tracking-tight text-[#A7B0B8] transition-colors duration-200 hover:text-[#F4F7F9]';

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={className}>
        <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-200 group-hover:bg-[length:100%_1px]">
          {item.label}
        </span>
      </a>
    );
  }

  if (item.href.includes('#')) {
    return (
      <a href={item.href} className={className}>
        <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-200 group-hover:bg-[length:100%_1px]">
          {item.label}
        </span>
      </a>
    );
  }

  return (
    <Link to={item.href} className={className}>
      <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-200 group-hover:bg-[length:100%_1px]">
        {item.label}
      </span>
    </Link>
  );
};

const FooterColumn: React.FC<{ title: string; links: FooterLink[] }> = ({ title, links }) => (
  <div>
    <h3 className="text-sm font-medium tracking-tight text-[#F4F7F9]">{title}</h3>
    <nav className="mt-5 flex flex-col gap-3" aria-label={title}>
      {links.map((item) => (
        <FooterLinkItem key={item.label} item={item} />
      ))}
    </nav>
  </div>
);

const FooterComponent: React.FC<Props> = ({ selectedLanguageLabel }) => {
  const handleNewsletterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="relative z-10 w-full bg-[#1A1A1A]">
      <footer
        id="core-footer"
        className="relative w-full overflow-hidden border-t border-white/[0.08] bg-[#1A1A1A] text-[#E7EAED]"
        style={{ width: '100%', maxWidth: '100%' }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(139,199,255,0.34),transparent)]" />
        <div className="pointer-events-none absolute -top-36 right-[-10%] h-80 w-80 rounded-full bg-[#0B74DE]/10 blur-3xl" />

        <div className="container mx-auto px-6 pb-10 pt-14 md:pb-12 md:pt-18">
          <div className="grid gap-8 border-b border-white/[0.08] pb-10 md:grid-cols-[1fr_0.9fr] md:items-end md:pb-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#8BC7FF]">Margin updates</p>
              <h2 className="mt-3 max-w-[640px] text-[30px] font-medium leading-tight tracking-tight text-[#F4F7F9] md:text-[42px]">
                Join for product updates, insights, and event invites.
              </h2>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="flex w-full flex-col gap-3 sm:flex-row md:justify-end" aria-label="Join Margin updates">
              <input
                type="email"
                required
                placeholder="Your email address"
                className="h-12 min-w-0 flex-1 rounded-full border border-white/[0.12] bg-white/[0.04] px-5 text-sm tracking-tight text-[#F4F7F9] outline-none transition placeholder:text-[#7D8790] hover:border-white/[0.22] focus:border-[#8BC7FF]/60 focus:bg-white/[0.06] md:max-w-[340px]"
              />
              <Button
                type="submit"
                className="h-12 rounded-full bg-[#F4F7F9] px-6 text-sm font-semibold tracking-tight text-[#151515] shadow-none transition hover:bg-[#DCE8EE]"
              >
                Join
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>

          <div className="grid gap-10 py-10 md:grid-cols-[1.15fr_0.85fr_0.85fr_0.9fr] md:gap-8 md:py-14">
            <div className="max-w-[360px]">
              <Link to="/" className="inline-flex items-center gap-3 transition-opacity hover:opacity-85">
                <img src="/logoimagetwo.png" alt="Margin" width="28" height="28" className="h-7 w-auto object-contain invert brightness-0" />
                <span className="brand-wordmark font-merriweather text-2xl tracking-tight text-[#F4F7F9]">Margin</span>
              </Link>
              <p className="mt-5 text-[15px] leading-7 tracking-tight text-[#A7B0B8]">
                Margin turns Amazon loss events into claim-ready recoveries before reimbursement windows close.
              </p>
              <p className="mt-5 text-sm leading-6 tracking-tight text-[#7D8790]">
                Read-only first. Seller approval before filing. No recovery commissions. Margin is monthly recovery management.
              </p>
            </div>

            <FooterColumn title="Product" links={productLinks} />
            <FooterColumn title="Resources" links={resourceLinks} />
            <FooterColumn title="Company" links={companyLinks} />
          </div>

          <div className="flex flex-col gap-6 border-t border-white/[0.08] pt-7 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 text-sm tracking-tight text-[#7D8790] md:flex-row md:items-center md:gap-5">
              <span>© {new Date().getFullYear()} Margin. Built for Amazon operators.</span>
              <a href="mailto:support@margin-finance.com" className="w-fit transition-colors hover:text-[#F4F7F9]">
                support@margin-finance.com
              </a>
              {selectedLanguageLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  {selectedLanguageLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] text-[#A7B0B8] transition hover:border-[#8BC7FF]/40 hover:bg-white/[0.04] hover:text-[#F4F7F9]"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <p className="mt-8 max-w-5xl text-[10px] leading-5 tracking-tight text-[#69737C]">
            Recovery estimates are projections based on available Amazon activity and supporting records, not guarantees of reimbursement. Amazon makes the final reimbursement decision.
          </p>
        </div>
      </footer>
    </div>
  );
};

export const BrandFooter = React.memo(FooterComponent);
export default BrandFooter;
