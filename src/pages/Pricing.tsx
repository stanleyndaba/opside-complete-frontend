import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, ShieldCheck, Zap, BarChart3, Users } from 'lucide-react';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const Pricing = () => {
    usePageMeta({
        title: 'Transparent Pricing | Performance-Based FBA Recovery',
        description: 'Margin operates on a strictly contingent fee model. No monthly fees, no setup costs. We only get paid when you do.',
        url: `${SITE_META.url}/pricing`,
    });

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 selection:text-white">
            {/* Technical Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto invert brightness-0" />
                        <span className="font-montserrat text-white font-bold tracking-tight">Margin</span>
                    </Link>
                    <Link to="/">
                        <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 gap-2 font-mono text-xs uppercase tracking-widest">
                            <ArrowLeft className="h-3 w-3" />
                            Return
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="relative z-10 pt-40 pb-24">
                <div className="container mx-auto px-6 max-w-5xl">
                    {/* Header Section */}
                    <div className="max-w-3xl mb-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-[1px] w-12 bg-emerald-500/50" />
                            <span className="text-[10px] font-bold text-emerald-500 font-mono tracking-[0.3em] uppercase">
                                Financial Model // Recovery Governance
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-merriweather font-bold leading-tight tracking-tight mb-8">
                            Transparent <br />
                            Pricing Structure
                        </h1>
                        <p className="text-lg md:text-xl text-white/40 font-montserrat leading-relaxed max-w-2xl">
                            Zero Risk. Performance Based. Margin operates on a strictly contingent fee model. We only generate invoices on successful reimbursements credited to your Seller Central account.
                        </p>
                    </div>

                    {/* Pricing Matrix */}
                    <div className="grid md:grid-cols-3 gap-8 mb-32">
                        {[
                            {
                                title: "Audit",
                                cost: "Free",
                                icon: <Zap className="h-5 w-5 text-blue-500" />,
                                desc: "Continuous forensic monitoring of your SP-API ledger nodes."
                            },
                            {
                                title: "Analysis",
                                cost: "Free",
                                icon: <BarChart3 className="h-5 w-5 text-amber-500" />,
                                desc: "Deep forensic mapping of 18 months of inventory drift."
                            },
                            {
                                title: "Recovery Fee",
                                cost: "Contingent",
                                icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
                                desc: "Standard Industry Rate (Performance Only). If you don't get paid, we don't get paid."
                            }
                        ].map((item, i) => (
                            <div key={i} className="group p-8 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-all duration-500">
                                <div className="p-3 bg-white/5 rounded-xl w-fit mb-6 border border-white/5 group-hover:bg-white/10 transition-colors">
                                    {item.icon}
                                </div>
                                <h3 className="text-[11px] font-bold text-white/30 font-mono tracking-[0.2em] uppercase mb-2">{item.title}</h3>
                                <div className="text-3xl font-bold mb-4">{item.cost}</div>
                                <p className="text-sm text-white/40 font-montserrat leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Enterprise / Aggregator Section */}
                    <div className="p-12 bg-white/[0.02] border border-white/5 rounded-[32px] relative overflow-hidden mb-32">
                        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-blue-500/[0.03] blur-[100px] pointer-events-none" />
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <Users className="h-4 w-4 text-white/30" />
                                    <span className="text-[10px] font-bold text-white/30 font-mono tracking-[0.2em] uppercase">Enterprise Layer</span>
                                </div>
                                <h2 className="text-3xl font-merriweather font-bold leading-tight">
                                    Aggregators & <br />
                                    High-Volume Portfolios
                                </h2>
                                <p className="text-white/40 font-montserrat leading-relaxed pr-8">
                                    Managing 10+ accounts? We offer bespoke volume discounts and dedicated forensic audit managers for institutional-grade portfolios.
                                </p>
                                <Link to="/contact">
                                    <Button variant="outline" className="mt-4 rounded-none border-white/20 bg-transparent text-white hover:bg-white hover:text-black font-mono text-[10px] uppercase tracking-widest px-8">
                                        Request Briefing
                                    </Button>
                                </Link>
                            </div>
                            <div className="space-y-4">
                                {[
                                    "Consolidated Multi-Account Invoicing",
                                    "Priority API Rate Limits",
                                    "Custom Frequency Audit Cycles",
                                    "Dedicated Settlement Analysts"
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-4 text-sm text-white/60 font-montserrat">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500/50" />
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Final CTA */}
                    <div className="text-center py-24 border-t border-white/5">
                        <h2 className="text-3xl md:text-4xl font-merriweather font-bold mb-12 leading-relaxed">
                            Zero setup fee. Zero risk. <br />
                            Begin your forensic audit today.
                        </h2>
                        <div className="flex flex-col items-center gap-4">
                            <Link to="/contact">
                                <Button className="h-16 px-12 bg-white text-black hover:bg-white/90 rounded-none font-bold text-xs uppercase tracking-[0.2em] transition-all">
                                    Deploy Audit Engine
                                </Button>
                            </Link>
                            <p className="text-[10px] font-bold text-white/20 font-mono tracking-widest uppercase">
                                No Credit Card Required for Initial Ingestion
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <BrandFooter />
        </div>
    );
};

export default Pricing;
