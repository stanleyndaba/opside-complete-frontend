import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Briefcase,
    BadgePercent,
    FileText,
    Menu,
    ShieldCheck,
    BarChart3,
    Activity,
    Layers,
    Globe2,
    Network,
    TrendingUp
} from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion';
import { ProductsMegaMenu } from '@/components/landing/ProductsMegaMenu';
import { ApisMegaMenu, apiMenuItems, ApiTile } from '@/components/landing/ApisMegaMenu';

type PublicNavbarProps = {
    variant?: 'dark' | 'light';
    ctaLabel?: string;
    ctaTo?: string;
};

export const PublicNavbar = ({ variant = 'dark', ctaLabel = 'JOIN WAITLIST', ctaTo = '/waitlist' }: PublicNavbarProps) => {
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
                                // @ts-ignore - fetchpriority is valid but react types might lag
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
                            <ProductsMegaMenu variant={effectiveVariant} />
                        </div>
                        <div className="hidden lg:block">
                            <ApisMegaMenu variant={effectiveVariant} />
                        </div>
                        <Link to="/pricing" className={desktopNavLinkClass}>
                            Pricing
                        </Link>
                        <Link to="/research" className={desktopNavLinkClass}>
                            Research
                        </Link>
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
                        {ctaTo.startsWith('#') ? (
                            <a href={ctaTo} className={`${desktopActionClass} gap-2 px-6`}>
                                {ctaLabel} <ArrowRight className="h-3 w-3" />
                            </a>
                        ) : (
                            <Link
                                to={ctaTo}
                                className={`${desktopActionClass} gap-2 px-6`}>
                                {ctaLabel} <ArrowRight className="h-3 w-3" />
                            </Link>
                        )}
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
                                    <AccordionItem value="products" className="border-none">
                                        <AccordionTrigger className={cn(
                                            mobileMenuItemClass,
                                            isLight
                                                ? "justify-between border-none text-[#66737F] outline-none hover:no-underline data-[state=open]:bg-[#F3F6F8] data-[state=open]:text-[#182026]"
                                                : "justify-between border-none text-white/60 outline-none hover:no-underline data-[state=open]:bg-white/5 data-[state=open]:text-white"
                                        )}>
                                            Products
                                        </AccordionTrigger>
                                        <AccordionContent className="overflow-visible border-none px-1 pb-6 pt-2 space-y-8">
                                            {/* Recovery Infrastructure */}
                                            <div className="space-y-3">
                                                <h5 className={cn("pl-2 text-[9px] font-bold uppercase tracking-tight", isLight ? "text-[#8A99A4]" : "text-white/20")}>Recovery Infrastructure</h5>
                                                <div className="grid gap-1">
                                                    <MobileNavItem variant={effectiveVariant} icon={Activity} title="Discrepancy Engine" description="Continuous monitoring of inbound, inventory, and fee states." />
                                                    <MobileNavItem variant={effectiveVariant} icon={Layers} title="Evidence Vault" description="Automated collection of BOLs, invoices, and shipment logs." />
                                                    <MobileNavItem variant={effectiveVariant} icon={FileText} title="Surgical Case Builder" description="Policy-aligned claim construction for maximum approval rates." />
                                                    <MobileNavItem variant={effectiveVariant} icon={ShieldCheck} title="Dispute Automation" description="Autonomous handling of lowball offers and rejections." highlight />
                                                </div>
                                            </div>

                                            {/* Operational Control */}
                                            <div className="space-y-3">
                                                <h5 className={cn("pl-2 text-[9px] font-bold uppercase tracking-tight", isLight ? "text-[#8A99A4]" : "text-white/20")}>Operational Control</h5>
                                                <div className="grid gap-1">
                                                    <MobileNavItem variant={effectiveVariant} icon={BarChart3} title="Recovery Intelligence" description="Real-time visibility into claim status, payouts, and ROI." />
                                                    <MobileNavItem variant={effectiveVariant} icon={Briefcase} title="Audit Transparency" description="Full logs of every agent action and Amazon interaction." />
                                                    <MobileNavItem variant={effectiveVariant} icon={Globe2} title="Global Sync" description="Unified recovery operations across all international marketplaces." />
                                                    <MobileNavItem variant={effectiveVariant} icon={Network} title="API & Integrations" description="Connect recovery data to your existing ERP or warehouse stack." />
                                                </div>
                                            </div>

                                            {/* Solutions */}
                                            <div className="space-y-3">
                                                <h5 className={cn("pl-2 text-[9px] font-bold uppercase tracking-tight", isLight ? "text-[#8A99A4]" : "text-white/20")}>Solutions</h5>
                                                <div className="grid gap-1">
                                                    <MobileNavItem variant={effectiveVariant} icon={BadgePercent} title="Founding 500" description="Exclusive infrastructure access for early believers." />
                                                    <MobileNavItem variant={effectiveVariant} icon={TrendingUp} title="Enterprise Ops" description="Multi-workspace recovery for aggregators and 8-figure brands." />
                                                    <MobileNavItem variant={effectiveVariant} icon={Briefcase} title="Managed Recovery" description="White-glove oversight for complex, high-volume accounts." highlight />
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="api" className="border-none">
                                        <AccordionTrigger className={cn(
                                            mobileMenuItemClass,
                                            isLight
                                                ? "justify-between border-none text-[#66737F] outline-none hover:no-underline data-[state=open]:bg-[#F3F6F8] data-[state=open]:text-[#182026]"
                                                : "justify-between border-none text-white/60 outline-none hover:no-underline data-[state=open]:bg-white/5 data-[state=open]:text-white"
                                        )}>
                                            API
                                        </AccordionTrigger>
                                        <AccordionContent className="overflow-visible border-none px-1 pb-6 pt-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                {apiMenuItems.map((item, index) => (
                                                    <ApiTile
                                                        key={item.title}
                                                        variant={effectiveVariant}
                                                        icon={item.icon}
                                                        title={item.title}
                                                        index={index + 1}
                                                        highlight={index === 2 || index === 5}
                                                    />
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                                <Link
                                    to="/pricing"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={mobileMenuItemClass}>
                                    Pricing
                                </Link>
                                <Link
                                    to="/about-margin"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={mobileMenuItemClass}>
                                    About
                                </Link>
                                <Link
                                    to="/research"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={mobileMenuItemClass}>
                                    Research
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
                                {ctaTo.startsWith('#') ? (
                                    <a
                                        href={ctaTo}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "px-4 py-3 text-center text-[10px] font-sans font-bold uppercase tracking-tight",
                                            isLight
                                                ? "rounded-[6px] bg-[#0B74DE] text-white"
                                                : "rounded-[6px] bg-white text-black"
                                        )}>
                                        {ctaLabel}
                                    </a>
                                ) : (
                                    <Link
                                        to={ctaTo}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "px-4 py-3 text-center text-[10px] font-sans font-bold uppercase tracking-tight",
                                            isLight
                                                ? "rounded-[6px] bg-[#0B74DE] text-white"
                                                : "rounded-[6px] bg-white text-black"
                                        )}>
                                        {ctaLabel}
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};

