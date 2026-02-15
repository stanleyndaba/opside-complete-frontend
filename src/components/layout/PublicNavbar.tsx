import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    ArrowLeft
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
            <div className="container mx-auto px-6 py-5">
                <div className="flex items-center justify-between gap-6 px-6 py-4 border border-white/10 bg-[#050505]/40 supports-[backdrop-filter]:bg-[#050505]/40 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_25px_60px_rgba(0,0,0,0.4)] transition-colors relative group">
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/20" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-white/20" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-white/20" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/20" />

                    <div className="flex items-center gap-3">
                        <Link to="/" className="inline-flex items-center gap-2.5 px-3 py-1.5 transition-colors hover:bg-white/5">
                            <img
                                src="/logoimagetwo.png"
                                alt="Margin"
                                width="20"
                                height="20"
                                // @ts-ignore - fetchpriority is valid but react types might lag
                                fetchPriority="high"
                                className="h-5 w-auto object-contain invert brightness-0"
                            />
                            <span className="font-merriweather font-bold text-white text-lg tracking-tight">Margin</span>
                        </Link>
                        <span className="hidden md:inline text-gray-300">|</span>
                        <Link
                            to="/ultra-beta"
                            className="hidden md:flex items-center gap-2 group px-3 py-1.5 transition-colors hover:bg-white/5 border border-transparent hover:border-white/10">
                            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Ultra Beta</span>
                            <span className="px-1.5 py-0.5 bg-emerald-500 text-[8px] font-bold text-white rounded-none leading-none">NEW</span>
                        </Link>

                        <div className="hidden lg:block">
                            <ProductsMegaMenu />
                        </div>

                        <Link
                            to="/about"
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-white/5 border border-transparent hover:border-white/10">
                            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">About Us</span>
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger className="hidden md:flex items-center gap-1.5 px-3 py-1.5 transition-colors hover:bg-white/5 border border-transparent hover:border-white/10 text-[10px] font-mono font-bold text-white uppercase tracking-widest outline-none">
                                Finance <ChevronDown className="h-3 w-3 opacity-30" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-[#050505]/95 border-white/10 backdrop-blur-xl rounded-none p-1 min-w-[160px]">
                                <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white cursor-pointer rounded-none px-3 py-2">
                                    <Link to="/pricing" className="flex items-center gap-2 w-full">
                                        <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Pricing</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white cursor-pointer rounded-none px-3 py-2">
                                    <Link to="/contact" className="flex items-center gap-2 w-full">
                                        <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Talk to Sales</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <nav className="hidden md:flex items-center gap-4">
                        <Link
                            to="/sales"
                            className="h-9 px-5 text-[10px] font-bold text-black bg-white hover:bg-emerald-500 hover:text-white transition-all inline-flex items-center uppercase tracking-[0.2em] font-mono"
                            style={{ borderRadius: '0px' }}>
                            Enterprise
                        </Link>
                        <Link
                            to="/waitlist"
                            className="h-9 px-6 text-[10px] font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all inline-flex items-center gap-2 tracking-[0.3em] uppercase font-mono"
                            style={{ borderRadius: '0px' }}>
                            Join Waitlist <ArrowRight className="h-3 w-3" />
                        </Link>
                    </nav>

                    <button
                        type="button"
                        className="md:hidden flex flex-col items-end gap-1.5 px-3 py-2 transition-colors hover:bg-white/5 focus-visible:outline-none"
                        aria-label="Toggle menu"
                        aria-expanded={mobileMenuOpen}
                        onClick={() => setMobileMenuOpen((prev) => !prev)}>
                        <span className="block h-[1px] w-6 bg-white rounded-full" />
                        <span className="block h-[1px] w-5 bg-white rounded-full" />
                        <span className="block h-[1px] w-4 bg-white rounded-full" />
                    </button>
                </div>

                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mt-4 md:hidden relative z-50">
                            <div className="flex flex-col gap-2 rounded-[20px] border border-white/10 bg-[#0a0a0a]/95 [backdrop-filter:blur(32px)_saturate(180%)] p-4 shadow-2xl max-h-[calc(100vh-120px)] overflow-y-auto">
                                <Link
                                    to="/ultra-beta"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span>Ultra Beta</span>
                                        <span className="px-1.5 py-0.5 bg-emerald-500 text-[9px] font-bold text-white rounded-full leading-none">NEW</span>
                                    </div>
                                </Link>
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="finance" className="border-none">
                                        <AccordionTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors hover:no-underline font-montserrat">
                                            Finance
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2 pb-2 px-2">
                                            <div className="grid gap-1">
                                                <Link
                                                    to="/pricing"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className="px-3 py-2 text-sm text-white hover:text-white transition-colors font-montserrat">
                                                    Pricing
                                                </Link>
                                                <Link
                                                    to="/contact"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className="px-3 py-2 text-sm text-white hover:text-white transition-colors font-montserrat">
                                                    Talk to Sales
                                                </Link>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>

                                <Link
                                    to="/about"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors font-montserrat">
                                    About Us
                                </Link>
                                <Link
                                    to="/sales"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors font-montserrat">
                                    Enterprise
                                </Link>
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="products" className="border-none">
                                        <AccordionTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors hover:no-underline font-montserrat">
                                            Products
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2 pb-6 px-1 max-h-[60vh] overflow-y-auto space-y-8 scrollbar-hide border-none">
                                            {/* Audit Vectors */}
                                            <div className="space-y-3">
                                                <h5 className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] pl-2">Audit Vectors</h5>
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
                                                <h5 className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] pl-2">Governance & Scale</h5>
                                                <div className="grid gap-1">
                                                    <MobileNavItem icon={Search} title="Inbound Fee Governance" description="Line-by-line proof" />
                                                    <MobileNavItem icon={Briefcase} title="Agency Portfolio Manager" description="Multi-account reconciliation" />
                                                    <MobileNavItem icon={BadgePercent} title="Commission Rate Audit" description="Detect overcharges & errors" />
                                                    <MobileNavItem icon={FileText} title="Auto-Invoice Sync" description="Gmail integration for evidence" />
                                                </div>
                                            </div>

                                            {/* By Profile */}
                                            <div className="space-y-3">
                                                <h5 className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] pl-2">By Profile</h5>
                                                <div className="grid gap-1">
                                                    <MobileNavItem icon={TrendingUp} title="Growth ($0 - $1M)" description="Automated recovery for emerging brands" />
                                                    <MobileNavItem icon={Zap} title="High Volume ($1M - $10M)" description="Deep-dive forensic audit for scale" />
                                                    <MobileNavItem icon={ShieldAlert} title="Institutional ($10M+)" description="Aggregator & PE Infrastructure" />
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                                <Link
                                    to="/waitlist"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="mt-2 rounded-lg py-3 px-4 bg-white text-black text-[13px] font-bold text-center tracking-widest uppercase font-montserrat">
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
