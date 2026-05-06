import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    Gift,
    Search,
    Briefcase,
    BadgePercent,
    CircleDollarSign,
    ShieldAlert,
    FileText,
    BoxSelect,
    ArrowLeft,
    Menu
} from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductsMegaMenu } from '@/components/landing/ProductsMegaMenu';
import { ChevronDown, Truck, TrendingUp, ShieldCheck, BarChart3, Activity, Layers } from 'lucide-react';

type PublicNavbarProps = {
    variant?: 'dark' | 'light';
};

export const PublicNavbar = ({ variant = 'dark' }: PublicNavbarProps) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isLight = variant === 'light';
    const mobileMenuItemClass = isLight
        ? "flex items-center rounded-[14px] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#66737F] transition-colors hover:bg-[#F3F6F8] hover:text-[#182026]"
        : "flex items-center rounded-[6px] px-3 py-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/70 transition-colors hover:bg-white/5 hover:text-white";
    const desktopNavLinkClass = isLight
        ? "hidden md:inline-flex h-9 items-center rounded-full border border-transparent px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#66737F] transition-all hover:bg-[#F3F6F8] hover:text-[#182026]"
        : "hidden md:inline-flex h-9 items-center rounded-[6px] border border-transparent px-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/76 transition-all hover:border-white/8 hover:bg-white/[0.04] hover:text-white";
    const desktopActionClass = isLight
        ? "hidden md:inline-flex h-9 items-center rounded-full border border-[#DCE8EE] bg-white px-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#25313A] transition-all hover:bg-[#F3F6F8]"
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
    }, [mobileMenuOpen]);

    useEffect(() => {
        if (!isLight) return;

        document.documentElement.classList.add('public-light-scrollbar');
        return () => {
            document.documentElement.classList.remove('public-light-scrollbar');
        };
    }, [isLight]);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-transparent bg-transparent">
            <div className="container mx-auto px-3 py-3 md:px-6 md:py-5">
                <div className={cn(
                    "relative flex items-center justify-between gap-3 transition-colors md:gap-5 md:px-4 md:py-3 lg:px-6",
                    isLight
                        ? "rounded-[22px] border border-[#DCE8EE] bg-white/94 px-4 py-3 shadow-[0_18px_60px_rgba(37,49,58,0.08)] backdrop-blur-2xl"
                        : "rounded-[8px] border border-white/10 bg-[#080808]/92 px-3 py-2.5 shadow-[0_18px_48px_rgba(0,0,0,0.42)] [backdrop-filter:blur(32px)_saturate(180%)]"
                )}>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className={cn(
                                "inline-flex items-center gap-2 px-1 py-1 transition-colors md:gap-2.5 md:px-2 md:py-1.5",
                                isLight ? "rounded-full hover:bg-[#F3F6F8]" : "rounded-[6px] hover:bg-white/5"
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
                        <div className="hidden lg:block">
                            <ProductsMegaMenu variant={variant} />
                        </div>

                        <Link to="/pricing" className={desktopNavLinkClass}>
                            Pricing
                        </Link>
                        <Link to="/research" className={desktopNavLinkClass}>
                            Research
                        </Link>
                        <Link to="/developer-api" className={desktopNavLinkClass}>
                            API
                        </Link>
                        <Link to="/about-margin" className={desktopNavLinkClass}>
                            About
                        </Link>
                        <Link to="/sales" className={desktopNavLinkClass}>
                            Enterprise
                        </Link>

                    </div>

                    <nav className="hidden md:flex items-center gap-2">
                        <Link to="/login" className={desktopActionClass}>
                            Login
                        </Link>
                        <Link
                            to="/waitlist"
                            className={`${desktopActionClass} gap-2 px-6`}>
                            Join Waitlist <ArrowRight className="h-3 w-3" />
                        </Link>
                    </nav>

                    <button
                        type="button"
                        className={cn(
                            "absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 flex-col items-center justify-center gap-1.5 px-2 transition-colors focus-visible:outline-none md:hidden",
                            isLight
                                ? "rounded-full border border-[#DCE8EE] bg-white text-[#25313A] hover:bg-[#F3F6F8]"
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
                                    ? "rounded-[22px] border border-[#DCE8EE] bg-white shadow-[0_18px_48px_rgba(37,49,58,0.14)]"
                                    : "rounded-[8px] border border-white/10 bg-[#080808]/96 shadow-[0_18px_48px_rgba(0,0,0,0.42)] [backdrop-filter:blur(32px)_saturate(180%)]"
                            )}>
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
                                    to="/developer-api"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={mobileMenuItemClass}>
                                    API
                                </Link>
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
                                            {/* Recovery Coverage */}
                                            <div className="space-y-3">
                                                <h5 className={cn("pl-2 text-[9px] font-bold uppercase tracking-tight", isLight ? "text-[#8A99A4]" : "text-white/20")}>Recovery Coverage</h5>
                                                <div className="grid gap-1">
                                                    <MobileNavItem variant={variant} icon={Search} title="Inbound Shipments" description="Short receives and receiving drift" />
                                                    <MobileNavItem variant={variant} icon={ShieldCheck} title="Lost or Damaged Inventory" description="Recovery across FBA states" />
                                                    <MobileNavItem variant={variant} icon={BoxSelect} title="Fee Discrepancies" description="Overcharges, reversals, and gaps" />
                                                    <MobileNavItem variant={variant} icon={ArrowLeft} title="Refund Without Return" description="Refunds not matched to real return outcome" />
                                                    <MobileNavItem variant={variant} icon={Truck} title="Transfer & Operations" description="Inter-fulfillment discrepancies" />
                                                    <MobileNavItem variant={variant} icon={BarChart3} title="Recovery Workflow" description="Valid cases, evidence, filing, payout" highlight />
                                                </div>
                                            </div>

                                            {/* Evidence & Control */}
                                            <div className="space-y-3">
                                                <h5 className={cn("pl-2 text-[9px] font-bold uppercase tracking-tight", isLight ? "text-[#8A99A4]" : "text-white/20")}>Evidence & Control</h5>
                                                <div className="grid gap-1">
                                                    <MobileNavItem variant={variant} icon={Layers} title="Evidence Matching" description="Connect support to the right case" />
                                                    <MobileNavItem variant={variant} icon={Briefcase} title="Filing Readiness" description="Hold weak or duplicate issues back" />
                                                    <MobileNavItem variant={variant} icon={BadgePercent} title="Recovery Tracking" description="Approval and payout visibility" />
                                                    <MobileNavItem variant={variant} icon={FileText} title="Connected Sources" description="Email, storage, and uploaded proof" />
                                                </div>
                                            </div>

                                            {/* By Seller Type */}
                                            <div className="space-y-3">
                                                <h5 className={cn("pl-2 text-[9px] font-bold uppercase tracking-tight", isLight ? "text-[#8A99A4]" : "text-white/20")}>By Seller Type</h5>
                                                <div className="grid gap-1">
                                                    <MobileNavItem variant={variant} icon={Activity} title="Emerging Sellers" description="Read-only audit and guided recovery" />
                                                    <MobileNavItem variant={variant} icon={TrendingUp} title="Growth Sellers" description="Ongoing recovery coverage at scale" />
                                                    <MobileNavItem variant={variant} icon={Layers} title="Enterprise Teams" description="Multi-workspace recovery operations" />
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>

                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={mobileMenuItemClass}>
                                    Login
                                </Link>
                                <Link
                                    to="/sales"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={mobileMenuItemClass}>
                                    Enterprise
                                </Link>
                                <Link
                                    to="/waitlist"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "px-4 py-3 text-center text-[10px] font-sans font-bold uppercase tracking-tight",
                                        isLight
                                            ? "rounded-full bg-[#0B74DE] text-white"
                                            : "rounded-[6px] bg-white text-black"
                                    )}>
                                    Join Waitlist
                                </Link>
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
