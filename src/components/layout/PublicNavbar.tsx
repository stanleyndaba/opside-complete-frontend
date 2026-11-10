import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
} from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion';
import { ProductsMegaMenu, productMenuGroups, ProductServiceItem } from '@/components/landing/ProductsMegaMenu';
import { GoogleMark } from '@/components/GoogleMark';
import { ApisMegaMenu, apiMenuGroups, ApiServiceItem } from '@/components/landing/ApisMegaMenu';

type PublicNavbarProps = {
    variant?: 'dark' | 'light';
    ctaLabel?: string;
    ctaTo?: string;
    wide?: boolean;
};

export const PublicNavbar = ({ variant = 'dark' }: PublicNavbarProps) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isOverDarkSurface, setIsOverDarkSurface] = useState(false);
    const effectiveVariant = variant === 'light' && isOverDarkSurface ? 'dark' : variant;
    const isLight = effectiveVariant === 'light';
    
    // Using Margin Design Tokens
    const mobileMenuItemClass = isLight
        ? "flex items-center rounded-[6px] px-3 py-3 text-[10px] font-sans font-bold uppercase tracking-tight text-[var(--margin-text-secondary)] transition-colors hover:bg-[var(--margin-surface-alt)] hover:text-[var(--margin-text-primary)]"
        : "flex items-center rounded-[6px] px-3 py-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/70 transition-colors hover:bg-white/5 hover:text-white";
    const desktopNavLinkClass = isLight
        ? "hidden md:inline-flex h-10 items-center rounded-[8px] border border-transparent px-3.5 text-[13px] font-sans font-medium tracking-[-0.01em] text-[#52616C] transition-[background-color,color,border-color,transform] duration-150 hover:bg-[#F4F6F7] hover:text-[var(--margin-text-primary)] active:scale-[0.98]"
        : "hidden md:inline-flex h-10 items-center rounded-[8px] border border-transparent px-3.5 text-[13px] font-sans font-medium tracking-[-0.01em] text-white/85 transition-[background-color,color,border-color,transform] duration-150 hover:border-white/10 hover:bg-white/[0.06] hover:text-white active:scale-[0.98]";

    // Close mobile menu on resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        if (!isLight) return;

        document.documentElement.classList.add('public-light-scrollbar');
        return () => {
            document.documentElement.classList.remove('public-light-scrollbar');
        };
    }, [isLight]);

    useEffect(() => {
        if (variant !== 'light') return;

        const updateNavbarTheme = () => {
            const themeProbeY = window.innerWidth >= 768 ? 76 : 56;
            const darkSections = Array.from(document.querySelectorAll<HTMLElement>('[data-navbar-theme="dark"]'));

            setIsOverDarkSurface(
                darkSections.some((section) => {
                    const rect = section.getBoundingClientRect();
                    return rect.top <= themeProbeY && rect.bottom >= themeProbeY;
                })
            );
        };

        updateNavbarTheme();
        window.addEventListener('scroll', updateNavbarTheme, { passive: true });
        window.addEventListener('resize', updateNavbarTheme);

        return () => {
            window.removeEventListener('scroll', updateNavbarTheme);
            window.removeEventListener('resize', updateNavbarTheme);
        };
    }, [variant]);

    return (
        <header
            className={cn(
                "landing-navbar-google-sans fixed left-0 right-0 top-0 z-50 border-transparent bg-transparent transition-colors",
            )}
        >
            <div className="w-full px-0 py-0">
                    <div className={cn(
                        "relative grid min-h-[56px] grid-cols-[1fr_auto] items-center gap-3 transition-all duration-300 md:min-h-[68px] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-6 md:px-5 md:py-3 lg:flex lg:px-7",
                        isLight
                            ? "rounded-none bg-white/[0.94] px-4 py-2.5 shadow-[0_12px_42px_rgba(37,49,58,0.10)] backdrop-blur-xl"
                            : "rounded-none bg-white/[0.08] px-4 py-2.5 shadow-[0_18px_55px_rgba(0,0,0,0.24)] backdrop-blur-xl saturate-[160%]"
                    )}>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className={cn(
                                "inline-flex items-center gap-2.5 px-1 py-1 transition-colors md:gap-3 md:px-2 md:py-1.5 lg:absolute lg:left-1/2 lg:top-1/2 lg:z-10 lg:-translate-x-1/2 lg:-translate-y-1/2",
                                isLight ? "rounded-[6px] hover:bg-[#F3F6F8]" : "rounded-[6px] hover:bg-white/5"
                            )}
                        >
                            <img
                                src="/logoimagetwo.png"
                                alt="Margin"
                                width="20"
                                height="20"
                                fetchPriority="high"
                                className={cn("h-4 w-auto object-contain md:h-5", isLight ? "" : "invert brightness-0")}
                            />
                            <span className={cn("brand-wordmark font-merriweather text-base tracking-tight md:text-lg", isLight ? "text-[var(--margin-text-primary)]" : "text-white")}>
                                Margin
                            </span>
                        </Link>
                    </div>

                    <nav className="col-start-2 hidden items-center justify-center gap-1 md:flex lg:order-first lg:flex-1 lg:justify-start lg:gap-0.5">
                        <div className="hidden lg:block">
                            <ApisMegaMenu variant={effectiveVariant} />
                        </div>
                        <div className="hidden lg:block">
                            <ProductsMegaMenu variant={effectiveVariant} />
                        </div>
                        <Link to="/pricing" className={desktopNavLinkClass}>
                            Pricing
                        </Link>
                        <Link to="/security" className={desktopNavLinkClass}>
                            Security
                        </Link>
                        <Link to="/sales" className={desktopNavLinkClass}>
                                Enterprise
                        </Link>
                        <Link to="/consumer-recovery" className={desktopNavLinkClass}>
                            B2C Recovery
                        </Link>
                    </nav>

                    <div className="col-start-2 flex items-center justify-end gap-2 sm:gap-3 md:col-start-3 md:gap-4 lg:order-last lg:flex-1">
                                <Link
                                    to="/login"
                                    className={cn(
                                        "text-[13px] font-medium transition-colors md:text-[14px]",
                                        isLight ? "text-[var(--margin-text-secondary)] hover:text-[var(--margin-text-primary)]" : "text-white/70 hover:text-white"
                                    )}
                                >
                            Log in
                        </Link>
                        <Link
                            to="/login?mode=signup"
                                    className={cn(
                                        "flex h-9 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-semibold shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-[background-color,transform,box-shadow] duration-150 hover:shadow-[0_6px_18px_rgba(0,0,0,0.12)] active:scale-[0.98] md:h-10 md:px-5 md:text-[14px]",
                                        isLight
                                            ? "bg-[var(--margin-surface-alt)] text-[var(--margin-text-primary)] hover:bg-[var(--margin-border)]"
                                            : "bg-white text-black hover:bg-white/90"
                            )}
                        >
                            <GoogleMark className="h-3.5 w-3.5" />
                            Sign up
                        </Link>
                        <button
                            type="button"
                            className={cn(
                                "flex items-center justify-center transition-colors focus-visible:outline-none md:hidden",
                                isLight ? "text-[#25313A]" : "text-white/80"
                            )}
                            aria-label="Toggle menu"
                            aria-expanded={mobileMenuOpen}
                            onClick={() => setMobileMenuOpen((prev) => !prev)}>
                            <span aria-hidden="true" className="flex h-[18px] w-[20px] flex-col justify-center gap-[5px]">
                                <span className="block h-px w-full bg-current" />
                                <span className="block h-px w-full bg-current" />
                            </span>
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                            className="fixed inset-0 z-[60] md:hidden">
                            <div className="mobile-menu-panel flex h-[100dvh] flex-col overflow-y-auto bg-white text-[#182026] shadow-[0_24px_80px_rgba(22,28,34,0.16)]">
                                <div className="flex min-h-[76px] shrink-0 items-center justify-between bg-white text-[#17212B] shadow-[0_4px_18px_rgba(37,49,58,0.10)]">
                                    <button type="button" onClick={() => setMobileMenuOpen(false)} className="inline-flex h-[76px] min-w-[132px] items-center justify-center rounded-br-[28px] px-7 text-[12px] font-sans font-medium text-[#52616C] transition-colors hover:text-[#17212B]">Close</button>
                                    <Link to="/" onClick={() => setMobileMenuOpen(false)} className="absolute left-1/2 inline-flex -translate-x-1/2 items-center gap-2 text-[#182026]">
                                        <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto object-contain" />
                                        <span className="brand-wordmark font-merriweather text-[17px] tracking-tight">Margin</span>
                                    </Link>
                                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="px-5 text-[12px] font-sans font-medium text-[#52616C] transition-colors hover:text-[#17212B]">Log in</Link>
                                </div>
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="teams" className="border-none">
                                        <AccordionTrigger className={cn(
                                            "flex items-center rounded-none border-b border-white/15 px-5 py-4 text-[13px] font-sans font-medium tracking-normal transition-colors",
                                            "justify-between text-white outline-none hover:no-underline hover:text-white data-[state=open]:bg-white/10"
                                        )}>
                                            For Teams
                                        </AccordionTrigger>
                                        <AccordionContent className="overflow-visible border-none px-3 pb-5 pt-2 space-y-3">
                                            {productMenuGroups.map((group) => (
                                                    <div key={group.label} className="space-y-2 pt-3">
                                                        <h5 className="px-2 text-[11px] font-sans font-medium tracking-normal text-white/60">
                                                            {group.label}
                                                        </h5>
                                                        <div className="grid gap-1">
                                                            {group.items.map((item) => (
                                                                <ProductServiceItem
                                                                    key={item.title}
                                                                    variant="light"
                                                                    icon={item.icon}
                                                                    title={item.title}
                                                                    description={item.description}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="api" className="border-none">
                                        <AccordionTrigger className={cn(
                                            "flex items-center rounded-none border-b border-white/15 px-5 py-4 text-[13px] font-sans font-medium tracking-normal transition-colors",
                                            "justify-between text-white outline-none hover:no-underline hover:text-white data-[state=open]:bg-white/10"
                                        )}>
                                            Workflows
                                        </AccordionTrigger>
                                        <AccordionContent className="overflow-visible border-none px-3 pb-5 pt-2">
                                            <div className="space-y-6">
                                                {apiMenuGroups.map((group) => (
                                                    <div key={group.label} className="space-y-2 pt-3">
                                                        <h5 className="px-2 text-[11px] font-sans font-medium tracking-normal text-white/60">
                                                            {group.label}
                                                        </h5>
                                                        <div className="grid gap-1">
                                                            {group.items.map((item) => (
                                                                <ApiServiceItem
                                                                    key={item.title}
                                                                    variant="light"
                                                                    icon={item.icon}
                                                                    title={item.title}
                                                                    description={item.description}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                                <Link
                                    to="/pricing"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center rounded-none border-b border-white/15 px-5 py-4 text-[13px] font-sans font-medium tracking-normal text-white transition-colors hover:bg-white/10 hover:text-white">
                                    Pricing
                                </Link>
                                <Link
                                    to="/security"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center rounded-none border-b border-white/15 px-5 py-4 text-[13px] font-sans font-medium tracking-normal text-white transition-colors hover:bg-white/10 hover:text-white">
                                    Security
                                </Link>
                                <Link
                                    to="/sales"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center rounded-none border-b border-white/15 px-5 py-4 text-[13px] font-sans font-medium tracking-normal text-white transition-colors hover:bg-white/10 hover:text-white">
                                    Enterprise
                                </Link>
                                <Link
                                    to="/about"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center rounded-none border-b border-white/15 px-5 py-4 text-[13px] font-sans font-medium tracking-normal text-white transition-colors hover:bg-white/10 hover:text-white">
                                    Company
                                </Link>
                                <Link
                                    to="/consumer-recovery"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center rounded-none border-b border-white/15 px-5 py-4 text-[13px] font-sans font-medium tracking-normal text-white transition-colors hover:bg-white/10 hover:text-white">
                                    B2C Recovery
                                </Link>
                                <div className="mt-auto px-5 pb-3 pt-7">
                                    <p className="font-sans text-[13px] font-medium leading-5 text-white/80">Start with a controlled financial review.</p>
                                    <p className="mt-1 max-w-[30rem] font-sans text-[12px] leading-5 text-white/55">
                                        See what the records establish before deciding what work is justified.
                                    </p>
                                </div>
                                <div className="grid gap-2 px-5 pb-5 pt-2">
                                    <Link
                                        to="/audit-start"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="landing-action-cta relative flex min-h-[46px] w-full items-center justify-center rounded-full bg-[#F05A3C] px-12 py-3 text-center font-sans text-[13px] font-bold tracking-normal text-white shadow-[0_8px_20px_rgba(240,90,60,0.24)] transition-[background-color,box-shadow] duration-200 hover:bg-[#D9472D] hover:shadow-[0_12px_26px_rgba(240,90,60,0.32)]">
                                        Send records for review <span aria-hidden="true" className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#30343B] shadow-[0_3px_8px_rgba(33,43,55,0.16)]"><ChevronRight className="h-4 w-4" strokeWidth={2.2} /></span>
                                    </Link>
                                    <Link
                                        to="/contact"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex min-h-[46px] w-full items-center justify-center gap-3 rounded-full border border-white/25 bg-white/10 px-3 py-3 text-center font-sans text-[13px] font-bold tracking-normal text-white transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/15">
                                        Talk to Margin <ChevronRight aria-hidden="true" className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};
