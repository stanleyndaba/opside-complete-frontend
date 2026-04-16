import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Send, CheckCircle2, Building2, DollarSign, Users, Calendar, ShieldCheck, Globe, Clock, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';
import { BrandFooter } from '@/components/layout/BrandFooter';

export default function Sales() {
    usePageMeta({
        title: 'Institutional Inquiry | Margin',
        description: 'Connect with the Margin team for high-velocity seller solutions and strategic inventory arbitrage.',
        url: `${SITE_META.url}/sales`,
        image: SITE_META.image
    });

    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        company: '',
        revenue: '',
        sellerId: '',
        message: ''
    });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.email || !form.company) {
            toast({
                title: 'Required fields missing',
                description: 'Please fill in your name, email, and company.',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));

        const subject = encodeURIComponent(`[Enterprise Inquiry] ${form.company} - ${form.revenue || 'Volume TBD'}`);
        const body = encodeURIComponent(
            `ENTERPRISE SALES INQUIRY\n${'='.repeat(40)}\n\nName: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company}\nAnnual Revenue: ${form.revenue || 'Not specified'}\nAmazon Seller ID: ${form.sellerId || 'Not provided'}\n\n${'='.repeat(40)}\nMESSAGE:\n\n${form.message || 'No additional message provided.'}\n\n${'='.repeat(40)}\nSent via Margin Enterprise Sales Form`
        );
        window.open(`mailto:support@margin-finance.com?subject=${subject}&body=${body}`, '_blank');

        setIsSubmitting(false);
        setIsSubmitted(true);
        toast({
            title: 'Inquiry prepared',
            description: 'Your email client has been opened. Send the email to connect with us.',
        });
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-sky-400/30 selection:text-white font-sans">
            {/* Technical Background Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-full h-[800px] bg-[radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.06),transparent_70%)]" />
                <div className="absolute bottom-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_20%_100%,rgba(99,102,241,0.05),transparent_70%)]" />
            </div>

            {/* Persistent Technical Navbar */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-[#050505]/80 backdrop-blur-md border-white/10 py-4' : 'bg-transparent border-transparent py-6'}`}>
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src="/logoimagetwo.png" alt="Margin" className="h-4 sm:h-5 w-auto invert brightness-0" />
                        <span className="brand-wordmark font-merriweather text-white text-lg tracking-tight">Margin</span>
                    </Link>
                    <div className="flex items-center gap-8">
                        <Link to="/contact">
                            <Button variant="outline" className="h-9 rounded-none border-white/20 bg-transparent text-white hover:bg-white hover:text-black font-mono text-[10px] uppercase tracking-tight transition-all">
                                General Support
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
                        <div className="inline-flex items-center gap-4 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                            <span className="text-[10px] font-bold text-sky-400 font-sans tracking-tight uppercase">Institutional Access</span>
                            <div className="h-3 w-[1px] bg-white/10" />
                            <span className="text-[10px] font-bold text-white/40 font-sans tracking-tight uppercase">High Volume Gateway</span>
                        </div>

                        <h1 className="text-4xl md:text-7xl font-light leading-[1.1] tracking-tight text-white">
                            Scale Autonomously <br className="hidden sm:block" />
                            with Margin Enterprise
                        </h1>

                        <p className="max-w-2xl text-lg md:text-xl text-white/60 font-sans tracking-tight leading-relaxed">
                            For High-Velocity Accounts processing $1M+ in monthly GMV.
                            Secure priority infrastructure, dedicated forensic auditors,
                            and custom API integrations.
                        </p>
                    </motion.div>
                </section>

                {/* The Qualifier Section */}
                <section className="bg-white/[0.02] border-y border-white/5 py-16 md:py-32 mb-16 md:mb-32">
                    <div className="container mx-auto px-6 max-w-5xl">
                        <div className="grid md:grid-cols-2 gap-12 md:gap-24 font-sans tracking-tight">
                            <div>
                                <h2 className="text-[11px] font-bold text-white/40 font-mono tracking-tight uppercase mb-12">System Requirement</h2>
                                <h3 className="text-3xl font-light tracking-tight mb-8 text-white">
                                    Is Your Infrastructure <br />
                                    Ready for Scale?
                                </h3>
                                <p className="text-white/60 leading-relaxed text-sm sm:text-base">
                                    To ensure dedicated forensic validation and priority API rate limits,
                                    Enterprise access is strictly optimized for high-complexity operations.
                                    Standard private label accounts are recommended for the Core Plan's autonomous speed.
                                </p>
                            </div>

                            <div className="space-y-12">
                                {[
                                    {
                                        title: "Aggregators & Agencies",
                                        desc: "Multi-account architecture requiring unified ledger reconciliation."
                                    },
                                    {
                                        title: "High-Velocity Catalogues",
                                        desc: ">500 SKUs with rapid restock density and complex SKU-level drift."
                                    },
                                    {
                                        title: "Cross-Border Logistics",
                                        desc: "Managing multi-marketplace inventory splits (US, UK, EU, JP)."
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6 pb-8 border-b border-white/5 last:border-0">
                                        <div className="text-[10px] font-bold text-white/20 mt-1 font-sans tracking-tight">{`0${i + 1}`}</div>
                                        <div className="space-y-2">
                                            <div className="font-bold text-white/90 uppercase tracking-tight text-sm font-sans">{item.title}</div>
                                            <div className="text-sm text-white/40 font-sans tracking-tight">{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Intelligence Section (Features) */}
                <section className="container mx-auto px-6 max-w-5xl mb-24 md:mb-40">
                    <div className="grid md:grid-cols-3 gap-12 md:gap-16">
                        {[
                            {
                                title: "Forensic Ledger",
                                label: "Audit Intelligence",
                                desc: "Line-by-line evidence for every discrepancy. Categorized by Inbound Variance, Warehouse Damage, and Unreturned Refunds."
                            },
                            {
                                title: "Priority Node Sync",
                                label: "Infrastructure",
                                desc: "Dedicated server resources and isolated BullMQ workers ensure your audit cycles complete in minutes, not hours."
                            },
                            {
                                title: "Supply Chain Intel",
                                label: "Inventory Logic",
                                desc: "We identify the operational leaks in your supply chain that cause the loss, preventing future drift at the source."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="space-y-6">
                                <div className="h-[1px] w-12 bg-sky-400/60" />
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-white/40 font-sans tracking-tight uppercase">{feature.label}</div>
                                    <h4 className="text-xl font-bold tracking-tight text-white font-sans">{feature.title}</h4>
                                </div>
                                <p className="text-sm text-white/50 leading-loose">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Application Section (The Form) */}
                <section className="container mx-auto px-6 max-w-5xl" id="application">
                    <div className="grid lg:grid-cols-12 gap-16 items-start">
                        {/* Note on manual validation */}
                        <div className="lg:col-span-12 space-y-10 mb-12">
                            <div className="pt-10 border-t border-white/10 text-center max-w-2xl mx-auto">
                                <p className="text-2xl font-light tracking-tight text-white leading-relaxed mb-6 italic">
                                    "We personally review every institutional inquiry. If you're managing serious scale, our team will build a dedicated audit engine for your SKU architecture."
                                </p>
                                <p className="text-sm font-bold text-white/40 uppercase tracking-tight font-sans">
                                    — Founder & CEO, Margin
                                </p>
                            </div>
                        </div>

                        {/* Inquiry Form */}
                        <div className="lg:col-start-3 lg:col-span-8">
                            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.018)_20%,rgba(8,8,9,0.98)_100%)] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.36)] sm:p-10">
                                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                <div className="pointer-events-none absolute -right-12 top-10 h-28 w-28 rounded-full bg-white/5 blur-3xl" />
                                {isSubmitted ? (
                                    <div className="text-center py-20">
                                        <div className="w-20 h-20 rounded-full bg-sky-400/10 flex items-center justify-center mx-auto mb-8">
                                            <CheckCircle2 className="h-10 w-10 text-sky-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white font-sans tracking-tight mb-3">
                                            Application Prepared
                                        </h2>
                                        <p className="text-white/40 font-sans mb-10 max-w-xs mx-auto text-sm leading-relaxed tracking-tight">
                                            Your enterprise profile has been formatted for priority review. Finalize transmission via your secure email client.
                                        </p>
                                            <Button
                                                onClick={() => setIsSubmitted(false)}
                                                variant="outline"
                                                className="h-12 rounded-[18px] border-white/10 bg-transparent px-6 text-[12px] font-medium tracking-tight text-white/80 hover:bg-white/[0.04] hover:text-white">
                                                New Transmission
                                            </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-10">
                                        <div className="space-y-2">
                                            <h3 className="text-[10px] font-medium text-sky-400 font-sans tracking-tight uppercase">
                                                Institutional Briefing Request // V.02
                                            </h3>
                                            <p className="text-xs text-white/40 font-sans tracking-tight">Priority Node Allocation: 3/Week</p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-medium text-white/42 font-mono tracking-tight uppercase block">
                                                    Lead Strategist
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={form.name}
                                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                    placeholder="FULL NAME"
                                                    className="h-14 rounded-[20px] border-white/10 bg-white/[0.02] px-4 text-[14px] tracking-tight text-white placeholder:text-white/18 focus:border-white/18"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-medium text-white/42 font-mono tracking-tight uppercase block">
                                                    Corporate Email
                                                </label>
                                                <Input
                                                    type="email"
                                                    value={form.email}
                                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                    placeholder="PARTNER@DOMAIN.COM"
                                                    className="h-14 rounded-[20px] border-white/10 bg-white/[0.02] px-4 text-[14px] tracking-tight text-white placeholder:text-white/18 focus:border-white/18"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[11px] font-medium text-white/42 font-mono tracking-tight uppercase block">
                                                Institutional Entity
                                            </label>
                                            <Input
                                                type="text"
                                                value={form.company}
                                                onChange={(e) => setForm({ ...form, company: e.target.value })}
                                                placeholder="LEGAL ENTITY NAME"
                                                className="h-14 rounded-[20px] border-white/10 bg-white/[0.02] px-4 text-[14px] tracking-tight text-white placeholder:text-white/18 focus:border-white/18"
                                                required
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-medium text-white/42 font-mono tracking-tight uppercase block">
                                                    Annual Portfolio GMV
                                                </label>
                                                <Select value={form.revenue} onValueChange={(value) => setForm({ ...form, revenue: value })}>
                                                    <SelectTrigger className="h-14 rounded-[20px] border-white/10 bg-white/[0.02] px-4 text-[13px] tracking-tight text-white focus:border-white/18">
                                                        <SelectValue placeholder="SELECT RANGE" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-[16px] border-white/10 bg-[#050505] text-white text-xs font-sans">
                                                        <SelectItem value="$1M - $5M">$1M - $5M</SelectItem>
                                                        <SelectItem value="$5M - $10M">$5M - $10M</SelectItem>
                                                        <SelectItem value="$10M - $25M">$10M - $25M</SelectItem>
                                                        <SelectItem value="$25M - $50M">$25M - $50M</SelectItem>
                                                        <SelectItem value="$50M+">$50M+</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-medium text-white/42 font-mono tracking-tight uppercase block">
                                                    Seller Hash Identifier
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={form.sellerId}
                                                    onChange={(e) => setForm({ ...form, sellerId: e.target.value })}
                                                    placeholder="AMAZON SELLER ID (OPTIONAL)"
                                                    className="h-14 rounded-[20px] border-white/10 bg-white/[0.02] px-4 text-[14px] tracking-tight text-white placeholder:text-white/18 focus:border-white/18"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[11px] font-medium text-white/42 font-mono tracking-tight uppercase block">
                                                Technical Requirements
                                            </label>
                                            <Textarea
                                                value={form.message}
                                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                                placeholder="DESCRIBE DATA ARCHITECTURE AND SPECIFIC DRIFT CHALLENGES..."
                                                className="min-h-[120px] rounded-[22px] border-white/10 bg-white/[0.02] px-4 py-4 text-[14px] tracking-tight text-white placeholder:text-white/18 focus:border-white/18 resize-none"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full h-12 rounded-[18px] border border-white/10 bg-white text-black text-[13px] font-medium font-sans tracking-tight uppercase transition-all hover:bg-white/92 hover:text-black">
                                            {isSubmitting ? (
                                                <>Processing Application...</>
                                            ) : (
                                                <>
                                                    Request Institutional Briefing
                                                    <ArrowRight className="h-3.5 w-3.5 ml-3" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <BrandFooter />
        </div>
    );
}
