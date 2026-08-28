import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, ShieldCheck, BarChart3, Database, CreditCard, Activity, BriefcaseBusiness, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

export default function Sales() {
    usePageMeta({
        title: 'Margin Enterprise — Recovery Control for High-GMV Amazon Businesses',
        description: 'Margin helps $1M+ Amazon businesses establish what was paid, missed, reversed, or left unresolved—using evidence-led recovery assessment, reconciliation, and recurring control.',
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
        role: '',
        gmv: '',
        accounts: '',
        complexity: '',
        process: '',
        objective: '',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.email || !form.company || !form.role || !form.gmv) {
            toast({
                title: 'Required fields missing',
                description: 'Please fill in the required fields to request an assessment.',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.createSalesLead({
                name: form.name,
                email: form.email,
                company: form.company,
                role: form.role,
                gmv: form.gmv,
                accounts: form.accounts,
                complexity: form.complexity,
                process: form.process,
                objective: form.objective,
                notes: form.notes,
            });

            if (!response.ok || !response.data?.success) {
                throw new Error(response.error || 'We could not save your assessment request.');
            }

            setIsSubmitted(true);
            toast({
                title: 'Assessment request saved',
                description: 'Your information is now with the Margin sales team for review.',
            });
        } catch (error: any) {
            toast({
                title: 'Assessment request not saved',
                description: error?.message || 'Please try again in a moment.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026] font-sans">
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.45] z-0 [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.08),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(46,125,91,0.06),transparent_28%)]" />
            </div>

            <PublicNavbar variant="light" />

            <main className="relative z-10 pt-32 pb-24">
                {/* Hero Section */}
                <section className="container mx-auto px-6 max-w-5xl mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-10"
                    >
                        <div className="space-y-4">
                            <span className="text-[11px] font-bold text-[#0B74DE] tracking-tight uppercase">
                                For Amazon businesses managing $1M+ in annual GMV
                            </span>
                            <h1 className="font-lora text-4xl md:text-[68px] font-medium leading-[1.05] tracking-tight text-[#182026]">
                                At scale, Amazon recovery <br className="hidden md:block" />
                                cannot run on assumptions.
                            </h1>
                            <p className="max-w-2xl text-lg md:text-xl text-[#4D5B66] leading-relaxed tracking-tight">
                                Margin gives your finance and operations teams a controlled view of what Amazon paid, missed, reversed, or left unresolved—then turns the evidence into a clear recovery plan your team can own.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                            <Button 
                                asChild
                                className="h-12 px-8 rounded-md bg-[#0B74DE] text-[14px] font-semibold text-white shadow-lg shadow-[#0B74DE]/20 hover:bg-[#075EBA] transition-all"
                            >
                                <a href="#assessment">Request an Enterprise Assessment</a>
                            </Button>
                            <a href="#how-it-works" className="text-[14px] font-semibold text-[#182026] hover:underline flex items-center gap-2">
                                See how the assessment works <ArrowRight className="h-4 w-4" />
                            </a>
                        </div>

                        <div className="pt-8 border-t border-[#D8E3E8] flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-2 text-[13px] font-medium text-[#182026]">
                                <ShieldCheck className="h-4 w-4 text-[#0B74DE]" />
                                Evidence-led. Read-only by default. Your team approves the action.
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-bold text-[#8C9BA6] uppercase tracking-tight">
                                <span>Multi-account operations</span>
                                <span className="h-1 w-1 rounded-full bg-[#D8E3E8]" />
                                <span>SKU-level evidence</span>
                                <span className="h-1 w-1 rounded-full bg-[#D8E3E8]" />
                                <span>Reconciliation and payout verification</span>
                                <span className="h-1 w-1 rounded-full bg-[#D8E3E8]" />
                                <span>Recurring control</span>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Section 1: The Problem */}
                <section className="container mx-auto px-6 max-w-5xl mb-32">
                    <div className="grid lg:grid-cols-12 gap-16">
                        <div className="lg:col-span-5 space-y-6">
                            <h2 className="font-lora text-3xl font-medium tracking-tight text-[#182026] leading-tight">
                                The more you sell, the less you can afford to leave unresolved.
                            </h2>
                            <div className="space-y-4 text-[15px] text-[#4D5B66] leading-relaxed">
                                <p>
                                    At $1M+ in GMV, small marketplace discrepancies stop being small. Inventory moves across accounts, markets, warehouses, SKUs, and reporting periods.
                                </p>
                                <p>
                                    Reimbursements are approved, reversed, offset, or paid on different timelines. Teams often know that something is wrong without having one defensible record of what happened, what is still open, and who owns the next action.
                                </p>
                                <p className="font-semibold text-[#182026]">
                                    The result is not only missed recovery. It is poor financial visibility, duplicated work, slow close, and decisions made from incomplete evidence.
                                </p>
                            </div>
                        </div>
                        <div className="lg:col-span-7">
                            <div className="border-y border-[#D8E3E8] bg-white overflow-hidden">
                                <div className="px-6 py-4 border-b border-[#D8E3E8] bg-[#FAFAF7]">
                                    <h3 className="text-[12px] font-bold text-[#182026] uppercase tracking-tight">Margin helps your team answer five questions:</h3>
                                </div>
                                <div className="divide-y divide-[#D8E3E8]">
                                    {[
                                        { q: "What happened?", a: "The transaction, inventory, case, payout, or reversal trail." },
                                        { q: "What is financially material?", a: "The amount and operational significance of the unresolved issue." },
                                        { q: "What proves it?", a: "The source records and evidence supporting the finding." },
                                        { q: "What is still incomplete?", a: "The coverage limitation, missing record, or unresolved uncertainty." },
                                        { q: "What happens next?", a: "The accountable route: recover, investigate, remediate, monitor, or close." }
                                    ].map((item, i) => (
                                        <div key={i} className="px-6 py-5 grid sm:grid-cols-5 gap-4">
                                            <div className="sm:col-span-2 text-[13px] font-bold text-[#182026]">{item.q}</div>
                                            <div className="sm:col-span-3 text-[13px] text-[#4D5B66]">{item.a}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: The Promise */}
                <section className="bg-white border-y border-[#D8E3E8] py-24 mb-32">
                    <div className="container mx-auto px-6 max-w-5xl text-center space-y-8">
                        <h2 className="font-lora text-3xl md:text-4xl font-medium tracking-tight text-[#182026]">
                            One recovery operation. One evidence standard. <br />
                            One accountable view.
                        </h2>
                        <div className="max-w-3xl mx-auto space-y-6 text-lg text-[#4D5B66] leading-relaxed tracking-tight">
                            <p>
                                Margin is built for operators who have outgrown scattered spreadsheets, disconnected provider reports, and one-off reimbursement checks.
                            </p>
                            <p>
                                It creates a controlled recovery record for each material issue, connecting the underlying operational event to the financial outcome and the next action. Your team can see what is verified, what is pending, what has been paid, what has been reversed, and what still needs ownership.
                            </p>
                            <p className="font-semibold text-[#182026]">
                                You do not receive another dashboard to maintain. You receive a clearer operating view of marketplace money that should not be left to assumption.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 3: Who this is for */}
                <section className="container mx-auto px-6 max-w-5xl mb-32">
                    <div className="grid lg:grid-cols-2 gap-16 items-start">
                        <div className="space-y-12">
                            <div className="space-y-4">
                                <h2 className="font-lora text-3xl font-medium tracking-tight text-[#182026]">
                                    Built for complex Amazon operations—not ordinary private-label accounts.
                                </h2>
                                <p className="text-[#4D5B66] leading-relaxed">
                                    Margin Enterprise is designed for operators where the cost of an unresolved discrepancy is larger than the cost of investigating it properly.
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-8">
                                {[
                                    { title: "Aggregators and portfolio operators", desc: "Manage multiple brands, seller accounts, marketplaces, and operating teams with a common evidence and reconciliation standard." },
                                    { title: "Agencies and recovery operators", desc: "Give every client a defensible record of findings, evidence, status, payout, and next action without rebuilding the same process account by account." },
                                    { title: "High-volume brands", desc: "Control SKU-level discrepancies across large catalogues, rapid restock cycles, changing fulfillment patterns, and multiple reporting periods." },
                                    { title: "Cross-border operators", desc: "Bring a consistent recovery and evidence process to US, UK, EU, JP, and other marketplace operations where timing, currency, inventory, and reporting differences create additional complexity." }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-2">
                                        <h4 className="text-[14px] font-bold text-[#182026] uppercase tracking-tight">{item.title}</h4>
                                        <p className="text-[13px] text-[#66737F] leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-y border-[#D8E3E8] bg-transparent py-8">
                            <h3 className="mb-6 text-[11px] font-bold uppercase tracking-tight text-[#0B74DE]">Enterprise fit</h3>
                            <p className="mb-6 text-[15px] font-medium text-[#182026]">Margin is a strong fit when you are managing:</p>
                            <ul className="space-y-4">
                                {[
                                    "$1M+ in annual Amazon GMV",
                                    "multiple seller accounts, brands, or marketplaces",
                                    "substantial SKU volume or frequent inventory movement",
                                    "an internal finance, operations, or recovery team",
                                    "an incumbent reimbursement provider that you cannot independently verify",
                                    "recurring reversals, payout mismatches, or unresolved case work",
                                    "a requirement for an auditable operating record rather than a monthly estimate"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[14px] text-[#4D5B66]">
                                        <Check className="h-4 w-4 text-[#0B74DE] mt-0.5 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-8 pt-6 border-t border-[#D8E3E8]">
                                <p className="text-[12px] text-[#8C9BA6] italic">
                                    The $1M+ GMV threshold is a qualification signal, not a promise that every large account needs Margin. If the evidence does not support a meaningful opportunity, Margin should say so.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: What Margin controls */}
                <section className="bg-[#182026] py-24 mb-32 text-white overflow-hidden relative">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:40px_40px]" />
                    <div className="container mx-auto px-6 max-w-5xl relative z-10">
                        <div className="max-w-2xl mb-16">
                            <h2 className="font-lora text-3xl md:text-4xl font-medium tracking-tight mb-6">From discrepancy to verified outcome.</h2>
                            <p className="text-lg text-white/70 leading-relaxed">
                                Margin brings the recovery operation into one accountable sequence:
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
                            {[
                                { n: "01", title: "Establish coverage", desc: "Connect the relevant account or provide the required reports. Margin records what was examined, for which period, across which marketplace, account, SKU set, and report sources." },
                                { n: "02", title: "Reconstruct the event", desc: "Map the operational event: inbound shipment, warehouse movement, customer return, reimbursement, case, reversal, adjustment, or payout." },
                                { n: "03", title: "Establish the evidence", desc: "Separate what the source records prove from what is only possible, estimated, missing, or disputed." },
                                { n: "04", title: "Prioritize material issues", desc: "Focus the team on findings where the financial value and evidence quality justify action. Do not bury important work in a list of unranked alerts." },
                                { n: "05", title: "Assign the next action", desc: "Recover, investigate, remediate, monitor, request more evidence, or close with a documented reason." },
                                { n: "06", title: "Verify the outcome", desc: "A case is not complete because Amazon marked it approved. Margin follows the financial outcome through payment, reversal, offset, or final reconciliation." }
                            ].map((step, i) => (
                                <div key={i} className="space-y-4">
                                    <div className="text-[10px] font-bold text-[#0B74DE] uppercase tracking-tight">{step.n}</div>
                                    <h4 className="text-lg font-semibold tracking-tight">{step.title}</h4>
                                    <p className="text-[14px] text-white/60 leading-relaxed">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 5: What your team receives */}
                <section className="container mx-auto px-6 max-w-5xl mb-32">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="font-lora text-3xl md:text-4xl font-medium tracking-tight text-[#182026] mb-6">
                            The operating record your recovery process has been missing.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            { icon: ShieldCheck, title: "A defensible evidence trail", desc: "Every material finding should point back to the records that support it. Your team can see the source, the logic, the confidence, the limitation, and the action state." },
                            { icon: BarChart3, title: "A prioritized recovery queue", desc: "Focus attention on the issues that matter financially and operationally instead of treating every anomaly as equally urgent." },
                            { icon: Database, title: "A shared view across accounts and markets", desc: "Create a common operating standard for brand groups, agencies, and portfolio operators without forcing every team to maintain a separate interpretation of recovery data." },
                            { icon: CreditCard, title: "Payout and reversal verification", desc: "Track the difference between a case being approved, a reimbursement being issued, a payout being received, and the outcome remaining correct after later adjustments." },
                            { icon: Activity, title: "Recurring control", desc: "Move from one-off recovery work toward a scheduled examination and a consistent Control Statement that shows what changed, what was recovered, what reversed, and what requires attention." },
                            { icon: BriefcaseBusiness, title: "A clear handoff", desc: "Your team can own the work, ask Margin to handle an approved recovery route, or use Margin as an independent control layer alongside an existing provider." }
                        ].map((benefit, i) => (
                            <div key={i} className="border-t border-[#D8E3E8] bg-transparent py-8 flex gap-5">
                                <div className="h-9 w-9 rounded-[4px] bg-[#F8FAFB] border border-[#D8E3E8] flex items-center justify-center flex-shrink-0">
                                    <benefit.icon className="h-4 w-4 text-[#66737F]" strokeWidth={1.5} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-[16px] font-bold text-[#182026]">{benefit.title}</h4>
                                    <p className="text-[14px] text-[#66737F] leading-relaxed">{benefit.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section 6: The Difference */}
                <section className="container mx-auto px-6 max-w-5xl mb-32">
                    <div className="border-y border-[#D8E3E8] bg-[#FAFAF7] py-8 md:py-12 overflow-hidden relative">
                        <div className="grid lg:grid-cols-2 gap-12 relative z-10">
                            <div className="space-y-6">
                                <h2 className="font-lora text-3xl font-medium tracking-tight text-[#182026]">
                                    Your existing provider may be working. <br />
                                    Margin helps you verify that.
                                </h2>
                                <p className="text-[16px] text-[#4D5B66] leading-relaxed">
                                    Margin is not designed to force a provider switch without evidence. It can examine the current recovery state and show:
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        "what your provider has identified;",
                                        "what has been submitted;",
                                        "what Amazon has approved;",
                                        "what has actually been paid;",
                                        "what has been reversed or offset;",
                                        "what remains outside the provider’s scope;",
                                        "and what work is still being carried by your team."
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-[14px] text-[#182026] font-medium">
                                            <div className="h-1.5 w-1.5 rounded-full bg-[#0B74DE]" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex flex-col justify-center space-y-8">
                                <div className="border-t border-[#D8E3E8] pt-6">
                                    <p className="text-[15px] text-[#4D5B66] leading-relaxed italic">
                                        "If the current operation is working, Margin should say so. If there is a gap, the evidence should make the gap visible."
                                    </p>
                                </div>
                                <p className="text-[16px] font-semibold text-[#182026] leading-relaxed">
                                    That makes Margin useful as an operating layer, a second opinion, or a controlled replacement—not another provider asking you to trust an opaque number.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 7: Economic Value */}
                <section className="container mx-auto px-6 max-w-5xl mb-32">
                    <div className="max-w-3xl mb-12">
                        <h2 className="font-lora text-3xl md:text-4xl font-medium tracking-tight text-[#182026] mb-4">Economic value</h2>
                        <p className="text-lg text-[#4D5B66] leading-relaxed">
                            The business case is not “more alerts.” It is less unresolved money and less unowned work. For an enterprise operator, Margin’s value can come from several sources:
                        </p>
                    </div>

                    <div className="border-y border-[#D8E3E8] bg-white overflow-hidden mb-12">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#FAFAF7] hover:bg-[#FAFAF7]">
                                    <TableHead className="w-[280px] text-[11px] font-bold uppercase tracking-tight text-[#182026]">Value driver</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-tight text-[#182026]">Enterprise impact</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[
                                    { driver: "Recovered marketplace value", impact: "Finds and advances materially supported recovery opportunities." },
                                    { driver: "Reduced leakage", impact: "Identifies recurring operational failures that continue creating discrepancies." },
                                    { driver: "Lower manual workload", impact: "Replaces scattered checks, repeated exports, and unstructured follow-up." },
                                    { driver: "Faster financial close", impact: "Gives finance and operations a clearer record of what happened and what remains open." },
                                    { driver: "Better provider accountability", impact: "Independently checks whether paid recovery work produced the expected result." },
                                    { driver: "Reduced decision risk", impact: "Separates verified outcomes from estimates and incomplete coverage." }
                                ].map((row, i) => (
                                    <TableRow key={i} className="hover:bg-transparent">
                                        <TableCell className="font-bold text-[13px] text-[#182026] py-5">{row.driver}</TableCell>
                                        <TableCell className="text-[13px] text-[#4D5B66] py-5">{row.impact}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h3 className="text-[18px] font-semibold text-[#182026]">The assessment should quantify your case</h3>
                            <p className="text-[15px] text-[#4D5B66] leading-relaxed">
                                Margin should not publish a universal ROI promise. During the Enterprise Assessment, the team should establish a baseline using the account’s own data:
                            </p>
                            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                                {[
                                    "annual and monthly GMV",
                                    "marketplace and account coverage",
                                    "SKU and order complexity",
                                    "prior recovery volume",
                                    "unresolved case inventory",
                                    "provider fees and internal labor",
                                    "reversals, offsets, and payout mismatches",
                                    "the value of recurring control work"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[13px] text-[#66737F]">
                                        <div className="h-1 w-1 rounded-full bg-[#D8E3E8]" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border-y border-[#0B74DE]/20 bg-[#0B74DE]/5 py-8 text-center">
                            <p className="text-[16px] font-semibold text-[#182026] leading-relaxed">
                                The commercial decision should be based on the value Margin can establish—not a generic industry percentage.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 8: How it starts */}
                <section className="container mx-auto px-6 max-w-5xl mb-32" id="how-it-works">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="font-lora text-3xl md:text-4xl font-medium tracking-tight text-[#182026] mb-4">How an Enterprise engagement starts</h2>
                        <p className="text-lg text-[#4D5B66]">Start with a controlled assessment—not a platform migration.</p>
                    </div>

                    <div className="space-y-6">
                        {[
                            { step: "1. Scope the operation", desc: "A Margin specialist reviews your account structure, marketplace coverage, SKU complexity, current recovery process, provider relationship, and reporting environment." },
                            { step: "2. Establish the examination boundary", desc: "Together, we define the accounts, periods, data sources, and evidence required for a meaningful first assessment." },
                            { step: "3. Produce the first control view", desc: "Margin shows what is verified, what is incomplete, what is financially material, and what action is justified." },
                            { step: "4. Choose the operating model", desc: "Your team can manage the work, ask Margin to handle a defined recovery route, or continue with a recurring control and reporting relationship." },
                            { step: "5. Expand only when the evidence earns it", desc: "Additional accounts, marketplaces, SKU sets, or recurring examinations should follow demonstrated value—not an arbitrary implementation schedule." }
                        ].map((item, i) => (
                            <div key={i} className="border-t border-[#D8E3E8] bg-transparent py-6 flex flex-col sm:flex-row sm:items-center gap-6 group transition-colors hover:bg-[#F8FAFB]/70">
                                <div className="sm:w-[280px] flex-shrink-0">
                                    <h4 className="text-[16px] font-bold text-[#182026]">{item.step}</h4>
                                </div>
                                <div className="text-[14px] text-[#66737F] leading-relaxed">{item.desc}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 border-y border-[#D8E3E8] bg-[#FAFAF7] py-8 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-4 text-[13px] font-bold text-[#182026] uppercase tracking-tight">
                            <span>Assessment</span>
                            <ArrowRight className="h-3 w-3 text-[#8C9BA6]" />
                            <span>Evidence baseline</span>
                            <ArrowRight className="h-3 w-3 text-[#8C9BA6]" />
                            <span>Controlled pilot</span>
                            <ArrowRight className="h-3 w-3 text-[#8C9BA6]" />
                            <span>Recovery decision</span>
                            <ArrowRight className="h-3 w-3 text-[#8C9BA6]" />
                            <span>Recurring control</span>
                        </div>
                    </div>
                </section>

                {/* Section 9: Security */}
                <section className="container mx-auto px-6 max-w-5xl mb-32">
                    <div className="grid lg:grid-cols-12 gap-16 items-start">
                        <div className="lg:col-span-5 space-y-6">
                            <h2 className="font-lora text-3xl font-medium tracking-tight text-[#182026]">Your marketplace data remains under a defined access boundary.</h2>
                            <p className="text-[15px] text-[#4D5B66] leading-relaxed">
                                Margin is designed around controlled access, evidence traceability, and server-owned authorization. We will state the exact controls available for your engagement before data is connected or uploaded.
                            </p>
                            <p className="text-[14px] font-semibold text-[#182026]">
                                Formal certifications and deployment options are disclosed by their actual status—not by generic “enterprise-grade” language.
                            </p>
                        </div>
                        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-x-12 gap-y-6 border-y border-[#D8E3E8] bg-white py-8">
                            {[
                                "read-only access by default",
                                "explicit account scope",
                                "role-based access control",
                                "authentication & session controls",
                                "audit logs for sensitive actions",
                                "evidence retention policy",
                                "data-processing transparency",
                                "incident-response contact",
                                "export & closure process",
                                "current security attestation status"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-[13px] text-[#4D5B66]">
                                    <ShieldCheck className="h-4 w-4 text-[#0B74DE] flex-shrink-0" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 10: FAQ */}
                <section className="container mx-auto px-6 max-w-5xl mb-32">
                    <h2 className="font-lora text-3xl font-medium tracking-tight text-[#182026] mb-12">What enterprise buyers need to know before they book</h2>
                    <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
                        {[
                            { q: "Will Margin replace our current provider?", a: "Not automatically. Margin can assess your current operation, identify gaps, and recommend a replacement only when the evidence supports it." },
                            { q: "Does Margin need access to our Amazon account?", a: "The required access depends on the assessment scope. Margin should state exactly what is requested, why it is needed, and what remains read-only before connection." },
                            { q: "Can we start with one account or brand?", a: "Yes. A controlled first scope is preferable to a broad rollout without an evidence baseline." },
                            { q: "What if the assessment finds nothing?", a: "Margin should report that honestly. A clean or unsupported result is more valuable than an invented recovery claim." },
                            { q: "Do you provide recovery execution?", a: "Margin can route a verified opportunity into the appropriate engagement. The scope, fee, approval, and ownership should be clear before work begins." },
                            { q: "Can finance and operations use the same record?", a: "That is the purpose of the evidence and control layer: finance can see the financial state, operations can see the underlying event, and leadership can see ownership and materiality." }
                        ].map((faq, i) => (
                            <div key={i} className="space-y-3">
                                <h4 className="text-[16px] font-bold text-[#182026]">{faq.q}</h4>
                                <p className="text-[14px] text-[#66737F] leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section 11: Founder Statement */}
                <section className="container mx-auto px-6 max-w-5xl mb-32">
                    <div className="py-16 border-t border-[#D8E3E8] text-center max-w-3xl mx-auto">
                        <p className="font-lora text-2xl md:text-3xl font-medium tracking-tight text-[#182026] leading-relaxed mb-8 italic">
                            "At $1M+ in GMV, recovery is no longer a side task. It is part of your financial operation. Margin was built to make that operation visible, evidence-backed, and accountable—without asking you to trust an unexplained number."
                        </p>
                        <p className="text-[12px] font-bold text-[#8C9BA6] uppercase tracking-tight">
                            — Founder & CEO, Margin
                        </p>
                    </div>
                </section>

                {/* Section 12: Application Form */}
                <section className="container mx-auto px-6 max-w-5xl" id="assessment">
                    <div className="rounded-2xl border border-[#D8E3E8] bg-white shadow-2xl shadow-[#182026]/5 overflow-hidden">
                        <div className="grid lg:grid-cols-5">
                            <div className="lg:col-span-2 bg-[#182026] p-8 md:p-12 text-white flex flex-col justify-between">
                                <div className="space-y-6">
                                    <h2 className="font-lora text-3xl font-medium tracking-tight">Start with the operation you need to control.</h2>
                                    <p className="text-white/60 leading-relaxed">
                                        A Margin specialist will review your operating profile and confirm whether an Enterprise assessment is appropriate. 
                                    </p>
                                    <div className="space-y-4 pt-6">
                                        <div className="flex items-center gap-3 text-[13px] text-white/80">
                                            <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-3 w-3" />
                                            </div>
                                            <span>No commitment required</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[13px] text-white/80">
                                            <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-3 w-3" />
                                            </div>
                                            <span>No provider switch required</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[13px] text-white/80">
                                            <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-3 w-3" />
                                            </div>
                                            <span>No account connection required</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-12 text-[12px] text-white/40 leading-relaxed">
                                    Your information is used to scope the conversation. No account connection or provider change is required to request an assessment.
                                </div>
                            </div>
                            
                            <div className="lg:col-span-3 p-8 md:p-12">
                                {isSubmitted ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                        <div className="h-16 w-16 rounded-full bg-[#0B74DE]/10 flex items-center justify-center mb-6">
                                            <ArrowUpRight className="h-8 w-8 text-[#0B74DE]" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-[#182026] mb-4">Assessment Request Prepared</h3>
                                        <p className="text-[#66737F] max-w-sm mb-8">
                                            Your enterprise profile has been formatted for review. Please send the email from your client so our team can follow up.
                                        </p>
                                        <Button 
                                            onClick={() => setIsSubmitted(false)}
                                            variant="outline"
                                            className="h-11 rounded-md border-[#D8E3E8] px-8 text-[13px] font-semibold"
                                        >
                                            Start another request
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-8">
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-[#182026] uppercase tracking-tight">Full name</label>
                                                <Input 
                                                    value={form.name}
                                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                    placeholder="Your name"
                                                    className="h-11 rounded-md border-[#D8E3E8] focus-visible:ring-[#0B74DE]"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-[#182026] uppercase tracking-tight">Work email</label>
                                                <Input 
                                                    type="email"
                                                    value={form.email}
                                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                    placeholder="name@company.com"
                                                    className="h-11 rounded-md border-[#D8E3E8] focus-visible:ring-[#0B74DE]"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-[#182026] uppercase tracking-tight">Company or brand group</label>
                                                <Input 
                                                    value={form.company}
                                                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                                                    placeholder="Legal entity or portfolio"
                                                    className="h-11 rounded-md border-[#D8E3E8] focus-visible:ring-[#0B74DE]"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-[#182026] uppercase tracking-tight">Your role</label>
                                                <Select onValueChange={(v) => setForm({ ...form, role: v })}>
                                                    <SelectTrigger className="h-11 rounded-md border-[#D8E3E8]">
                                                        <SelectValue placeholder="Select role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Founder / CEO">Founder / CEO</SelectItem>
                                                        <SelectItem value="CFO / Finance">CFO / Finance</SelectItem>
                                                        <SelectItem value="Operations">Operations</SelectItem>
                                                        <SelectItem value="Marketplace lead">Marketplace lead</SelectItem>
                                                        <SelectItem value="Agency / Aggregator">Agency / Aggregator</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-[#182026] uppercase tracking-tight">Annual Amazon GMV</label>
                                                <Select onValueChange={(v) => setForm({ ...form, gmv: v })}>
                                                    <SelectTrigger className="h-11 rounded-md border-[#D8E3E8]">
                                                        <SelectValue placeholder="Select range" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="$1M–$5M">$1M–$5M</SelectItem>
                                                        <SelectItem value="$5M–$25M">$5M–$25M</SelectItem>
                                                        <SelectItem value="$25M–$100M">$25M–$100M</SelectItem>
                                                        <SelectItem value="$100M+">$100M+</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-[#182026] uppercase tracking-tight">Accounts and marketplaces</label>
                                                <Input 
                                                    value={form.accounts}
                                                    onChange={(e) => setForm({ ...form, accounts: e.target.value })}
                                                    placeholder="e.g. 3 accounts, 5 countries"
                                                    className="h-11 rounded-md border-[#D8E3E8] focus-visible:ring-[#0B74DE]"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-[#182026] uppercase tracking-tight">Current recovery process</label>
                                                <Select onValueChange={(v) => setForm({ ...form, process: v })}>
                                                    <SelectTrigger className="h-11 rounded-md border-[#D8E3E8]">
                                                        <SelectValue placeholder="Select process" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Internal team">Internal team</SelectItem>
                                                        <SelectItem value="Provider">Provider</SelectItem>
                                                        <SelectItem value="Spreadsheet/manual">Spreadsheet/manual</SelectItem>
                                                        <SelectItem value="Multiple providers">Multiple providers</SelectItem>
                                                        <SelectItem value="No consistent process">No consistent process</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-[#182026] uppercase tracking-tight">What are you trying to establish?</label>
                                                <Select onValueChange={(v) => setForm({ ...form, objective: v })}>
                                                    <SelectTrigger className="h-11 rounded-md border-[#D8E3E8]">
                                                        <SelectValue placeholder="Select objective" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Unresolved recovery">Unresolved recovery</SelectItem>
                                                        <SelectItem value="Provider verification">Provider verification</SelectItem>
                                                        <SelectItem value="Reversal/payout control">Reversal/payout control</SelectItem>
                                                        <SelectItem value="Multi-account reconciliation">Multi-account reconciliation</SelectItem>
                                                        <SelectItem value="Recurring recovery operations">Recurring recovery operations</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-[#182026] uppercase tracking-tight">Anything we should know before the assessment?</label>
                                            <Textarea 
                                                value={form.notes}
                                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                                placeholder="Describe marketplace coverage, operating complexity, current workflow, or unresolved concern."
                                                className="min-h-[100px] rounded-md border-[#D8E3E8] focus-visible:ring-[#0B74DE]"
                                            />
                                        </div>

                                        <Button 
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="h-12 w-full rounded-md bg-[#0B74DE] text-[14px] font-semibold text-white shadow-lg shadow-[#0B74DE]/20 hover:bg-[#075EBA] transition-all"
                                        >
                                            {isSubmitting ? 'Preparing Request...' : 'Request Enterprise Assessment'}
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

// Minimal table components for Section 7
const Table = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <table className={cn("w-full border-collapse text-left", className)}>{children}</table>
);
const TableHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <thead className={className}>{children}</thead>
);
const TableBody = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <tbody className={className}>{children}</tbody>
);
const TableRow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <tr className={cn("border-b border-[#D8E3E8] last:border-0", className)}>{children}</tr>
);
const TableHead = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <th className={cn("px-6 py-4 text-left align-middle", className)}>{children}</th>
);
const TableCell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <td className={cn("px-6 py-4 align-middle", className)}>{children}</td>
);
