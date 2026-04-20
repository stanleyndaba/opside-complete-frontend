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

export const PublicNavbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-transparent bg-transparent">
            <div className="container mx-auto px-3 py-3 md:px-6 md:py-5">
                <div className="relative flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-[#050505]/62 px-3 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur-2xl backdrop-saturate-150 transition-colors md:gap-6 md:rounded-none md:bg-[#050505]/40 md:px-6 md:py-4 md:shadow-[0_25px_60px_rgba(0,0,0,0.4)]">
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 hidden w-2 h-2 border-l border-t border-white/20 md:block" />
                    <div className="absolute top-0 right-0 hidden w-2 h-2 border-r border-t border-white/20 md:block" />
                    <div className="absolute bottom-0 left-0 hidden w-2 h-2 border-l border-b border-white/20 md:block" />
                    <div className="absolute bottom-0 right-0 hidden w-2 h-2 border-r border-b border-white/20 md:block" />

                    <div className="flex items-center gap-3">
                        <Link to="/" className="inline-flex items-center gap-2 px-1 py-1 transition-colors hover:bg-white/5 md:gap-2.5 md:px-3 md:py-1.5">
                            <img
                                src="/logoimagetwo.png"
                                alt="Margin"
                                width="20"
                                height="20"
                                // @ts-ignore - fetchpriority is valid but react types might lag
                                fetchPriority="high"
                                className="h-4 w-auto object-contain invert brightness-0 md:h-5"
                            />
                            <span className="brand-wordmark font-merriweather text-base tracking-tight text-white md:text-lg">Margin</span>
                        </Link>
                        <span className="hidden md:inline text-gray-300">|</span>

                        <div className="hidden lg:block">
                            <ProductsMegaMenu />
                        </div>

                        <Link
                            to="/pricing"
                            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 transition-colors hover:bg-white/5 border border-transparent hover:border-white/10 text-[10px] font-sans font-bold text-white uppercase tracking-tight outline-none"
                        >
                            Pricing
                        </Link>
                        <Link
                            to="/about-margin"
                            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 transition-colors hover:bg-white/5 border border-transparent hover:border-white/10 text-[10px] font-sans font-bold text-white uppercase tracking-tight outline-none"
                        >
                            About
                        </Link>
                        <Link
                            to="/sales"
                            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 transition-colors hover:bg-white/5 border border-transparent hover:border-white/10 text-[10px] font-sans font-bold text-white uppercase tracking-tight outline-none"
                        >
                            Enterprise
                        </Link>

                    </div>

                    <nav className="hidden md:flex items-center gap-4">
                        <Link
                            to="/login"
                            className="h-9 px-5 text-[10px] font-light text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all inline-flex items-center uppercase tracking-tight font-sans"
                            style={{ borderRadius: '0px' }}>
                            Login
                        </Link>
                        <Link
                            to="/waitlist"
                            className="h-9 px-6 text-[10px] font-light text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all inline-flex items-center gap-2 tracking-tight uppercase font-sans"
                            style={{ borderRadius: '0px' }}>
                            Join Waitlist <ArrowRight className="h-3 w-3" />
                        </Link>
                    </nav>

                    <button
                        type="button"
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 flex-col items-center justify-center gap-1.5 rounded-[6px] border border-white/10 bg-white/[0.025] px-2 transition-colors hover:bg-white/5 focus-visible:outline-none md:hidden"
                        aria-label="Toggle menu"
                        aria-expanded={mobileMenuOpen}
                        onClick={() => setMobileMenuOpen((prev) => !prev)}>
                        <Menu className="h-4 w-4 text-white" />
                    </button>
                </div>

                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="relative z-50 mt-2 md:hidden">
                            <div className="flex max-h-[calc(100vh-92px)] flex-col gap-1 overflow-y-auto rounded-[8px] border border-white/10 bg-[#080808]/96 p-3 shadow-[0_18px_48px_rgba(0,0,0,0.42)] [backdrop-filter:blur(32px)_saturate(180%)]">
                                <Accordion type="single" collapsible className="w-full">
                                    <Link
                                        to="/pricing"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center rounded-[6px] px-3 py-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                                        Pricing
                                    </Link>
                                    <Link
                                        to="/about-margin"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center rounded-[6px] px-3 py-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                                        About
                                    </Link>

                                    {/* About Us & Enterprise shifted inside for consistent menu feel or kept separate? 
                                        Keeping them as links but merged into the same flow */}

                                    <AccordionItem value="products" className="border-none">
                                        <AccordionTrigger className="flex w-full items-center justify-between rounded-[6px] border-none px-3 py-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 outline-none transition-colors hover:bg-white/5 hover:text-white hover:no-underline">
                                            Products
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2 pb-6 px-1 space-y-8 border-none overflow-visible">
                                            {/* Audit Vectors */}
                                            <div className="space-y-3">
                                                <h5 className="text-[9px] font-bold text-white/20 uppercase tracking-tight pl-2">Audit Vectors</h5>
                                                <div className="grid gap-1">
                                                    <MobileNavItem icon={Search} title="Inbound Variance" description="Reconcile shipping plan/ledger" />
                                                    <MobileNavItem icon={ShieldCheck} title="Inventory Reconciliation" description="Lost & destroyed unit recovery" />
                                                    <MobileNavItem icon={BoxSelect} title="Dimensional Weight Audit" description="Correct Cubiscan errors" />
                                                    <MobileNavItem icon={ArrowLeft} title="Return Logistics" description="Unreturned inventory tracking" />
                                                    <MobileNavItem icon={Truck} title="Transfer & Operations" description="Inter-fulfillment center loss" />
                                                    <MobileNavItem icon={BarChart3} title="Full Forensic Audit" description="Deploy all 26 agents" highlight />
                                                </div>
                                            </div>

                                            {/* Governance */}
                                            <div className="space-y-3">
                                                <h5 className="text-[9px] font-bold text-white/20 uppercase tracking-tight pl-2">Governance & Scale</h5>
                                                <div className="grid gap-1">
                                                    <MobileNavItem icon={Layers} title="Inbound Fee Governance" description="Line-by-line proof" />
                                                    <MobileNavItem icon={Briefcase} title="Agency Portfolio Manager" description="Multi-account reconciliation" />
                                                    <MobileNavItem icon={BadgePercent} title="Commission Rate Audit" description="Detect overcharges & errors" />
                                                    <MobileNavItem icon={FileText} title="Auto-Invoice Sync" description="Gmail integration for evidence" />
                                                </div>
                                            </div>

                                            {/* By Profile */}
                                            <div className="space-y-3">
                                                <h5 className="text-[9px] font-bold text-white/20 uppercase tracking-tight pl-2">By Profile</h5>
                                                <div className="grid gap-1">
                                                    <MobileNavItem icon={Activity} title="Growth ($0 - $1M)" description="Automated recovery for emerging brands" />
                                                    <MobileNavItem icon={TrendingUp} title="High Volume ($1M - $10M)" description="Deep-dive forensic audit for scale" />
                                                    <MobileNavItem icon={Layers} title="Institutional ($10M+)" description="Aggregator & PE Infrastructure" />
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>

                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center rounded-[6px] px-3 py-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                                    Login
                                </Link>
                                <Link
                                    to="/sales"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center rounded-[6px] px-3 py-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                                    Enterprise
                                </Link>
                                <Link
                                    to="/waitlist"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-[6px] bg-white px-4 py-3 text-center text-[10px] font-sans font-bold uppercase tracking-tight text-black">
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
    highlight = false
}: {
    icon: any,
    title: string,
    description?: string,
    highlight?: boolean
}) {
    return (
        <div
            className={cn(
                "flex flex-col gap-1 p-3 rounded-lg border border-transparent cursor-default",
                highlight ? "bg-emerald-500/[0.03] border-emerald-500/10" : ""
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "p-1.5 rounded-lg border border-transparent shrink-0",
                    highlight ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-white/5 text-white/40"
                )}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <span className={cn(
                        "text-[10px] font-bold tracking-tight block truncate",
                        highlight ? "text-emerald-400" : "text-white/90"
                    )}>
                        {title}
                    </span>
                    {description && (
                        <p className="text-[8px] text-white/20 mt-0.5 leading-none truncate">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
