import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu,
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

export const PublicNavbar = ({ variant = 'dark', wide = false }: PublicNavbarProps) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isOverDarkSurface, setIsOverDarkSurface] = useState(false);
    const effectiveVariant = variant === 'light' && isOverDarkSurface ? 'dark' : variant;
    const isLight = effectiveVariant === 'light';
    
    // Using Margin Design Tokens
    const mobileMenuItemClass = isLight
        ? "flex items-center rounded-[6px] px-3 py-3 text-[10px] font-sans font-bold uppercase tracking-tight text-[var(--margin-text-secondary)] transition-colors hover:bg-[var(--margin-surface-alt)] hover:text-[var(--margin-text-primary)]"
        : "flex items-center rounded-[6px] px-3 py-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/70 transition-colors hover:bg-white/5 hover:text-white";
    const desktopNavLinkClass = isLight
        ? "hidden md:inline-flex h-9 items-center rounded-[6px] border border-transparent px-3 text-[11px] font-sans font-bold uppercase tracking-tight text-[var(--margin-text-secondary)] transition-[background-color,color,border-color] duration-150 hover:bg-[var(--margin-surface-alt)] hover:text-[var(--margin-text-primary)]"
        : "hidden md:inline-flex h-9 items-center rounded-[6px] border border-transparent px-3 text-[11px] font-sans font-bold uppercase tracking-tight text-white/80 transition-[background-color,color,border-color] duration-150 hover:border-white/8 hover:bg-white/[0.04] hover:text-white";

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
                "fixed left-0 right-0 top-0 z-50 border-transparent bg-transparent transition-colors",
            )}
        >
            <div className={cn(wide ? "mx-auto w-full max-w-[1280px] px-3 py-3 md:px-6 md:py-5 lg:px-10 2xl:px-12" : "container mx-auto px-3 py-3 md:px-6 md:py-5")}>
                    <div className={cn(
                        "relative flex items-center justify-between gap-3 transition-all duration-300 md:gap-5 md:px-4 md:py-3 lg:px-6",
                        isLight
                            ? "rounded-[8px] bg-white/96 px-3 py-2.5 shadow-[0_18px_60px_rgba(37,49,58,0.08)] backdrop-blur-md"
                            : "rounded-[8px] bg-[#080808]/88 px-3 py-2.5 shadow-[0_18px_48px_rgba(0,0,0,0.42)] backdrop-blur-xl saturate-[180%]"
                    )}>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className={cn(
                                "inline-flex items-center gap-2 px-1 py-1 transition-colors md:gap-2.5 md:px-2 md:py-1.5",
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

                    <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
                        <div className="hidden lg:block">
                            <ApisMegaMenu variant={effectiveVariant} />
                        </div>
                        <div className="hidden lg:block">
                            <ProductsMegaMenu variant={effectiveVariant} />
                        </div>
                        <Link to="/pricing" className={desktopNavLinkClass}>
                            Pricing
                        </Link>
                        <Link to="/sales" className={desktopNavLinkClass}>
                            ENTERPRISE
                        </Link>
                    </nav>

                    <div className="flex items-center gap-3 sm:gap-4">
                        <Link
                            to="/login"
                            className={cn(
                                "text-[13px] font-medium transition-colors",
                                isLight ? "text-[var(--margin-text-secondary)] hover:text-[var(--margin-text-primary)]" : "text-white/70 hover:text-white"
                            )}
                        >
                            Log in
                        </Link>
                        <Link
                            to="/login?mode=signup"
                            className={cn(
                                "flex h-[32px] items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors",
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
                            <Menu className="h-[18px] w-[18px]" strokeWidth={1.5} />
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
                            className="relative z-50 mt-2 md:hidden">
                            <div className={cn(
                                "flex max-h-[calc(100vh-92px)] flex-col gap-1 overflow-y-auto p-3",
                                "rounded-[8px] border border-[#DCE8EE] bg-white shadow-[0_18px_48px_rgba(37,49,58,0.22)]"
                            )}>
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="api" className="border-none">
                                        <AccordionTrigger className={cn(
                                            "flex items-center rounded-[6px] px-3 py-3 text-[11px] font-sans font-bold uppercase tracking-tight transition-colors",
                                            "justify-between border-none text-[var(--margin-text-secondary)] outline-none hover:no-underline hover:text-[var(--margin-text-primary)] data-[state=open]:bg-[var(--margin-surface-alt)]"
                                        )}>
                                            Workflows
                                        </AccordionTrigger>
                                        <AccordionContent className="overflow-visible border-none px-1 pb-6 pt-2">
                                            <div className="space-y-6">
                                                {apiMenuGroups.map((group) => (
                                                    <div key={group.label} className="space-y-3">
                                                        <h5 className="pl-2 text-[11px] font-lora font-medium text-[#94A3B8]">
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
                                    <AccordionItem value="teams" className="border-none">
                                        <AccordionTrigger className={cn(
                                            "flex items-center rounded-[6px] px-3 py-3 text-[11px] font-sans font-bold uppercase tracking-tight transition-colors",
                                            "justify-between border-none text-[var(--margin-text-secondary)] outline-none hover:no-underline hover:text-[var(--margin-text-primary)] data-[state=open]:bg-[var(--margin-surface-alt)]"
                                        )}>
                                            For Teams
                                        </AccordionTrigger>
                                        <AccordionContent className="overflow-visible border-none px-1 pb-6 pt-2 space-y-8">
                                            {productMenuGroups.map((group) => (
                                                    <div key={group.label} className="space-y-3">
                                                        <h5 className="pl-2 text-[11px] font-lora font-medium text-[#94A3B8]">
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
                                </Accordion>
                                <Link
                                    to="/pricing"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center rounded-[6px] px-3 py-3 text-[11px] font-sans font-bold uppercase tracking-tight text-[var(--margin-text-secondary)] transition-colors hover:bg-[var(--margin-surface-alt)] hover:text-[var(--margin-text-primary)]">
                                    Pricing
                                </Link>
                                <Link
                                    to="/sales"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center rounded-[6px] px-3 py-3 text-[11px] font-sans font-bold uppercase tracking-tight text-[var(--margin-text-secondary)] transition-colors hover:bg-[var(--margin-surface-alt)] hover:text-[var(--margin-text-primary)]">
                                    Enterprise
                                </Link>
                                <Link
                                    to="/contact"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="mt-2 flex min-h-[48px] items-center justify-center rounded-[8px] bg-[var(--margin-blue)] px-4 py-3 text-[11px] font-sans font-bold uppercase tracking-tight text-white shadow-[0_12px_30px_rgba(23,92,211,0.28)] transition-[background-color,box-shadow] duration-200 hover:bg-[var(--margin-blue-hover)] hover:shadow-[0_16px_36px_rgba(23,92,211,0.34)]">
                                    Contact the Team
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};

