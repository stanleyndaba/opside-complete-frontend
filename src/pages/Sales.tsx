import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, CheckCircle2, Building2, DollarSign, Users, Calendar, ShieldCheck, Globe, Clock, Zap } from 'lucide-react';
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
        title: 'Talk to Sales | Margin',
        description: 'Connect with the Margin team for enterprise partnerships, high-volume seller solutions, and strategic inquiries.',
        url: `${SITE_META.url}/sales`,
        image: SITE_META.image
    });

    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        company: '',
        revenue: '',
        sellerId: '',
        message: ''
    });

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
        <div className="min-h-screen bg-white text-gray-900 relative">
            {/* Background Gradients */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_-10%,rgba(59,130,246,0.06),transparent_40%),radial-gradient(circle_at_20%_110%,rgba(16,185,129,0.04),transparent_45%)]" />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/5 backdrop-blur-md border-b border-gray-100/50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto" />
                        <span className="text-base font-bold text-gray-900 font-montserrat tracking-tight">Margin</span>
                    </Link>
                    <div className="flex items-center gap-5">
                        <Link to="/contact" className="text-[10px] font-bold text-gray-400 hover:text-gray-900 font-mono tracking-widest uppercase transition-colors">
                            General Support
                        </Link>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase">Verified Hub</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-20 max-w-6xl relative z-10">
                {/* Hero Section */}
                <div className="max-w-3xl mb-24">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="px-2.5 py-1 bg-gray-900 text-[10px] font-bold text-white font-mono tracking-widest uppercase">
                            Enterprise Node
                        </div>
                        <div className="h-[1px] w-12 bg-gray-200" />
                        <span className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase">High Volume Gateway</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-merriweather font-bold text-gray-900 leading-[1.1] mb-8">
                        Scale Autonomously with Margin Enterprise
                    </h1>
                    <p className="text-xl text-gray-600 font-montserrat max-w-2xl leading-relaxed">
                        For institutional sellers processing $1M+ in monthly GMV. Secure priority infrastructure, dedicated forensic auditors, and custom API integrations.
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-12 lg:gap-24">
                    {/* Enterprise Benefits Sidebar */}
                    <div className="lg:col-span-5 space-y-10">
                        <div className="space-y-4">
                            <h2 className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase pl-2 mb-6">Institutional Benefits</h2>

                            {[
                                { icon: Users, title: "Dedicated Auditor", desc: "1-on-1 forensic accounting lead" },
                                { icon: Zap, title: "Priority Infrastructure", desc: "Sub-100ms sync & detection priority" },
                                { icon: Building2, title: "Entity Management", desc: "Unified dashboard for 100+ seller accounts" },
                                { icon: DollarSign, title: "Custom Unit Economics", desc: "Volume-based recovery pricing" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-5 p-6 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all group">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-blue-100/50 transition-all border border-gray-100">
                                        <item.icon className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">{item.title}</p>
                                        <p className="text-sm text-gray-500 font-montserrat">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Founder Note Module */}
                        <div className="p-8 bg-gray-900 rounded-3xl relative overflow-hidden group shadow-2xl">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <ShieldCheck className="h-20 w-20 text-white" />
                            </div>
                            <h2 className="text-[10px] font-bold text-emerald-400 font-mono tracking-widest uppercase mb-6 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Founder's Commitment
                            </h2>
                            <p className="text-lg font-merriweather text-white leading-relaxed mb-6 italic">
                                "I personally review every institutional inquiry. If you're processing serious volume, our team will build a custom audit engine for your specific supply chain."
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white font-mono">
                                    CEO
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white uppercase tracking-widest">Founder & CEO</p>
                                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Margin AI Global</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enterprise Inquiry Form */}
                    <div className="lg:col-span-7">
                        <div className="p-10 bg-blue-50/40 rounded-3xl border border-blue-100/50 backdrop-blur-xl relative">
                            {isSubmitted ? (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-8">
                                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 font-merriweather mb-3">
                                        Priority Inquiry Prepared
                                    </h2>
                                    <p className="text-gray-500 font-montserrat mb-10 max-w-xs mx-auto text-sm leading-relaxed">
                                        Your enterprise profile has been formatted for priority review. Complete the transmission via your secure email client.
                                    </p>
                                    <Button
                                        onClick={() => setIsSubmitted(false)}
                                        variant="outline"
                                        className="font-bold text-xs uppercase tracking-widest border-gray-200">
                                        New Inquiry Node
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <h3 className="text-xs font-bold text-blue-500 font-mono tracking-[0.2em] uppercase mb-10">
                                        Enterprise Transmission // Form 02
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase mb-2 block">
                                                Auditor / Lead Name
                                            </label>
                                            <Input
                                                type="text"
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                placeholder="FULL NAME"
                                                className="h-12 border-gray-100 text-sm font-mono tracking-tight bg-white/60 focus:bg-white focus:border-gray-900 transition-all rounded-none"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase mb-2 block">
                                                Professional Email
                                            </label>
                                            <Input
                                                type="email"
                                                value={form.email}
                                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                placeholder="SENDER@DOMAIN.COM"
                                                className="h-12 border-gray-100 text-sm font-mono tracking-tight bg-white/60 focus:bg-white focus:border-gray-900 transition-all rounded-none"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase mb-2 block">
                                            Institutional Entity
                                        </label>
                                        <Input
                                            type="text"
                                            value={form.company}
                                            onChange={(e) => setForm({ ...form, company: e.target.value })}
                                            placeholder="REGISTERED COMPANY NAME"
                                            className="h-12 border-gray-100 text-sm font-mono tracking-tight bg-white/60 focus:bg-white focus:border-gray-900 transition-all rounded-none"
                                            required
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase mb-2 block">
                                                Annual GMV Volume
                                            </label>
                                            <Select value={form.revenue} onValueChange={(value) => setForm({ ...form, revenue: value })}>
                                                <SelectTrigger className="h-12 border-gray-100 text-sm font-mono tracking-tight bg-white/60 rounded-none">
                                                    <SelectValue placeholder="SELECT RANGE" />
                                                </SelectTrigger>
                                                <SelectContent className="font-mono text-xs">
                                                    <SelectItem value="$1M - $5M">$1M - $5M</SelectItem>
                                                    <SelectItem value="$5M - $10M">$5M - $10M</SelectItem>
                                                    <SelectItem value="$10M - $25M">$10M - $25M</SelectItem>
                                                    <SelectItem value="$25M - $50M">$25M - $50M</SelectItem>
                                                    <SelectItem value="$50M+">$50M+</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase mb-2 block">
                                                Seller ID Hash
                                            </label>
                                            <Input
                                                type="text"
                                                value={form.sellerId}
                                                onChange={(e) => setForm({ ...form, sellerId: e.target.value })}
                                                placeholder="AMAZON SELLER ID"
                                                className="h-12 border-gray-100 text-sm font-mono tracking-tight bg-white/60 focus:bg-white focus:border-gray-900 transition-all rounded-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase mb-2 block">
                                            Strategic Requirements
                                        </label>
                                        <Textarea
                                            value={form.message}
                                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                                            placeholder="DESCRIBE VOLUME AND CURRENT RECOVERY CHALLENGES..."
                                            className="min-h-[140px] border-gray-100 text-sm font-mono tracking-tight bg-white/60 focus:bg-white focus:border-gray-900 transition-all rounded-none resize-none px-4 py-4"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-16 bg-gray-900 hover:bg-black text-white text-xs font-bold font-mono tracking-widest uppercase rounded-none transition-all shadow-xl">
                                        {isSubmitting ? (
                                            <>Encrypting Transmission...</>
                                        ) : (
                                            <>
                                                Request Priority Access // Execute
                                                <Send className="h-3.5 w-3.5 ml-3" />
                                            </>
                                        )}
                                    </Button>

                                    <div className="flex items-center justify-center gap-4 py-4 opacity-40">
                                        <div className="h-[1px] w-8 bg-gray-400" />
                                        <Globe className="h-3 w-3" />
                                        <Clock className="h-3 w-3" />
                                        <div className="h-[1px] w-8 bg-gray-400" />
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <BrandFooter />
        </div>
    );
}
