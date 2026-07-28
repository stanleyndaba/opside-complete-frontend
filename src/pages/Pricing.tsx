import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, ShieldCheck, Zap, BarChart3, Users } from 'lucide-react';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';
import { PublicNavbar } from '@/components/layout/PublicNavbar';

const Pricing = () => {
    usePageMeta({
        title: 'Transparent Software Pricing | Amazon Recovery Platform',
        description: 'Margin is Amazon seller software with outcome-linked platform pricing. Amazon pays sellers directly, and Margin invoices software fees after verified recoveries are reconciled in the platform.',
        url: `${SITE_META.url}/pricing`,
    });

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 selection:text-white">
            {/* Technical Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            <PublicNavbar />

            <main className="relative z-10 pt-40 pb-24">
                <div className="container mx-auto px-6 max-w-5xl">
                    {/* Pricing Matrix - Redesigned to Split Layout */}
                    <div className="grid lg:grid-cols-2 gap-24 items-start mb-32">
                        {/* Left Side: Strategic Context */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <span className="text-[10px] font-bold text-white/30 font-mono tracking-[0.4em] uppercase">
                                    Software Pricing
                                </span>
                                <h1 className="text-4xl md:text-6xl font-merriweather font-bold leading-tight tracking-tight">
                                    Transparent <br />
                                    Software Pricing
                                </h1>
                            </div>
                            <p className="text-lg text-white/30 font-montserrat leading-relaxed max-w-lg">
                                Margin is a seller software platform with verified-outcome pricing. Amazon pays your seller account directly, and Margin invoices software fees only after those outcomes are verified in-platform.
                            </p>
                        </div>

                        {/* Right Side: Pricing Nodes */}
                        <div className="space-y-0">
                            {[
                                {
                                    id: "01",
                                    title: "Workspace",
                                    cost: "Included",
                                    color: "text-blue-500",
                                    desc: "Continuous software access for audit monitoring, workflow visibility, and recovery tracking across your Amazon data."
                                },
                                {
                                    id: "02",
                                    title: "Priority Pass",
                                    cost: "$99 Credit",
                                    color: "text-amber-500",
                                    desc: "Optional prepaid platform credit for an expanded historical audit window and faster review queue access."
                                },
                                {
                                    id: "03",
                                    title: "Outcome-Linked Billing",
                                    cost: "Up to 20%",
                                    color: "text-emerald-500",
                                    desc: "Platform fees are billed on verified recoveries reconciled in Margin. Amazon never pays Margin; sellers are paid directly and invoiced separately."
                                }
                            ].map((item, i) => (
                                <div key={i} className="group border-t border-white/10 py-10 first:border-0 hover:bg-white/[0.01] transition-all duration-300">
                                    <div className="flex gap-8 md:gap-12">
                                        <span className={`text-[10px] font-mono font-bold mt-1.5 transition-colors duration-300 ${item.id === "01" ? 'group-hover:text-blue-500' : item.id === "02" ? 'group-hover:text-amber-500' : 'group-hover:text-emerald-500'} text-white/20`}>
                                            {item.id}
                                        </span>
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-white font-montserrat uppercase tracking-widest">
                                                    {item.title}
                                                </h3>
                                                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${item.color}`}>
                                                    {item.cost}
                                                </span>
                                            </div>
                                            <p className="text-white/40 text-[13px] md:text-sm font-montserrat leading-relaxed font-medium max-w-xl">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* Final CTA */}
                    <div className="text-center py-24 border-t border-white/5">
                        <h2 className="text-3xl md:text-4xl font-merriweather font-bold mb-12 leading-relaxed">
                            Transparent software billing. <br />
                            Begin your seller audit workspace today.
                        </h2>
                        <div className="flex flex-col items-center gap-4">
                            <Link to="/contact">
                                <Button className="h-16 px-12 bg-white text-black hover:bg-white/90 rounded-none font-bold text-xs uppercase tracking-[0.2em] transition-all">
                                    Start Platform Audit
                                </Button>
                            </Link>
                            <p className="text-[10px] font-bold text-white/20 font-mono tracking-widest uppercase">
                                No Credit Card Required for Initial Workspace Setup
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
