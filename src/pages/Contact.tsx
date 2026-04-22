import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    FileText,
    LifeBuoy,
    Mail,
    PlugZap,
    Send,
    ShieldCheck,
} from 'lucide-react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useToast } from '@/hooks/use-toast';

const containerClass = 'mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8';
const labelClass = 'text-[10px] font-medium uppercase tracking-[0.18em] text-sky-100/52';

const supportRoutes = [
    {
        icon: PlugZap,
        label: 'Connection Help',
        detail: 'Amazon account setup, reconnects, sync status, and onboarding access.',
    },
    {
        icon: FileText,
        label: 'Evidence & Cases',
        detail: 'Documents, missing proof, claim readiness, case state, and recovery tracking.',
    },
    {
        icon: ShieldCheck,
        label: 'Billing & Access',
        detail: 'Subscription questions, workspace access, API interest, and account changes.',
    },
];

const responseNotes = [
    'Support requests are routed to the right team path.',
    'Workspace and case context help us respond cleanly.',
    'Urgent onboarding issues are prioritized during launch.',
];

export default function Contact() {
    usePageMeta({
        title: 'Contact Support | Margin',
        description: 'Contact Margin for support, onboarding, billing, API access, or recovery workflow questions.',
        url: `${SITE_META.url}/contact`,
        image: SITE_META.image,
    });

    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.email || !form.message) {
            toast({
                title: 'Required fields missing',
                description: 'Please fill in your name, email, and message.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 900));

        const subject = encodeURIComponent(form.subject || 'Support request from Margin website');
        const body = encodeURIComponent(
            `MARGIN SUPPORT REQUEST\n${'='.repeat(40)}\n\nName: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company || 'N/A'}\nSubject: ${form.subject || 'General support'}\n\n${'='.repeat(40)}\nMESSAGE:\n\n${form.message}\n\n${'='.repeat(40)}\nSent via Margin Contact Form`
        );
        window.open(`mailto:support@margin-finance.com?subject=${subject}&body=${body}`, '_blank');

        setIsSubmitting(false);
        setIsSubmitted(true);
        toast({
            title: 'Message prepared',
            description: 'Your email client has been opened. Send the email to complete your request.',
        });
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#050505] font-sans text-white selection:bg-sky-400/25 selection:text-white">
            <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/8 bg-[#050505]/78 backdrop-blur-xl">
                <div className={`${containerClass} flex h-20 items-center justify-between`}>
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto invert brightness-0" />
                        <span className="brand-wordmark font-merriweather text-lg tracking-tight text-white">Margin</span>
                    </Link>

                    <nav className="hidden items-center gap-6 text-[13px] text-white/56 md:flex">
                        <Link to="/" className="transition hover:text-white">Home</Link>
                        <Link to="/pricing" className="transition hover:text-white">Pricing</Link>
                        <Link to="/developer-api" className="transition hover:text-white">API</Link>
                    </nav>

                    <Link
                        to="/login"
                        className="inline-flex h-10 items-center justify-center rounded-full border border-white/12 bg-transparent px-4 text-[13px] text-white transition-colors hover:bg-white/[0.04]"
                    >
                        Sign In
                    </Link>
                </div>
            </header>

            <main className="relative">
                <div
                    className="pointer-events-none fixed inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                    }}
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(56,189,248,0.055)_0%,transparent_28%,transparent_70%,rgba(148,163,184,0.04)_100%)]" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090909] via-[#050505] to-[#040404]" />

                <section className="relative pt-28 md:pt-40">
                    <div className={containerClass}>
                        <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
                            <motion.div
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className={labelClass}>Margin Support</div>
                                <h1 className="mt-5 max-w-[780px] text-[38px] font-light leading-[0.98] tracking-tight text-white sm:text-[46px] md:text-[76px]">
                                    Tell us where the workflow is stuck.
                                </h1>
                                <p className="mt-5 max-w-[680px] text-[16px] leading-7 text-white/62 md:mt-7 md:text-[19px] md:leading-8">
                                    Reach Margin for onboarding, Amazon connection issues, evidence questions, billing, API access, or anything blocking recovery work.
                                </p>

                                <div className="mt-9 space-y-3">
                                    {supportRoutes.map((item) => (
                                        <div key={item.label} className="grid grid-cols-[40px_minmax(0,1fr)] gap-4 border-t border-white/8 py-5 last:border-b">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.035] text-sky-100/70">
                                                <item.icon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h2 className="text-[15px] font-medium tracking-tight text-white">{item.label}</h2>
                                                <p className="mt-1 max-w-[520px] text-[13px] leading-6 text-white/48">{item.detail}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <a
                                    href="mailto:support@margin-finance.com"
                                    className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-white/12 bg-transparent px-5 text-[13px] text-white transition-colors hover:bg-white/[0.04] md:h-12 md:px-6 md:text-sm"
                                >
                                    support@margin-finance.com
                                    <Mail className="ml-2 h-4 w-4" />
                                </a>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 22 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.65, delay: 0.08 }}
                                className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(5,7,10,0.98)_100%)] px-5 py-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:px-7 sm:py-8 md:px-8"
                            >
                                {isSubmitted ? (
                                    <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-sky-300/20 bg-sky-300/[0.08] text-sky-100">
                                            <CheckCircle2 className="h-8 w-8" />
                                        </div>
                                        <h2 className="mt-7 text-[28px] font-light tracking-tight text-white">Message ready to send.</h2>
                                        <p className="mt-3 max-w-[360px] text-[14px] leading-7 text-white/52">
                                            Your email client has the support request. Send it from there and we will route it.
                                        </p>
                                        <Button
                                            type="button"
                                            onClick={() => setIsSubmitted(false)}
                                            className="mt-8 h-11 rounded-full border border-white/12 bg-transparent px-5 text-[13px] font-medium text-white hover:bg-white/[0.04]"
                                        >
                                            Start Another Request
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-7">
                                        <div>
                                            <div className={labelClass}>Routed Intake</div>
                                            <h2 className="mt-3 text-[28px] font-light leading-tight tracking-tight text-white md:text-[36px]">
                                                Send a support request.
                                            </h2>
                                            <p className="mt-3 max-w-[620px] text-[14px] leading-7 text-white/52">
                                                Add the workspace, case, integration, or billing context that matters.
                                            </p>
                                        </div>

                                        <div className="grid gap-5 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <label className="block text-[11px] font-medium uppercase tracking-[0.16em] text-white/42">
                                                    Name
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={form.name}
                                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                    placeholder="Your name"
                                                    className="h-12 rounded-[14px] border-white/10 bg-white/[0.025] px-4 text-[14px] text-white placeholder:text-white/24 focus:border-white/20"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[11px] font-medium uppercase tracking-[0.16em] text-white/42">
                                                    Email
                                                </label>
                                                <Input
                                                    type="email"
                                                    value={form.email}
                                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                    placeholder="you@company.com"
                                                    className="h-12 rounded-[14px] border-white/10 bg-white/[0.025] px-4 text-[14px] text-white placeholder:text-white/24 focus:border-white/20"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-5 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <label className="block text-[11px] font-medium uppercase tracking-[0.16em] text-white/42">
                                                    Company
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={form.company}
                                                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                                                    placeholder="Company or store"
                                                    className="h-12 rounded-[14px] border-white/10 bg-white/[0.025] px-4 text-[14px] text-white placeholder:text-white/24 focus:border-white/20"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[11px] font-medium uppercase tracking-[0.16em] text-white/42">
                                                    Topic
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={form.subject}
                                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                                    placeholder="Onboarding, API, billing, case help"
                                                    className="h-12 rounded-[14px] border-white/10 bg-white/[0.025] px-4 text-[14px] text-white placeholder:text-white/24 focus:border-white/20"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[11px] font-medium uppercase tracking-[0.16em] text-white/42">
                                                Message
                                            </label>
                                            <Textarea
                                                value={form.message}
                                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                                placeholder="Tell us what you need help with."
                                                className="min-h-[156px] resize-none rounded-[16px] border-white/10 bg-white/[0.025] px-4 py-4 text-[14px] leading-6 text-white placeholder:text-white/24 focus:border-white/20"
                                                required
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="h-12 w-full rounded-full border border-sky-300/18 bg-sky-300/[0.08] px-5 text-[13px] font-medium text-sky-50 transition-colors hover:bg-sky-300/[0.13]"
                                        >
                                            {isSubmitting ? 'Preparing Message...' : 'Send Support Request'}
                                            {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
                                        </Button>
                                    </form>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </section>

                <section className="relative mt-14 border-y border-white/8 bg-white/[0.02] md:mt-20">
                    <div className={containerClass}>
                        <div className="grid gap-0 md:grid-cols-3">
                            <div className="border-b border-white/8 py-6 md:border-b-0 md:border-r md:border-white/8 md:px-6">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-sky-100/54" />
                                    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/58">Response Window</div>
                                </div>
                                <p className="mt-3 max-w-[340px] text-[13px] leading-6 text-white/46">Most launch support requests are reviewed within one business day.</p>
                            </div>
                            <div className="border-b border-white/8 py-6 md:border-b-0 md:border-r md:border-white/8 md:px-6">
                                <div className="flex items-center gap-3">
                                    <LifeBuoy className="h-4 w-4 text-sky-100/54" />
                                    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/58">Support Routing</div>
                                </div>
                                <p className="mt-3 max-w-[340px] text-[13px] leading-6 text-white/46">Requests are routed across onboarding, product support, API access, billing, and recovery workflow help.</p>
                            </div>
                            <div className="py-6 md:px-6">
                                <div className="flex items-center gap-3">
                                    <ArrowRight className="h-4 w-4 text-sky-100/54" />
                                    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/58">Need API Access?</div>
                                </div>
                                <p className="mt-3 max-w-[340px] text-[13px] leading-6 text-white/46">Use this same route for API access questions while partner access stays private.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="relative border-t border-white/8 py-16 md:py-28">
                    <div className={containerClass}>
                        <div className="grid gap-8 md:grid-cols-[0.7fr_1fr] md:items-start">
                            <div>
                                <div className={labelClass}>What Helps</div>
                                <h2 className="mt-4 max-w-[600px] text-[31px] font-light leading-[1.02] tracking-tight text-white sm:text-[36px] md:text-[54px]">
                                    A little context gets you a cleaner answer.
                                </h2>
                            </div>
                            <div className="border-t border-white/8">
                                {responseNotes.map((note) => (
                                    <div key={note} className="flex items-start gap-4 border-b border-white/8 py-5">
                                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-sky-100/54" />
                                        <p className="text-[15px] leading-7 text-white/62 md:text-[17px] md:leading-8">{note}</p>
                                    </div>
                                ))}
                                <Link
                                    to="/developer-api"
                                    className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-white/12 bg-transparent px-5 text-[13px] text-white transition-colors hover:bg-white/[0.04] md:h-12 md:px-6 md:text-sm"
                                >
                                    View Margin API
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <BrandFooter />
        </div>
    );
}