function MobileNavItem({
    icon: Icon,
    title,
    description,
    highlight = false,
    variant = 'dark'
}: {
    icon: any,
    title: string,
    description?: string,
    highlight?: boolean,
    variant?: 'dark' | 'light'
}) {
    const isLight = variant === 'light';

    return (
        <div
            className={cn(
                "flex flex-col gap-1 p-3 rounded-lg border cursor-default",
                isLight
                    ? highlight
                        ? "border-[#BFD8EA] bg-[#EAF4FF]"
                        : "border-transparent hover:border-[#DCE8EE] hover:bg-[#F8FAFC]"
                    : highlight
                        ? "bg-emerald-500/[0.03] border-emerald-500/10"
                        : "border-transparent"
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "p-1.5 rounded-lg border border-transparent shrink-0",
                    isLight
                        ? highlight
                            ? "bg-white text-[#0B74DE] border-[#BFD8EA]"
                            : "bg-[#EEF4F6] text-[#0B74DE] border-[#DCE8EE]"
                        : highlight
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-white/5 text-white/40"
                )}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <span className={cn(
                        "text-[10px] font-bold tracking-tight block truncate",
                        isLight
                            ? highlight
                                ? "text-[#0B74DE]"
                                : "text-[#182026]"
                            : highlight
                                ? "text-emerald-400"
                                : "text-white/90"
                    )}>
                        {title}
                    </span>
                    {description && (
                        <p className={cn("text-[8px] mt-0.5 leading-none truncate", isLight ? "text-[#66737F]" : "text-white/20")}>
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
