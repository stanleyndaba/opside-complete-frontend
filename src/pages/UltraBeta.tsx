import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const UltraBeta = () => {
    usePageMeta({
        title: 'Margin Ultra (Beta) | Institutional Inventory Arbitrage',
        description: 'Engineered for high-velocity FBA portfolios managing >2,000 transactions/month. Beyond simple reimbursement—we map inventory drift at the SKU level.',
        url: `${SITE_META.url}/ultra-beta`,
    });

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 selection:text-white">
            {/* Technical Background Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-full h-[800px] bg-[radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.05),transparent_70%)]" />
                <div className="absolute bottom-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_20%_100%,rgba(59,130,246,0.03),transparent_70%)]" />
            </div>

            {/* Persistent Technical Navbar */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-[#050505]/80 backdrop-blur-md border-white/10 py-4' : 'bg-transparent border-transparent py-6'}`}>
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto invert brightness-0" />
                        <span className="text-sm font-bold tracking-widest uppercase font-mono text-white/90">Ultra Node</span>
                    </Link>
                    <div className="flex items-center gap-8">
                        <Link to="/contact">
                            <Button variant="outline" className="h-9 rounded-none border-white/20 bg-transparent text-white hover:bg-white hover:text-black font-mono text-[10px] uppercase tracking-widest transition-all">
                                Request Briefing
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="relative z-10 pt-32 pb-24">
                {/* Hero Section */}
                <section className="container mx-auto px-6 max-w-5xl mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-4 px-3 py-1 bg-white/5 border border-white/10 rounded-sm">
                            <span className="text-[10px] font-bold text-emerald-500 font-mono tracking-widest uppercase">Limited Beta</span>
                            <div className="h-3 w-[1px] bg-white/10" />
                            <span className="text-[10px] font-bold text-white/60 font-mono tracking-widest uppercase">4/25 Seats Remaining</span>
                        </div>

                        <h1 className="text-4xl md:text-7xl font-merriweather font-bold leading-tight tracking-tight">
                            Institutional <br />
                            Inventory Arbitrage
                        </h1>

                        <p className="max-w-2xl text-lg md:text-xl text-white/60 font-montserrat leading-relaxed">
                            High-frequency auditing for &gt;2,000 tx/mo portfolios. We convert SKU-level inventory drift into liquidity.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-6 pt-8">
                            <Button
                                onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSeXmAX8v7qLQD-e0N-5nPpfbnoPvK5L0RIxZvnAMABKanFI6A/viewform', '_blank')}
                                className="w-full sm:w-auto h-14 px-10 bg-white text-black hover:bg-white/90 rounded-none font-bold text-xs uppercase tracking-[0.2em] transition-all"
                            >
                                Request Access to Beta
                            </Button>
                            <span className="text-[10px] font-bold text-white/30 font-mono tracking-widest uppercase">
                                Manual Onboarding Restricted to 3 Partners / Week
                            </span>
                        </div>
                    </motion.div>
                </section>

                {/* The Qualifier Section */}
                <section className="bg-white/[0.02] border-y border-white/5 py-32 mb-32">
                    <div className="container mx-auto px-6 max-w-5xl">
                        <div className="grid md:grid-cols-2 gap-24">
                            <div>
                                <h2 className="text-[11px] font-bold text-white/40 font-mono tracking-[0.3em] uppercase mb-12">System Requirement</h2>
                                <h3 className="text-3xl font-merriweather font-bold mb-8">
                                    Is Your Infrastructure <br />
                                    Ready for Ultra?
                                </h3>
                                <p className="text-white/60 leading-relaxed font-montserrat">
                                    To ensure the fastest audit speeds, the Ultra Beta is currently limited to high-complexity operations.
                                    If you manage a standard private label account, the Core Plan will offer faster execution for your specific data load.
                                </p>
                            </div>

                            <div className="space-y-12">
                                {[
                                    {
                                        title: "Aggregators & Agencies",
                                        desc: "Managing multi-account architecture and high-frequency reporting cycles."
                                    },
                                    {
                                        title: "High-Velocity Catalogues",
                                        desc: ">500 SKUs with rapid restock cycles and high-volume transaction density."
                                    },
                                    {
                                        title: "Cross-Border Logistics",
                                        desc: "Accounts dealing with multi-marketplace inventory splits across US, UK, and EU."
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6 pb-8 border-b border-white/5 last:border-0">
                                        <div className="text-[10px] font-mono text-white/20 mt-1">{`0${i + 1}`}</div>
                                        <div className="space-y-2">
                                            <div className="font-bold text-white/90 uppercase tracking-tighter">{item.title}</div>
                                            <div className="text-sm text-white/40 font-montserrat">{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Feature Grid */}
                <section className="container mx-auto px-6 max-w-5xl mb-32">
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            {
                                title: "Forensic Ledger",
                                label: "Audit Transparency",
                                desc: "Itemized, line-by-line evidence for every claim. Categorized by Lost Inbound, Warehouse Damaged, and Unreturned Refund. No black boxes. Just proof."
                            },
                            {
                                title: "Redis-Backed Priority Sync",
                                label: "Infrastructure",
                                desc: "Isolated BullMQ workers with priority rate limits on dedicated server resources. Audit cycles that complete in minutes, ensuring zero drift in your financial data."
                            },
                            {
                                title: "Inventory Drift Analysis",
                                label: "Supply Chain Intel",
                                desc: "Stop the bleed. We don't just find lost money; we identify the operational leaks in your supply chain that caused the loss in the first place."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="space-y-6">
                                <div className="h-[1px] w-12 bg-emerald-500/50" />
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-white/30 font-mono tracking-widest uppercase">{feature.label}</div>
                                    <h4 className="text-xl font-bold tracking-tight">{feature.title}</h4>
                                </div>
                                <p className="text-sm text-white/50 leading-loose font-montserrat">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Final CTA */}
                <section className="container mx-auto px-6 max-w-3xl text-center py-24">
                    <div className="space-y-12">
                        <h2 className="text-2xl md:text-3xl font-merriweather font-bold leading-relaxed">
                            Transition to institutional-grade profit recovery. <br />
                            Secure your node in the Ultra Beta.
                        </h2>
                        <div className="flex flex-col items-center gap-6">
                            <Button
                                onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSeXmAX8v7qLQD-e0N-5nPpfbnoPvK5L0RIxZvnAMABKanFI6A/viewform', '_blank')}
                                className="h-16 px-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-none font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-emerald-500/10"
                            >
                                Request Access to Beta
                            </Button>
                            <div className="text-[10px] font-bold text-white/20 font-mono tracking-widest uppercase flex items-center gap-4">
                                <div className="h-[1px] w-8 bg-white/10" />
                                No Credit Card Required
                                <div className="h-[1px] w-8 bg-white/10" />
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <BrandFooter />
        </div>
    );
};

export default UltraBeta;
