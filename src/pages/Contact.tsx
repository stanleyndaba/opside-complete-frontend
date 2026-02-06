import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, CheckCircle2, Globe, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';
import { BrandFooter } from '@/components/layout/BrandFooter';

export default function Contact() {
    usePageMeta({
        title: 'Contact Sales | Margin',
        description: 'Get in touch with the Margin team for enterprise inquiries, partnerships, or general questions.',
        url: `${SITE_META.url}/contact`,
        image: SITE_META.image
    });

    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.email || !form.message) {
            toast({
                title: 'Required fields missing',
                description: 'Please fill in your name, email, and message.',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));

        const subject = encodeURIComponent(form.subject || 'Contact from Margin Website');
        const body = encodeURIComponent(
            `Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company || 'N/A'}\n\n${form.message}`
        );
        window.open(`mailto:support@margin.io?subject=${subject}&body=${body}`, '_blank');

        setIsSubmitting(false);
        setIsSubmitted(true);
        toast({
            title: 'Message prepared',
            description: 'Your email client has been opened. Send the email to complete your inquiry.',
        });
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white relative">
            {/* Background Gradients */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(16,185,129,0.08),transparent_40%),radial-gradient(circle_at_80%_-10%,rgba(59,130,246,0.06),transparent_45%)]" />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#050505]/20 backdrop-blur-2xl border-b border-white/10">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto invert brightness-0" />
                        <span className="text-base font-bold text-white font-montserrat tracking-tight">Margin</span>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-6 py-20 max-w-5xl relative z-10">
                {/* Page Header */}
                <div className="max-w-2xl mb-20 text-left">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-[1px] w-8 bg-white/20" />
                        <span className="text-[11px] font-bold text-white/40 font-montserrat tracking-wider sm:tracking-[0.2em] uppercase">Contact Us</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-merriweather font-bold text-white leading-tight mb-6 break-words">
                        Contact Support & <br />Enterprise Sales
                    </h1>
                    <p className="text-lg text-white/40 font-montserrat max-w-xl leading-relaxed">
                        Secure a forensic audit of your Amazon portfolio. Our technical team responds to global inquiries within 24 operational hours.
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
                    {/* Contact Form Container */}
                    <div className="lg:col-span-7">
                        {isSubmitted ? (
                            <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/10 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-8">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-white font-merriweather mb-3">
                                    Transmission Prepared
                                </h2>
                                <p className="text-white/40 font-montserrat mb-10 max-w-xs mx-auto text-sm leading-relaxed">
                                    Your secure inquiry has been formatted. Please complete the transmission via your email client.
                                </p>
                                <Button
                                    onClick={() => setIsSubmitted(false)}
                                    variant="outline"
                                    className="font-bold text-xs uppercase tracking-widest border-white/10 text-white hover:bg-white/5 rounded-xl h-12 px-8 font-montserrat">
                                    New Transmission
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/30 tracking-wider sm:tracking-widest uppercase mb-2 block font-montserrat">
                                            Your Name
                                        </label>
                                        <Input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="FULL NAME"
                                            className="h-12 border-white/10 text-sm tracking-tight bg-white/[0.02] focus:bg-white/[0.04] focus:border-emerald-500/50 transition-all rounded-xl placeholder:text-white/10 font-montserrat"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/30 tracking-wider sm:tracking-widest uppercase mb-2 block font-montserrat">
                                            Email Address
                                        </label>
                                        <Input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            placeholder="SENDER@DOMAIN.COM"
                                            className="h-12 border-white/10 text-sm tracking-tight bg-white/[0.02] focus:bg-white/[0.04] focus:border-emerald-500/50 transition-all rounded-xl placeholder:text-white/10 font-montserrat"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/30 font-mono tracking-wider sm:tracking-widest uppercase mb-2 block">
                                            Entity / Company
                                        </label>
                                        <Input
                                            type="text"
                                            value={form.company}
                                            onChange={(e) => setForm({ ...form, company: e.target.value })}
                                            placeholder="COMPANY NAME"
                                            className="h-12 border-white/10 text-sm font-mono tracking-tight bg-white/[0.02] focus:bg-white/[0.04] focus:border-emerald-500/50 transition-all rounded-none placeholder:text-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/30 font-mono tracking-wider sm:tracking-widest uppercase mb-2 block">
                                            Subject Header
                                        </label>
                                        <Input
                                            type="text"
                                            value={form.subject}
                                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                            placeholder="INQUIRY TYPE"
                                            className="h-12 border-white/10 text-sm font-mono tracking-tight bg-white/[0.02] focus:bg-white/[0.04] focus:border-emerald-500/50 transition-all rounded-none placeholder:text-white/10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-2 block font-montserrat">
                                        Message Body
                                    </label>
                                    <Textarea
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        placeholder="DECRYPTED MESSAGE CONTENT..."
                                        className="min-h-[160px] border-white/10 text-sm tracking-tight bg-white/[0.02] focus:bg-white/[0.04] focus:border-emerald-500/50 transition-all rounded-xl resize-none px-4 py-4 placeholder:text-white/10 font-montserrat"
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-14 bg-white hover:bg-white/90 text-black text-xs font-bold tracking-widest uppercase rounded-xl transition-all shadow-2xl font-montserrat">
                                    {isSubmitting ? (
                                        <>Formatting Transmission...</>
                                    ) : (
                                        <>
                                            Send Transmission
                                            <Send className="h-3.5 w-3.5 ml-3" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Contact Info Sidebar */}
                    <div className="lg:col-span-5 space-y-12">
                        <div className="pt-8 border-t border-white/5">
                            <h2 className="text-[10px] font-bold text-white/40 font-mono tracking-widest uppercase mb-4 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                                Operations Status
                            </h2>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 p-2 bg-white/5 rounded-lg text-white/60">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">Response Latency</p>
                                    <p className="text-sm font-bold text-white font-mono uppercase">LT &lt; 24 Hours</p>
                                </div>
                            </div>
                        </div>

                        {/* Direct Access Gateways */}
                        <div className="space-y-4">
                            <h2 className="text-[10px] font-bold text-white/30 font-mono tracking-widest uppercase pl-2 mb-4">Direct Gateways</h2>

                            <a
                                href="mailto:support@margin.io"
                                className="flex items-center gap-4 p-5 rounded-2xl bg-[#0a0a0a] border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all group">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all border border-white/10">
                                    <Mail className="h-5 w-5 text-white/40 group-hover:text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white uppercase tracking-tight">Technical Support</p>
                                    <p className="text-sm text-white/40 font-mono">support@margin.io</p>
                                </div>
                            </a>

                            <Link
                                to="/sales"
                                className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all group shadow-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-emerald-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 transition-all relative z-10">
                                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-xs font-bold text-white uppercase tracking-tight">Enterprise Sales</p>
                                    <p className="text-[11px] text-white/40 font-mono uppercase tracking-widest mt-0.5">VIP Priority Gateway</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <BrandFooter />
        </div>
    );
}
