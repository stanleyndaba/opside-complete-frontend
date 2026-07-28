import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';

type Props = {
  selectedLanguageLabel?: string;
};

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

const productLinks: FooterLink[] = [
  { label: 'Audit-to-Evidence', href: '/#how-margin-works' },
  { label: 'Zero-Friction Filing', href: '/#margin-demo' },
  { label: 'Managed Access', href: '/early-access' },
  { label: 'Early Access', href: '/early-access' }
];

const resourceLinks: FooterLink[] = [
  { label: 'Docs', href: '/docs' },
  { label: 'Help Center', href: '/contact' },
  { label: 'Contact Support', href: '/contact' }
];

const companyLinks: FooterLink[] = [
  { label: 'About', href: '/about-margin' },
  { label: 'Contact', href: '/contact' },
  { label: 'Sales', href: '/sales' }
];

const legalLinks: FooterLink[] = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/refund-policy' }
];

const socialLinks = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61587942041536',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
        <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.09 4.39 23.08 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.03 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.08 24 18.09 24 12.07z" />
      </svg>
    )
  }
];

const FooterLinkItem: React.FC<{ item: FooterLink }> = ({ item }) => {
  const className =
    'group inline-flex w-fit items-center text-sm font-normal leading-6 tracking-tight text-gray-400 transition-colors duration-200 hover:text-blue-400 focus-visible:text-blue-400 focus-visible:outline-none';

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
    <h3 className="text-lg font-medium tracking-tight text-white">{title}</h3>
    <nav className="mt-5 flex flex-col gap-3" aria-label={title}>
      {links.map((item) => (
        <FooterLinkItem key={item.label} item={item} />
      ))}
    </nav>
  </div>
);

const FooterComponent: React.FC<Props> = ({ selectedLanguageLabel }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'submitted'>('idle');

  const handleNewsletterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.info('Margin newsletter signup', { email: newsletterEmail });
    setNewsletterStatus('submitted');
  };

  return (
    <div className="relative z-10 w-full bg-[#1A1A1A]">
      <footer
        id="core-footer"
        data-navbar-theme="dark"
        className="relative w-full overflow-hidden bg-[#1A1A1A] text-[#E0E0E0]"
        style={{ width: '100%', maxWidth: '100%' }}
      >
        <div className="container mx-auto px-4 py-16">
          <div className="hidden mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-2xl font-medium tracking-tight text-white md:text-3xl">
              Join for product updates, insights, and event invites.
            </h2>

            <form onSubmit={handleNewsletterSubmit} className="mt-6 flex w-full flex-col justify-center gap-3 sm:flex-row" aria-label="Join Margin updates">
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                required
                value={newsletterEmail}
                onChange={(event) => {
                  setNewsletterEmail(event.target.value);
                  setNewsletterStatus('idle');
                }}
                placeholder="Your email address"
                aria-describedby="footer-newsletter-status"
                className="h-12 w-full max-w-md rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 hover:border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="h-12 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A1A1A]"
              >
                Subscribe
              </button>
            </form>
            <p id="footer-newsletter-status" className="mt-3 text-sm text-gray-500" aria-live="polite">
              {newsletterStatus === 'submitted'
                ? 'Thanks. We will keep you posted.'
                : 'Occasional updates on recovery workflows, product releases, and operator insights.'}
            </p>
          </div>

          <div className="grid gap-10 border-t border-gray-700 pt-12 md:grid-cols-4 md:gap-8">
            <div className="max-w-[360px]">
              <Link to="/" className="inline-flex items-center gap-3 transition-opacity hover:opacity-85">
                <img src="/logoimagetwo.png" alt="Margin" width="32" height="32" className="h-8 w-auto object-contain invert brightness-0" />
                <span className="brand-wordmark font-merriweather text-2xl tracking-tight text-white">Margin</span>
              </Link>
              <p className="mt-5 text-sm leading-6 tracking-tight text-gray-400">
                Margin: The Recovery OS for Amazon Sellers.
              </p>
              <p className="mt-4 text-sm leading-6 tracking-tight text-gray-500">
                Read-only first. Seller approval before filing. No recovery commissions. Margin is monthly recovery management.
              </p>
            </div>

            <FooterColumn title="Products" links={productLinks} />
            <FooterColumn title="Resources" links={resourceLinks} />
            <div>
              <FooterColumn title="Company" links={companyLinks} />
              <div className="mt-8">
                <FooterColumn title="Legal" links={legalLinks} />
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-700 pt-8 md:flex-row">
            <div className="flex flex-col gap-2 text-sm tracking-tight text-gray-500 md:flex-row md:items-center md:gap-5">
              <span>© {new Date().getFullYear()} Margin. All rights reserved.</span>
              <a href="mailto:support@margin-finance.com" className="w-fit transition-colors duration-200 hover:text-blue-400 focus-visible:text-blue-400 focus-visible:outline-none">
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
                  className="inline-flex items-center justify-center text-gray-400 transition-colors duration-200 hover:text-blue-400 focus-visible:text-blue-400 focus-visible:outline-none"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const BrandFooter = React.memo(FooterComponent);
export default BrandFooter;
