import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { tenantRoute } from '@/lib/routes';

interface FinancialClosureProvider {
  key: 'gmail' | 'outlook' | 'gdrive' | 'dropbox' | 'quickbooks' | 'xero';
  name: string;
  icon: string;
}

const FINANCIAL_CLOSURE_PROVIDERS: FinancialClosureProvider[] = [
  { key: 'xero', name: 'Xero', icon: '/xero.png' },
  { key: 'quickbooks', name: 'QuickBooks', icon: '/quickbooks.png' },
  { key: 'dropbox', name: 'Dropbox', icon: '/Dropbox_Icon.svg.png' },
  { key: 'gdrive', name: 'Google Drive', icon: '/gd.png' },
  { key: 'outlook', name: 'Outlook', icon: '/outlookicon.webp' },
  { key: 'gmail', name: 'Gmail', icon: '/gmailicon.png' },
];

const GMAIL_PROVIDER = FINANCIAL_CLOSURE_PROVIDERS[FINANCIAL_CLOSURE_PROVIDERS.length - 1];
const EXPANDED_PROVIDERS = FINANCIAL_CLOSURE_PROVIDERS.slice(0, -1);

/**
 * Frontend-only source chooser for the authenticated Margin platform.
 * It never initiates OAuth or creates a provider connection. A selection simply
 * takes the seller to Financial Evidence, where the existing source controls own
 * connection and provider-state truth.
 */
export function FinancialClosureChooser() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const isFinancialEvidencePage = location.pathname.includes('/integrations-hub');
  const isPlatformRoute = location.pathname.startsWith('/app/');

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  if (!isPlatformRoute || isFinancialEvidencePage) {
    return null;
  }

  const handleProviderSelect = (provider: FinancialClosureProvider) => {
    setIsOpen(false);
    navigate(tenantRoute(tenantSlug, `/integrations-hub?financialClosure=${provider.key}`));
  };

  return (
    <div
      ref={rootRef}
      className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6"
      aria-label="Financial Closure source chooser"
    >
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-end gap-2"
            aria-label="Available Financial Closure sources"
          >
            <div className="mb-0.5 max-w-[188px] rounded-[10px] border border-[#DCE8EE] bg-white px-3 py-2 shadow-[0_8px_24px_rgba(24,32,38,0.08)]">
              <p className="font-lora text-[13px] font-normal tracking-tight text-[#182026]">Financial Closure</p>
              <p className="mt-0.5 text-[10px] leading-4 text-[#66737F]">Choose a record source to manage.</p>
            </div>
            {EXPANDED_PROVIDERS.map((provider, index) => (
              <motion.button
                key={provider.key}
                type="button"
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{
                  duration: 0.16,
                  delay: index * 0.035,
                  ease: [0.23, 1, 0.32, 1],
                }}
                onClick={() => handleProviderSelect(provider)}
                className="group flex h-11 w-11 items-center justify-center rounded-[12px] border border-[#DCE8EE] bg-white shadow-[0_5px_14px_rgba(24,32,38,0.08)] transition-[transform,background-color,border-color] duration-150 hover:border-[#B9CEDA] hover:bg-[#F8FBFD] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/30"
                aria-label={`Open ${provider.name} in Financial Evidence`}
                title={provider.name}
              >
                <img src={provider.icon} alt="" className="h-5 w-5 object-contain" />
              </motion.button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="group relative flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#C9D9E1] bg-white shadow-[0_8px_22px_rgba(24,32,38,0.12)] transition-[transform,background-color,border-color] duration-150 hover:border-[#AFC5D1] hover:bg-[#F8FBFD] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/30"
        aria-label={isOpen ? 'Close Financial Closure source chooser' : 'Open Financial Closure source chooser'}
        aria-expanded={isOpen}
        aria-controls="financial-closure-sources"
        title="Financial Closure"
      >
        <AnimatePresence initial={false} mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -35, scale: 0.85 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 35, scale: 0.85 }}
              transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
            >
              <X className="h-5 w-5 text-[#4D5B66]" strokeWidth={1.8} />
            </motion.span>
          ) : (
            <motion.img
              key="gmail"
              src={GMAIL_PROVIDER.icon}
              alt=""
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
              className="h-5.5 w-5.5 object-contain"
            />
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
