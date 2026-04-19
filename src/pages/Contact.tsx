import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, Mail, Send, ShieldCheck } from 'lucide-react';
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
    const [scrolled, setScrolled] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: ''
    });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
            `MARGIN CONTACT REQUEST\n${'='.repeat(40)}\n\nName: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company || 'N/A'}\nSubject: ${form.subject || 'General inquiry'}\n\n${'='.repeat(40)}\nMESSAGE:\n\n${form.message}\n\n${'='.repeat(40)}\nSent via Margin Contact Form`
        );
        window.open(`mailto:support@margin-finance.com?subject=${subject}&body=${body}`, '_blank');

        setIsSubmitting(false);
        setIsSubmitted(true);
        toast({
            title: 'Message prepared',
            description: 'Your email client has been opened. Send the email to complete your inquiry.',
        });
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-sky-400/30 selection:text-white font-sans">
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
                style={{
                    backgroundImage:
                        `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-full h-[760px] bg-[radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.06),transparent_70%)]" />
                <div className="absolute bottom-0 left-0 w-full h-[760px] bg-[radial-gradient(circle_at_20%_100%,rgba(99,102,241,0.05),transparent_70%)]" />
            </div>

            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-[#050505]/80 backdrop-blur-md border-white/10 py-4' : 'bg-transparent border-transparent py-6'}`}>
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src="/logoimagetwo.png" alt="Margin" className="h-4 sm:h-5 w-auto invert brightness-0" />
                        <span className="brand-wordmark font-merriweather text-white text-lg tracking-tight">Margin</span>
                    </Link>
                    <Link to="/sales">
                        <Button variant="outline" className="h-9 rounded-none border-white/20 bg-transparent text-white hover:bg-white hover:text-black font-mono text-[10px] uppercase tracking-tight transition-all">
                            Enterprise Sales
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="relative z-10 pt-32 pb-24">
                <section className="container mx-auto px-6 max-w-5xl mb-20 md:mb-28">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-4 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                            <span className="text-[10px] font-bold text-white font-sans tracking-tight uppercase">Margin Contact</span>
                            <div className="h-3 w-[1px] bg-white/10" />
                            <span className="text-[10px] font-bold text-white/40 font-sans tracking-tight uppercase">Support + Sales Routing</span>
                        </div>

                        <h1 className="text-4xl md:text-7xl font-light leading-[1.1] tracking-tight text-white">
                            Contact Support & <br className="hidden sm:block" />
                            Enterprise Sales
                        </h1>

                        <p className="max-w-2xl text-lg md:text-xl text-white/60 font-sans tracking-tight leading-relaxed">
                            Send us the operational context. We will route it to support, onboarding, or enterprise review without making you chase the right inbox.
                        </p>
                    </motion.div>
                </section>

                <section className="container mx-auto px-6 max-w-5xl">
                    <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                        <div className="lg:col-span-8">
                            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.018)_20%,rgba(8,8,9,0.98)_100%)] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.36)] sm:p-10">
                                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                <div className="pointer-events-none absolute -right-12 top-10 h-28 w-28 rounded-full bg-white/5 blur-3xl" />

                                {isSubmitted ? (
                                    <div className="text-center py-20">
                                        <div className="w-20 h-20 rounded-full bg-sky-400/10 flex items-center justify-center mx-auto mb-8">
                                            <CheckCircle2 className="h-10 w-10 text-sky-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white font-sans tracking-tight mb-3">
                                            Transmission Prepared
                                        </h2>
                                        <p className="text-white/40 font-sans mb-10 max-w-xs mx-auto text-sm leading-relaxed tracking-tight">
                                            Your inquiry has been formatted for email. Send it from your client and our team will route the request.
                                        </p>
                                        <Button
                                            onClick={() => setIsSubmitted(false)}
                                            variant="outline"
                                            className="h-12 rounded-[18px] border-white/10 bg-transparent px-6 text-[12px] font-medium tracking-tight text-white/80 hover:bg-white/[0.04] hover:text-white"
                                        >
                                            New Transmission
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-10">
                                        <div className="space-y-2">
                                            <h3 className="text-[10px] font-medium text-white font-sans tracking-tight uppercase">
                                                Contact Request // Routed Intake
                                            </h3>
                                            <p className="text-xs text-white/40 font-sans tracking-tight">
                                                Include the account, workspace, or recovery context that would help us respond cleanly.
                                            </p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-medium text-white/42 font-mono tracking-tight uppercase block">
                                                    Name
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
                                                    Email
                                                </label>
                                                <Input
                                                    type="email"
                                                    value={form.email}
                                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                    placeholder="YOU@DOMAIN.COM"
                                                    className="h-14 rounded-[20px] border-white/10 bg-white/[0.02] px-4 text-[14px] tracking-tight text-white placeholder:text-white/18 focus:border-white/18"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-medium text-white/42 font-mono tracking-tight uppercase block">
                                                    Company
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={form.company}
                                                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                                                    placeholder="COMPANY NAME"
                                                    className="h-14 rounded-[20px] border-white/10 bg-white/[0.02] px-4 text-[14px] tracking-tight text-white placeholder:text-white/18 focus:border-white/18"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-medium text-white/42 font-mono tracking-tight uppercase block">
                                                    Subject
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={form.subject}
                                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                                    placeholder="SUPPORT, SALES, OR SETUP"
                                                    className="h-14 rounded-[20px] border-white/10 bg-white/[0.02] px-4 text-[14px] tracking-tight text-white placeholder:text-white/18 focus:border-white/18"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[11px] font-medium text-white/42 font-mono tracking-tight uppercase block">
                                                Message
                                            </label>
                                            <Textarea
                                                value={form.message}
                                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                                placeholder="TELL US WHAT YOU NEED HELP WITH..."
                                                className="min-h-[150px] rounded-[22px] border-white/10 bg-white/[0.02] px-4 py-4 text-[14px] tracking-tight text-white placeholder:text-white/18 focus:border-white/18 resize-none"
                                                required
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full h-12 rounded-[18px] border border-white/10 bg-white text-black text-[13px] font-medium font-sans tracking-tight uppercase transition-all hover:bg-white/92 hover:text-black"
                                        >
                                            {isSubmitting ? (
                                                <>Preparing Message...</>
                                            ) : (
                                                <>
                                                    Send Contact Request
                                                    <Send className="h-3.5 w-3.5 ml-3" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </div>

                        <aside className="lg:col-span-4 space-y-6">
                            <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.025] p-6">
                                <div className="h-[1px] w-12 bg-sky-400/60 mb-6" />
                                <div className="text-[10px] font-bold text-white/40 font-sans tracking-tight uppercase mb-2">
                                    Operations Status
                                </div>
                                <h2 className="text-xl font-bold tracking-tight text-white font-sans">
                                    Routed within one business day.
                                </h2>
                                <div className="mt-6 flex items-start gap-4">
                                    <div className="mt-1 p-2 bg-white/5 rounded-lg text-white/60">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-white/30 uppercase tracking-tight mb-1 font-sans">
                                            Response Window
                                        </p>
                                        <p className="text-sm font-bold text-white font-sans uppercase tracking-tight">
                                            Under 24 hours
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <a
                                href="mailto:support@margin-finance.com"
                                className="flex items-center gap-4 p-5 rounded-[24px] bg-[#0a0a0a] border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all group"
                            >
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all border border-white/10">
                                    <Mail className="h-5 w-5 text-white/40 group-hover:text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white uppercase tracking-tight font-sans">Support Inbox</p>
                                    <p className="text-sm text-white/40 font-sans tracking-tight">support@margin-finance.com</p>
                                </div>
                            </a>

                            <Link
                                to="/sales"
                                className="relative flex items-center gap-4 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02] p-5 shadow-2xl transition-all hover:border-white/20 hover:bg-white/5 group"
                            >
                                <div className="absolute inset-0 bg-sky-400/5 opacity-60 transition-opacity group-hover:opacity-100" />
                                <div className="relative z-10 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 transition-all">
                                    <ShieldCheck className="h-5 w-5 text-white/70" />
                                </div>
                                <div className="relative z-10 flex-1">
                                    <p className="text-xs font-bold text-white uppercase tracking-tight font-sans">Enterprise Sales</p>
                                    <p className="text-[11px] text-white/40 font-sans uppercase tracking-tight mt-0.5">High volume gateway</p>
                                </div>
                                <ArrowRight className="relative z-10 h-4 w-4 text-white/35 transition-transform group-hover:translate-x-1 group-hover:text-white/70" />
                            </Link>
                        </aside>
                    </div>
                </section>
            </main>

            <BrandFooter />
        </div>
    );
}
