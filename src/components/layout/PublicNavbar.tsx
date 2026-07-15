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
import { ApisMegaMenu, apiMenuGroups, ApiServiceItem } from '@/components/landing/ApisMegaMenu';
import { SolutionsMegaMenu, solutionMenuGroups, SolutionServiceItem } from '@/components/landing/SolutionsMegaMenu';

type PublicNavbarProps = {
    variant?: 'dark' | 'light';
    ctaLabel?: string;
    ctaTo?: string;
};

export const PublicNavbar = ({ variant = 'dark' }: PublicNavbarProps) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isOverDarkSurface, setIsOverDarkSurface] = useState(false);
    const effectiveVariant = variant === 'light' && isOverDarkSurface ? 'dark' : variant;
    const isLight = effectiveVariant === 'light';
    const mobileMenuItemClass = isLight
        ? "flex items-center rounded-[6px] px-3 py-3 text-[10px] font-sans font-bold uppercase tracking-tight text-[#25313A] transition-colors hover:bg-[#F3F6F8] hover:text-[#182026]"
        : "flex items-center rounded-[6px] px-3 py-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/70 transition-colors hover:bg-white/5 hover:text-white";
    const desktopNavLinkClass = isLight
        ? "hidden md:inline-flex h-9 items-center rounded-[6px] border border-transparent px-3 text-[10px] font-sans font-bold uppercase tracking-tight text-[#25313A] transition-all hover:bg-[#F3F6F8] hover:text-[#182026]"
        : "hidden md:inline-flex h-9 items-center rounded-[6px] border border-transparent px-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/80 transition-all hover:border-white/8 hover:bg-white/[0.04] hover:text-white";
    const desktopActionClass = isLight
        ? "hidden md:inline-flex h-9 items-center rounded-[6px] border border-[#DCE8EE] bg-white px-5 text-[10px] font-sans font-bold uppercase tracking-tight text-[#25313A] transition-all hover:bg-[#F3F6F8]"
        : "hidden md:inline-flex h-9 items-center rounded-[6px] border border-white/10 bg-white/[0.03] px-5 text-[10px] font-sans font-bold uppercase tracking-tight text-white transition-all hover:bg-white/[0.07]";

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
        <header className="fixed top-0 left-0 right-0 z-50 border-transparent bg-transparent">
            <div className="container mx-auto px-3 py-3 md:px-6 md:py-5">
                <div className={cn(
                    "relative flex items-center justify-between gap-3 transition-colors md:gap-5 md:px-4 md:py-3 lg:px-6",
                    isLight
                        ? "rounded-[8px] bg-white/88 px-3 py-2.5 shadow-[0_18px_60px_rgba(37,49,58,0.08)] [backdrop-filter:blur(32px)_saturate(180%)]"
                        : "rounded-[8px] bg-[#080808]/88 px-3 py-2.5 shadow-[0_18px_48px_rgba(0,0,0,0.42)] [backdrop-filter:blur(32px)_saturate(180%)]"
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
                            <span className={cn("brand-wordmark font-merriweather text-base tracking-tight md:text-lg", isLight ? "text-[#182026]" : "text-white")}>
                                Margin
                            </span>
                        </Link>
                    </div>

                    <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
                        <div className="hidden lg:block">
                            <ApisMegaMenu variant={effectiveVariant} />
                        </div>
                        <div className="hidden lg:block">
                            <SolutionsMegaMenu variant={effectiveVariant} />
                        </div>
                        <div className="hidden lg:block">
                            <ProductsMegaMenu variant={effectiveVariant} />
                        </div>
                        <Link to="/about-margin" className={desktopNavLinkClass}>
                            About
                        </Link>
                        <Link to="/sales" className={desktopNavLinkClass}>
                            Enterprise
                        </Link>
                    </nav>

                    <nav className="hidden md:flex items-center gap-2">
                        <Link to="/login" className={desktopActionClass}>
                            LOGIN
                        </Link>
                    </nav>

                    <button
                        type="button"
                        className={cn(
                            "absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 flex-col items-center justify-center gap-1.5 px-2 transition-colors focus-visible:outline-none md:hidden",
                            isLight
                                ? "rounded-[6px] border border-[#DCE8EE] bg-white text-[#25313A] hover:bg-[#F3F6F8]"
                                : "rounded-[6px] border border-white/10 bg-white/[0.025] hover:bg-white/5"
                        )}
                        aria-label="Toggle menu"
                        aria-expanded={mobileMenuOpen}
                        onClick={() => setMobileMenuOpen((prev) => !prev)}>
                        <Menu className={cn("h-4 w-4", isLight ? "text-[#25313A]" : "text-white")} />
                    </button>
                </div>

                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="relative z-50 mt-2 md:hidden">
                            <div className={cn(
                                "flex max-h-[calc(100vh-92px)] flex-col gap-1 overflow-y-auto p-3",
                                isLight
                                    ? "rounded-[8px] border border-[#DCE8EE] bg-white shadow-[0_18px_48px_rgba(37,49,58,0.14)]"
                                    : "rounded-[8px] border border-white/10 bg-[#080808]/96 shadow-[0_18px_48px_rgba(0,0,0,0.42)] [backdrop-filter:blur(32px)_saturate(180%)]"
                            )}>
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="api" className="border-none">
                                        <AccordionTrigger className={cn(
                                            mobileMenuItemClass,
                                            isLight
                                                ? "justify-between border-none text-[#66737F] outline-none hover:no-underline data-[state=open]:bg-[#F3F6F8] data-[state=open]:text-[#182026]"
                                                : "justify-between border-none text-white/60 outline-none hover:no-underline data-[state=open]:bg-white/5 data-[state=open]:text-white"
                                        )}>
                                            Agents
                                        </AccordionTrigger>
                                        <AccordionContent className="overflow-visible border-none px-1 pb-6 pt-2">
                                            <div className="space-y-6">
                                                {apiMenuGroups.map((group) => (
                                                    <div key={group.label} className="space-y-3">
                                                        <h5 className={cn("pl-2 text-[9px] font-bold uppercase tracking-tight", isLight ? "text-[#8A99A4]" : "text-white/20")}>
                                                            {group.label}
                                                        </h5>
                                                        <div className="grid gap-1">
                                                            {group.items.map((item) => (
                                                                <ApiServiceItem
                                                                    key={item.title}
                                                                    variant={effectiveVariant}
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
                                    <AccordionItem value="solutions" className="border-none">
                                        <AccordionTrigger className={cn(
                                            mobileMenuItemClass,
                                            isLight
                                                ? "justify-between border-none text-[#66737F] outline-none hover:no-underline data-[state=open]:bg-[#F3F6F8] data-[state=open]:text-[#182026]"
                                                : "justify-between border-none text-white/60 outline-none hover:no-underline data-[state=open]:bg-white/5 data-[state=open]:text-white"
                                        )}>
                                            Solutions
                                        </AccordionTrigger>
                                        <AccordionContent className="overflow-visible border-none px-1 pb-6 pt-2 space-y-3">
                                            <h5 className={cn("pl-2 text-[9px] font-bold uppercase tracking-tight", isLight ? "text-[#8A99A4]" : "text-white/20")}>
                                                E-commerce Marketplaces
                                            </h5>
                                            <div className="grid gap-1">
                                                {solutionMenuGroups[0].items.map((item) => (
                                                    <SolutionServiceItem
                                                        key={item.title}
                                                        variant={effectiveVariant}
                                                        icon={item.icon}
                                                        title={item.title}
                                                        description={item.description}
                                                    />
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="products" className="border-none">
                                        <AccordionTrigger className={cn(
                                            mobileMenuItemClass,
                                            isLight
                                                ? "justify-between border-none text-[#66737F] outline-none hover:no-underline data-[state=open]:bg-[#F3F6F8] data-[state=open]:text-[#182026]"
                                                : "justify-between border-none text-white/60 outline-none hover:no-underline data-[state=open]:bg-white/5 data-[state=open]:text-white"
                                        )}>
                                            Operations
                                        </AccordionTrigger>
                                        <AccordionContent className="overflow-visible border-none px-1 pb-6 pt-2 space-y-8">
                                            {productMenuGroups.map((group) => (
                                                    <div key={group.label} className="space-y-3">
                                                        <h5 className={cn("pl-2 text-[9px] font-bold uppercase tracking-tight", isLight ? "text-[#8A99A4]" : "text-white/20")}>
                                                            {group.label}
                                                        </h5>
                                                        <div className="grid gap-1">
                                                            {group.items.map((item) => (
                                                                <ProductServiceItem
                                                                    key={item.title}
                                                                    variant={effectiveVariant}
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
                                    to="/about-margin"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={mobileMenuItemClass}>
                                    About
                                </Link>
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={mobileMenuItemClass}>
                                    LOGIN
                                </Link>
                                <Link
                                    to="/sales"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={mobileMenuItemClass}>
                                    Enterprise
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};

