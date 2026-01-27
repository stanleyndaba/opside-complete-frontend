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
        window.open(`mailto:support@margin.app?subject=${subject}&body=${body}`, '_blank');

        setIsSubmitting(false);
        setIsSubmitted(true);
        toast({
            title: 'Inquiry prepared',
            description: 'Your email client has been opened. Send the email to connect with us.',
        });
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-500/10 selection:text-blue-700">
            {/* Technical Background Overlay - Subtle Light Mode Noise */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-full h-[800px] bg-[radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.03),transparent_70%)]" />
                <div className="absolute bottom-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_20%_100%,rgba(16,185,129,0.02),transparent_70%)]" />
            </div>

            {/* Persistent Technical Navbar */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white/80 backdrop-blur-md border-gray-100 py-4 shadow-sm' : 'bg-transparent border-transparent py-6'}`}>
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto" />
                        <span className="text-sm font-bold tracking-widest uppercase font-mono text-gray-900">Enterprise Node</span>
                    </Link>
                    <div className="flex items-center gap-8">
                        <div className="hidden md:flex items-center gap-6">
                            <span className="text-[10px] font-bold text-gray-400 font-mono tracking-[0.3em] uppercase">Security: Active</span>
                            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <Link to="/contact">
                            <Button variant="outline" className="h-9 rounded-none border-gray-200 bg-white text-gray-900 hover:bg-black hover:text-white font-mono text-[10px] uppercase tracking-widest transition-all">
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
                        <div className="inline-flex items-center gap-4 px-3 py-1 bg-gray-50 border border-gray-100 rounded-sm">
                            <span className="text-[10px] font-bold text-blue-600 font-mono tracking-widest uppercase">Institutional Access</span>
                            <div className="h-3 w-[1px] bg-gray-200" />
                            <span className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase">High Volume Gateway</span>
                        </div>

                        <h1 className="text-4xl md:text-7xl font-merriweather font-bold leading-tight tracking-tight text-gray-900">
                            Institutional <br />
                            Inventory Arbitrage
                        </h1>

                        <p className="max-w-2xl text-lg md:text-xl text-gray-600 font-montserrat leading-relaxed">
                            Engineered for high-velocity FBA portfolios managing &gt;$10M+ annual GMV.
                            Beyond simple reimbursement—we map inventory drift at the SKU level to
                            recover hidden supply chain liquidity.
                        </p>
                    </motion.div>
                </section>

                {/* The Qualifier Section */}
                <section className="bg-gray-50/50 border-y border-gray-100 py-32 mb-32">
                    <div className="container mx-auto px-6 max-w-5xl">
                        <div className="grid md:grid-cols-2 gap-24 font-montserrat">
                            <div>
                                <h2 className="text-[11px] font-bold text-gray-400 font-mono tracking-[0.3em] uppercase mb-12">System Requirement</h2>
                                <h3 className="text-3xl font-merriweather font-bold mb-8 text-gray-900">
                                    Is Your Infrastructure <br />
                                    Ready for Scale?
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
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
                                    <div key={i} className="flex gap-6 pb-8 border-b border-gray-100 last:border-0">
                                        <div className="text-[10px] font-mono text-gray-300 mt-1">{`0${i + 1}`}</div>
                                        <div className="space-y-2">
                                            <div className="font-bold text-gray-900 uppercase tracking-tighter text-sm">{item.title}</div>
                                            <div className="text-sm text-gray-500">{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Intelligence Section (Features) */}
                <section className="container mx-auto px-6 max-w-5xl mb-40">
                    <div className="grid md:grid-cols-3 gap-16">
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
                                <div className="h-[1px] w-12 bg-blue-600/50" />
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase">{feature.label}</div>
                                    <h4 className="text-xl font-bold tracking-tight text-gray-900">{feature.title}</h4>
                                </div>
                                <p className="text-sm text-gray-500 leading-loose">
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
                        <div className="lg:col-span-5 space-y-10 order-2 lg:order-1">
                            <div className="pt-10 border-t border-gray-100">
                                <p className="text-xl font-merriweather text-gray-900 leading-relaxed mb-6 italic">
                                    "We personally review every institutional inquiry. If you're managing serious scale, our team will build a dedicated audit engine for your SKU architecture."
                                </p>
                                <p className="text-sm font-bold text-gray-900 uppercase tracking-widest font-mono">
                                    — Founder & CEO, Margin
                                </p>
                            </div>

                            <div className="p-8 bg-blue-50/50 border border-blue-100 space-y-4">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                                    <span className="text-xs font-bold uppercase tracking-widest font-mono">Secure Transmission</span>
                                </div>
                                <p className="text-xs text-gray-500 font-montserrat leading-relaxed">
                                    Your institutional data is protected by AES-256 encryption. Our auditors are bonded and adhere to strict SOX-compliant data protocols.
                                </p>
                            </div>
                        </div>

                        {/* Redesigned Inquiry Form */}
                        <div className="lg:col-span-7 order-1 lg:order-2">
                            <div className="p-8 md:p-12 bg-white border border-gray-200 shadow-2xl shadow-gray-200/50 relative">
                                {isSubmitted ? (
                                    <div className="text-center py-20">
                                        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-8">
                                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 font-merriweather mb-3">
                                            Application Prepared
                                        </h2>
                                        <p className="text-gray-500 font-montserrat mb-10 max-w-xs mx-auto text-sm leading-relaxed">
                                            Your enterprise profile has been formatted for priority review. Finalize transmission via your secure email client.
                                        </p>
                                        <Button
                                            onClick={() => setIsSubmitted(false)}
                                            variant="outline"
                                            className="font-bold text-xs uppercase tracking-widest border-gray-200 rounded-none h-12">
                                            New Transmission
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-10">
                                        <div className="space-y-2">
                                            <h3 className="text-[10px] font-bold text-blue-600 font-mono tracking-[0.2em] uppercase">
                                                Institutional Briefing Request // V.02
                                            </h3>
                                            <p className="text-xs text-gray-400 font-mono">Priority Node Allocation: 3/Week</p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase block">
                                                    Lead Strategist
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={form.name}
                                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                    placeholder="FULL NAME"
                                                    className="h-14 border-0 border-b border-gray-200 text-sm font-mono tracking-tight bg-transparent focus:ring-0 focus:border-gray-900 transition-all rounded-none px-0"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase block">
                                                    Corporate Email
                                                </label>
                                                <Input
                                                    type="email"
                                                    value={form.email}
                                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                    placeholder="PARTNER@DOMAIN.COM"
                                                    className="h-14 border-0 border-b border-gray-200 text-sm font-mono tracking-tight bg-transparent focus:ring-0 focus:border-gray-900 transition-all rounded-none px-0"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase block">
                                                Institutional Entity
                                            </label>
                                            <Input
                                                type="text"
                                                value={form.company}
                                                onChange={(e) => setForm({ ...form, company: e.target.value })}
                                                placeholder="LEGAL ENTITY NAME"
                                                className="h-14 border-0 border-b border-gray-200 text-sm font-mono tracking-tight bg-transparent focus:ring-0 focus:border-gray-900 transition-all rounded-none px-0"
                                                required
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase block">
                                                    Annual Portfolio GMV
                                                </label>
                                                <Select value={form.revenue} onValueChange={(value) => setForm({ ...form, revenue: value })}>
                                                    <SelectTrigger className="h-14 border-0 border-b border-gray-200 text-sm font-mono tracking-tight bg-transparent rounded-none px-0 focus:ring-0">
                                                        <SelectValue placeholder="SELECT RANGE" />
                                                    </SelectTrigger>
                                                    <SelectContent className="font-mono text-xs">
                                                        <SelectItem value="$10M - $50M">$10M - $50M</SelectItem>
                                                        <SelectItem value="$50M - $250M">$50M - $250M</SelectItem>
                                                        <SelectItem value="$250M+">$250M+</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase block">
                                                    Seller Hash Identifier
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={form.sellerId}
                                                    onChange={(e) => setForm({ ...form, sellerId: e.target.value })}
                                                    placeholder="AMAZON SELLER ID (OPTIONAL)"
                                                    className="h-14 border-0 border-b border-gray-200 text-sm font-mono tracking-tight bg-transparent focus:ring-0 focus:border-gray-900 transition-all rounded-none px-0"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase block">
                                                Technical Requirements
                                            </label>
                                            <Textarea
                                                value={form.message}
                                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                                placeholder="DESCRIBE DATA ARCHITECTURE AND SPECIFIC DRIFT CHALLENGES..."
                                                className="min-h-[120px] border-0 border-b border-gray-200 text-sm font-mono tracking-tight bg-transparent focus:ring-0 focus:border-gray-900 transition-all rounded-none resize-none px-0 py-4"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full h-16 bg-black hover:bg-gray-800 text-white text-xs font-bold font-mono tracking-widest uppercase rounded-none transition-all">
                                            {isSubmitting ? (
                                                <>Encrypting Application...</>
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
