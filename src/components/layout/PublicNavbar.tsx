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
import { ProductsMegaMenu } from '@/components/landing/ProductsMegaMenu';

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
                <div className="flex items-center justify-between gap-6 px-6 py-4 rounded-[25px] border border-white/10 bg-[#050505]/20 supports-[backdrop-filter]:bg-[#050505]/20 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_25px_60px_rgba(0,0,0,0.4)] transition-colors">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[16px] transition-colors hover:bg-white/5">
                            <img
                                src="/logoimagetwo.png"
                                alt="Margin"
                                className="h-5 w-auto object-contain invert brightness-0"
                            />
                            <span className="font-montserrat text-white" style={{ fontWeight: 600 }}>Margin</span>
                        </Link>
                        <span className="hidden md:inline text-gray-300">|</span>
                        <Link
                            to="/ultra-beta"
                            className="hidden md:flex items-center gap-2 group px-3 py-1.5 rounded-[16px] transition-colors hover:bg-white/5 border border-transparent hover:border-white/10">
                            <span className="text-[13px] font-montserrat text-white" style={{ fontWeight: 600 }}>Ultra Beta</span>
                            <span className="px-1.5 py-0.5 bg-white text-[9px] font-bold text-black rounded-full leading-none">NEW</span>
                        </Link>
                        <Link
                            to="/pricing"
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[16px] transition-colors hover:bg-white/5 border border-transparent hover:border-white/10">
                            <span className="text-[13px] font-montserrat text-white" style={{ fontWeight: 600 }}>Pricing</span>
                        </Link>
                        <Link
                            to="/about"
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[16px] transition-colors hover:bg-white/5 border border-transparent hover:border-white/10">
                            <span className="text-[13px] font-montserrat text-white" style={{ fontWeight: 600 }}>About Us</span>
                        </Link>
                        <div className="hidden md:block">
                            <ProductsMegaMenu />
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-4">
                        <Link
                            to="/sales"
                            className="h-9 px-5 text-sm font-medium text-black bg-white hover:bg-white/90 transition-colors inline-flex items-center"
                            style={{ borderRadius: '0px' }}>
                            Enterprise
                        </Link>
                        <Link
                            to="/contact"
                            className="h-9 px-4 text-sm font-medium text-white/70 bg-transparent hover:text-white transition-colors inline-flex items-center gap-1.5"
                            style={{ borderRadius: '0px' }}>
                            Talk to Sales <span aria-hidden="true">→</span>
                        </Link>
                    </nav>

                    <button
                        type="button"
                        className="md:hidden flex flex-col items-end gap-1.5 rounded-[16px] border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
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
                                <Link
                                    to="/pricing"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors">
                                    Pricing
                                </Link>
                                <Link
                                    to="/about"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors">
                                    About Us
                                </Link>
                                <Link
                                    to="/sales"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors">
                                    Enterprise
                                </Link>
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="products" className="border-none">
                                        <AccordionTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors hover:no-underline">
                                            Products
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2 pb-4 px-2 max-h-[50vh] overflow-y-auto">
                                            <div className="space-y-6">
                                                {/* Trust & Scale */}
                                                <div className="space-y-3">
                                                    <h5 className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] pl-1">Trust & Scale</h5>
                                                    <div className="grid gap-1">
                                                        <Link to="/products/inbound-fee-governance" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                            <div className="p-1.5 bg-white/5 rounded-lg text-white/60 border border-white/10">
                                                                <Search className="h-3.5 w-3.5" />
                                                            </div>
                                                            <span className="text-[12px] font-medium text-white/80">Inbound Fee Governance</span>
                                                        </Link>
                                                        <Link to="/products/dispute-intelligence" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                            <div className="p-1.5 bg-white/5 rounded-lg text-white/60 border border-white/10">
                                                                <ShieldAlert className="h-3.5 w-3.5" />
                                                            </div>
                                                            <span className="text-[12px] font-medium text-white/80">Dispute Intelligence</span>
                                                        </Link>
                                                    </div>
                                                </div>

                                                {/* Detection & Analysis */}
                                                <div className="space-y-3">
                                                    <h5 className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] pl-1">Detection & Analysis</h5>
                                                    <div className="grid gap-1">
                                                        <Link to="/products/fee-forensics" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                            <div className="p-1.5 bg-white/5 rounded-lg text-white/60 border border-white/10">
                                                                <CircleDollarSign className="h-3.5 w-3.5" />
                                                            </div>
                                                            <span className="text-[12px] font-medium text-white/80">Fee Forensics</span>
                                                        </Link>
                                                        <Link to="/products/removal-analysis" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                            <div className="p-1.5 bg-white/5 rounded-lg text-white/60 border border-white/10">
                                                                <BoxSelect className="h-3.5 w-3.5" />
                                                            </div>
                                                            <span className="text-[12px] font-medium text-white/80">Removal Analysis</span>
                                                        </Link>
                                                        <Link to="/products/evidence-vault" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                            <div className="p-1.5 bg-white/5 rounded-lg text-white/60 border border-white/10">
                                                                <FileText className="h-3.5 w-3.5" />
                                                            </div>
                                                            <span className="text-[12px] font-medium text-white/80">Evidence Vault</span>
                                                        </Link>
                                                    </div>
                                                </div>

                                                {/* Revenue Protection */}
                                                <div className="space-y-3">
                                                    <h5 className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] pl-1">Revenue Protection</h5>
                                                    <div className="grid gap-1">
                                                        <Link to="/products/refund-shield" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                            <div className="p-1.5 bg-white/5 rounded-lg text-white/60 border border-white/10">
                                                                <BadgePercent className="h-3.5 w-3.5" />
                                                            </div>
                                                            <span className="text-[12px] font-medium text-white/80">Refund Shield</span>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                                <Link
                                    to="/contact"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="mt-2 rounded-lg py-3 px-4 bg-white text-black text-sm font-bold text-center">
                                    Talk to Sales
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};
