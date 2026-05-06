import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';

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
        window.open(`mailto:support@margin-finance.com?subject=${subject}&body=${body}`, '_blank');

        setIsSubmitting(false);
        setIsSubmitted(true);
        toast({
            title: 'Inquiry prepared',
            description: 'Your email client has been opened. Send the email to connect with us.',
        });
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026] font-sans">
            <div className="fixed inset-0 pointer-events-none opacity-[0.45] z-0 [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
            <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(46,125,91,0.1),transparent_28%)]" />
            </div>

            <PublicNavbar variant="light" />

            <main className="relative z-10 pt-32 pb-24">
                {/* Hero Section */}
                <section className="container mx-auto px-6 max-w-5xl mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-4 rounded-full border border-[#DCE8EE] bg-white/78 px-3 py-1.5 shadow-[0_14px_40px_rgba(37,49,58,0.06)] backdrop-blur">
                            <span className="text-[10px] font-semibold text-[#0B74DE] tracking-[0.14em] uppercase">Institutional Access</span>
                            <div className="h-3 w-px bg-[#D8E3E8]" />
                            <span className="text-[10px] font-semibold text-[#66737F] tracking-[0.14em] uppercase">High Volume Gateway</span>
                        </div>

                        <h1 className="text-4xl md:text-7xl font-semibold leading-[1.04] tracking-[-0.06em] text-[#182026]">
                            Scale Autonomously <br className="hidden sm:block" />
                            with Margin Enterprise
                        </h1>

                        <p className="max-w-2xl text-lg md:text-xl text-[#4D5B66] font-sans tracking-tight leading-relaxed">
                            For High-Velocity Accounts processing $1M+ in monthly GMV.
                            Secure priority infrastructure, dedicated forensic auditors,
                            and custom API integrations.
                        </p>
                    </motion.div>
                </section>

                {/* The Qualifier Section */}
                <section className="bg-white/50 border-y border-[#D8E3E8] py-16 md:py-32 mb-16 md:mb-32">
                    <div className="container mx-auto px-6 max-w-5xl">
                        <div className="grid md:grid-cols-2 gap-12 md:gap-24 font-sans tracking-tight">
                            <div>
                                <h2 className="text-[11px] font-semibold text-[#0B74DE] tracking-[0.18em] uppercase mb-12">System Requirement</h2>
                                <h3 className="text-3xl font-semibold tracking-[-0.045em] mb-8 text-[#182026]">
                                    Is Your Infrastructure <br />
                                    Ready for Scale?
                                </h3>
                                <p className="text-[#66737F] leading-relaxed text-sm sm:text-base">
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
                                    <div key={i} className="flex gap-6 pb-8 border-b border-[#D8E3E8] last:border-0">
                                        <div className="text-[10px] font-semibold text-[#9AA8B2] mt-1 tracking-[0.14em]">{`0${i + 1}`}</div>
                                        <div className="space-y-2">
                                            <div className="font-semibold text-[#182026] uppercase tracking-tight text-sm">{item.title}</div>
                                            <div className="text-sm text-[#66737F] tracking-tight">{item.desc}</div>
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
                                <div className="h-px w-12 bg-[#0B74DE]/60" />
                                <div className="space-y-2">
                                    <div className="text-[10px] font-semibold text-[#0B74DE] tracking-[0.16em] uppercase">{feature.label}</div>
                                    <h4 className="text-xl font-semibold tracking-[-0.025em] text-[#182026]">{feature.title}</h4>
                                </div>
                                <p className="text-sm text-[#66737F] leading-loose">
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
                            <div className="pt-10 border-t border-[#D8E3E8] text-center max-w-2xl mx-auto">
                                <p className="text-2xl font-medium tracking-[-0.035em] text-[#25313A] leading-relaxed mb-6 italic">
                                    "We personally review every institutional inquiry. If you're managing serious scale, our team will build a dedicated audit engine for your SKU architecture."
                                </p>
                                <p className="text-sm font-semibold text-[#66737F] uppercase tracking-[0.14em]">
                                    — Founder & CEO, Margin
                                </p>
                            </div>
                        </div>

                        {/* Inquiry Form */}
                        <div className="lg:col-start-3 lg:col-span-8">
                            <div className="relative overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-white p-6 shadow-[0_34px_100px_rgba(37,49,58,0.1)] sm:p-10">
                                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#0B74DE]/24 to-transparent" />
                                <div className="pointer-events-none absolute -right-12 top-10 h-28 w-28 rounded-full bg-[#0B74DE]/10 blur-3xl" />
                                {isSubmitted ? (
                                    <div className="text-center py-20">
                                        <div className="w-20 h-20 rounded-full bg-[#EAF6EF] flex items-center justify-center mx-auto mb-8">
                                            <CheckCircle2 className="h-10 w-10 text-[#2E7D5B]" />
                                        </div>
                                        <h2 className="text-2xl font-semibold text-[#182026] font-sans tracking-[-0.035em] mb-3">
                                            Inquiry Prepared
                                        </h2>
                                        <p className="text-[#66737F] font-sans mb-10 max-w-sm mx-auto text-sm leading-relaxed tracking-tight">
                                            Your enterprise profile has been prepared for review. Send the email from your client so the Margin team can follow up directly.
                                        </p>
                                        <Button
                                            onClick={() => setIsSubmitted(false)}
                                            variant="outline"
                                            className="h-12 rounded-full border-[#CFE0EA] bg-white px-6 text-[12px] font-semibold tracking-tight text-[#25313A] hover:bg-[#F8FAFC] hover:text-[#182026]">
                                            Start Another Inquiry
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-10">
                                        <div className="space-y-2">
                                            <h3 className="text-[10px] font-semibold text-[#0B74DE] font-sans tracking-[0.16em] uppercase">
                                                Enterprise Recovery Briefing
                                            </h3>
                                            <p className="text-xs text-[#66737F] font-sans tracking-tight">Priority onboarding capacity is reviewed manually for larger recovery operations.</p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-semibold text-[#66737F] font-sans tracking-[0.14em] uppercase block">
                                                    Contact Name
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={form.name}
                                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                    placeholder="Full name"
                                                    className="h-14 rounded-[20px] border-[#CFE0EA] bg-white px-4 text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-semibold text-[#66737F] font-sans tracking-[0.14em] uppercase block">
                                                    Work Email
                                                </label>
                                                <Input
                                                    type="email"
                                                    value={form.email}
                                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                    placeholder="partner@company.com"
                                                    className="h-14 rounded-[20px] border-[#CFE0EA] bg-white px-4 text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[11px] font-semibold text-[#66737F] font-sans tracking-[0.14em] uppercase block">
                                                Company
                                            </label>
                                            <Input
                                                type="text"
                                                value={form.company}
                                                onChange={(e) => setForm({ ...form, company: e.target.value })}
                                                placeholder="Legal entity or brand group"
                                                className="h-14 rounded-[20px] border-[#CFE0EA] bg-white px-4 text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20"
                                                required
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-semibold text-[#66737F] font-sans tracking-[0.14em] uppercase block">
                                                    Annual Portfolio GMV
                                                </label>
                                                <Select value={form.revenue} onValueChange={(value) => setForm({ ...form, revenue: value })}>
                                                    <SelectTrigger className="h-14 rounded-[20px] border-[#CFE0EA] bg-white px-4 text-[13px] tracking-tight text-[#182026] focus-visible:ring-[#0B74DE]/20">
                                                        <SelectValue placeholder="Select range" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-[16px] border-[#CFE0EA] bg-white text-xs font-sans text-[#182026] shadow-[0_22px_70px_rgba(37,49,58,0.14)]">
                                                        <SelectItem value="$1M - $5M">$1M - $5M</SelectItem>
                                                        <SelectItem value="$5M - $10M">$5M - $10M</SelectItem>
                                                        <SelectItem value="$10M - $25M">$10M - $25M</SelectItem>
                                                        <SelectItem value="$25M - $50M">$25M - $50M</SelectItem>
                                                        <SelectItem value="$50M+">$50M+</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-semibold text-[#66737F] font-sans tracking-[0.14em] uppercase block">
                                                    Amazon Seller ID
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={form.sellerId}
                                                    onChange={(e) => setForm({ ...form, sellerId: e.target.value })}
                                                    placeholder="Optional"
                                                    className="h-14 rounded-[20px] border-[#CFE0EA] bg-white px-4 text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[11px] font-semibold text-[#66737F] font-sans tracking-[0.14em] uppercase block">
                                                Recovery Operation Notes
                                            </label>
                                            <Textarea
                                                value={form.message}
                                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                                placeholder="Tell us about marketplace coverage, SKU volume, current reimbursement workflow, or operational leakage concerns."
                                                className="min-h-[120px] rounded-[22px] border-[#CFE0EA] bg-white px-4 py-4 text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20 resize-none"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full h-12 rounded-full bg-[#0B74DE] text-white text-[13px] font-semibold font-sans tracking-tight transition-all hover:bg-[#0869C9] shadow-[0_18px_40px_rgba(11,116,222,0.2)]">
                                            {isSubmitting ? (
                                                <>Preparing Inquiry...</>
                                            ) : (
                                                <>
                                                    Request Enterprise Briefing
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
