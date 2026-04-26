import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { api } from '@/lib/api';
import {
    CheckCircle2,
    Sparkles,
    ArrowRight,
    Mail,
    MessageSquare,
    ChevronLeft
} from 'lucide-react';

const profileOptions = [
    { id: 'brand', label: 'Brand owner', detail: 'Single brand or private-label operator' },
    { id: 'agency', label: 'Agency / aggregator', detail: 'Managing multiple seller accounts or portfolio brands' },
    { id: 'other', label: 'Strategic partner', detail: 'Finance, operations, or reimbursement specialist' }
];

const goalOptions = [
    { id: 'recover', label: 'Find missed reimbursements', detail: 'Start with the money Amazon missed.' },
    { id: 'audit', label: 'Run a historical audit', detail: 'Review the backlog before launch or migration.' },
    { id: 'automate', label: 'Automate filing operations', detail: 'Move from detection into evidence and filing.' }
];

const waitlistHighlights = [
    {
        title: 'Priority rollout',
        detail: 'Access is opened in controlled waves so onboarding stays fast and hands-on.'
    },
    {
        title: 'Built for operator clarity',
        detail: 'The same product shows what is detected, blocked, filed, approved, and paid.'
    },
    {
        title: 'Truth-gated filing',
        detail: 'Weak, duplicate, or thread-only cases stay held instead of being pushed through.'
    }
];

const stepMeta = [
    { id: 1, label: 'Profile' },
    { id: 2, label: 'Contact' },
    { id: 3, label: 'Intent' }
];

type WaitlistSubmissionResult = {
    email: string;
    message: string;
    alreadyRegistered: boolean;
    confirmationEmailStatus: 'queued' | 'not_resent' | 'failed' | null;
    captureMode?: 'database' | 'email_only';
};

const Waitlist = () => {
    const location = useLocation();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<WaitlistSubmissionResult | null>(null);
    const [formData, setFormData] = useState({
        user_type: '',
        brand_count: '',
        annual_revenue: '',
        email: '',
        contact_handle: '',
        primary_goal: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelection = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        if (step === 1 && (!formData.user_type || !formData.annual_revenue)) {
            toast({ title: "Identification Required", description: "Please select your profile and revenue band.", variant: "destructive" });
            return;
        }
        if (step === 2 && !formData.email) {
            toast({ title: "Contact Required", description: "A work email is required for priority access.", variant: "destructive" });
            return;
        }
        setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    const requestContext = {
        source_page: '/waitlist',
        intent: new URLSearchParams(location.search).get('intent') || undefined,
        reason: new URLSearchParams(location.search).get('reason') || undefined,
    };

    const handleQuickCaptureSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email.trim()) {
            toast({ title: "Email Required", description: "Add your work email and we will secure your place.", variant: "destructive" });
            return;
        }

        setIsQuickSubmitting(true);
        try {
            const response = await api.quickJoinWaitlist({
                email: formData.email.trim(),
                ...requestContext,
            });

            if (response.ok) {
                const message = response.data?.message || "Your details have been received.";
                const confirmationEmailStatus = response.data?.confirmation_email_status || null;

                setSubmissionResult({
                    email: formData.email.trim(),
                    message,
                    alreadyRegistered: false,
                    confirmationEmailStatus,
                    captureMode: response.data?.capture_mode || 'email_only',
                });
                setIsSuccess(true);
                toast({
                    title: "Waitlist confirmed",
                    description: message,
                });
            } else {
                toast({
                    title: "Unable to submit",
                    description: response.error || "We could not secure your waitlist request.",
                    variant: "destructive"
                });
            }
        } catch (_error) {
            toast({
                title: "Network issue",
                description: "The request took too long or the connection was interrupted.",
                variant: "destructive"
            });
        } finally {
            setIsQuickSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.primary_goal) {
            toast({ title: "Selection Required", description: "Please select your primary goal.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.joinWaitlist(formData);
            if (response.ok) {
                const alreadyRegistered = response.data?.already_registered === true;
                const message = response.data?.message || "Your details have been received.";
                const confirmationEmailStatus = response.data?.confirmation_email_status || null;

                setSubmissionResult({
                    email: formData.email.trim(),
                    message,
                    alreadyRegistered,
                    confirmationEmailStatus,
                    captureMode: 'database',
                });
                setIsSuccess(true);
                toast({
                    title: alreadyRegistered ? "Already on waitlist" : "Waitlist confirmed",
                    description: message,
                });
            } else {
                toast({
                    title: "Unable to submit",
                    description: response.error || "We could not save your waitlist request.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Network issue",
                description: "The request took too long or the connection was interrupted.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const sectionVariants = {
        initial: { opacity: 0, x: 10 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -10 }
    };

    const alreadyRegistered = submissionResult?.alreadyRegistered === true;
    const captureMode = submissionResult?.captureMode || 'database';
    const successBadge = alreadyRegistered ? 'Waitlist already active' : 'Priority queue confirmed';
    const successHeading = alreadyRegistered
        ? 'This address is already on the waitlist.'
        : "You're in the next access review queue.";
    const successBody = alreadyRegistered
        ? 'We recognized this email as an existing waitlist entry and kept your original place in line.'
        : captureMode === 'email_only'
            ? 'Your email is secured and queued for the next rollout update without needing the full onboarding form.'
            : 'Your details are secured and added to the priority rollout list.';
    const emailConfirmationBody = submissionResult?.confirmationEmailStatus === 'failed'
        ? 'We secured your place, but the confirmation email is taking a little longer than expected.'
        : alreadyRegistered
        ? 'No new confirmation email was sent because this address was already registered.'
        : `A confirmation email is being sent to ${submissionResult?.email || 'the email you provided'}.`;
    const nextSteps = alreadyRegistered
        ? [
            'Your original waitlist position remains active.',
            'When access opens, we will contact you through the details already on file.'
        ]
        : captureMode === 'email_only'
        ? [
            'Your email has been secured in the early-access queue.',
            'If we need more rollout context, we will reach out directly through the address you provided.'
        ]
        : [
            'Your waitlist entry has been secured.',
            'When your access window opens, we will reach out through the contact path you provided.'
        ];

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-white/15 selection:text-white">
            <div
                className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(133,170,255,0.1),transparent_40%),radial-gradient(circle_at_84%_0%,rgba(255,255,255,0.05),transparent_42%)]" />
                <div className="absolute inset-x-0 bottom-0 h-[760px] bg-[radial-gradient(circle_at_20%_100%,rgba(125,149,181,0.08),transparent_44%),radial-gradient(circle_at_76%_88%,rgba(255,255,255,0.04),transparent_48%)]" />
            </div>

            <PublicNavbar />

            <main className="relative z-10 px-4 pb-24 pt-28 md:px-6 md:pb-28 md:pt-32">
                <div className="mx-auto max-w-[1180px]">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mx-auto max-w-[860px] space-y-8"
                    >
                        <section className="space-y-5">
                            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium tracking-tight text-white/72">
                                <span>Priority access</span>
                                <span className="h-1 w-1 rounded-full bg-[#8fb7ff]/80" />
                                <span className="text-white/46">Seller rollout queue</span>
                            </div>

                            <div className="space-y-4">
                                <h1 className="max-w-[620px] text-[38px] font-light leading-[0.95] tracking-tight text-white md:text-[60px]">
                                    Join the next Margin onboarding wave.
                                </h1>
                                <p className="max-w-[560px] text-[16px] leading-7 text-white/58 md:text-lg md:leading-8">
                                    Early access is being opened in controlled waves for Amazon sellers, operators, and aggregators who want reimbursement visibility before broad rollout.
                                </p>
                            </div>
                        </section>

                        {!isSuccess && (
                            <section className="overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] px-5 py-5 shadow-[0_24px_72px_rgba(0,0,0,0.28)] md:px-6">
                                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                                    <div className="max-w-[520px] space-y-2">
                                        <div className="text-[11px] font-medium tracking-tight text-white/38">
                                            Fast lane
                                        </div>
                                        <h2 className="text-[24px] font-light leading-[1.04] tracking-tight text-white md:text-[30px]">
                                            Join the waitlist in one step.
                                        </h2>
                                        <p className="text-[14px] leading-6 text-white/54">
                                            Drop your work email and we will secure your place right away. You can still share richer rollout context in the longer form below.
                                        </p>
                                    </div>

                                    <form onSubmit={handleQuickCaptureSubmit} className="w-full max-w-[420px]">
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                            <div className="relative flex-1">
                                                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/24" />
                                                <Input
                                                    type="email"
                                                    name="email"
                                                    placeholder="you@company.com"
                                                    className="h-12 rounded-[18px] border-white/10 bg-white/[0.02] pl-11 text-[14px] tracking-tight placeholder:text-white/18 focus:border-white/18"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={isQuickSubmitting}
                                                className={`h-12 rounded-[18px] border border-white/10 px-5 text-[13px] font-medium tracking-tight transition ${isQuickSubmitting ? 'bg-white/[0.06] text-white/32' : 'bg-white text-black hover:bg-white/92 hover:text-black'}`}
                                            >
                                                {isQuickSubmitting ? (
                                                    <div className="flex items-center gap-3">
                                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/15 border-t-black/70" />
                                                        Securing spot
                                                    </div>
                                                ) : (
                                                    'Join waitlist'
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </section>
                        )}

                        <AnimatePresence mode="wait">
                            {!isSuccess ? (
                                <motion.div
                                    key={step}
                                    variants={sectionVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.35 }}
                                    className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.018)_16%,rgba(8,8,9,0.98)_100%)] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.36)] md:p-7"
                                >
                                    <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#8fb7ff]/40 to-transparent" />
                                    <div className="pointer-events-none absolute -right-16 top-10 h-32 w-32 rounded-full bg-[#7aa6ff]/10 blur-3xl" />

                                    <div className="relative">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="space-y-2">
                                                <div className="text-[11px] font-medium tracking-tight text-white/40">
                                                    {step === 1 ? 'Step 1 · Profile' : step === 2 ? 'Step 2 · Contact' : 'Step 3 · Intent'}
                                                </div>
                                                <h2 className="text-[28px] font-light leading-[1.02] tracking-tight text-white md:text-[34px]">
                                                    {step === 1 ? 'Tell us who you are' : step === 2 ? 'Where should we reach you?' : 'What should Margin solve first?'}
                                                </h2>
                                                <p className="max-w-[480px] text-[14px] leading-6 text-white/56 md:text-[15px]">
                                                    {step === 1
                                                        ? 'We prioritize access based on seller context and operating complexity.'
                                                        : step === 2
                                                            ? 'Use the work email or channel we should use when your access opens.'
                                                            : 'This tells us which onboarding path should come first when you are invited in.'}
                                                </p>
                                            </div>

                                            <div className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium tracking-tight text-white/72">
                                                {step} of 3
                                            </div>
                                        </div>

                                        <div className="mt-6 grid grid-cols-3 gap-2">
                                            {stepMeta.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className={`rounded-full border px-3 py-2 text-center text-[11px] font-medium tracking-tight transition-colors ${step === item.id
                                                        ? 'border-[#3c5a81] bg-[#10161f] text-[#dbe7fb]'
                                                        : step > item.id
                                                            ? 'border-white/12 bg-white/[0.04] text-white/70'
                                                            : 'border-white/8 bg-transparent text-white/32'
                                                        }`}
                                                >
                                                    {item.label}
                                                </div>
                                            ))}
                                        </div>

                                        {step === 1 && (
                                            <div className="mt-8 space-y-8">
                                                <div className="space-y-3">
                                                    <Label className="text-[11px] font-medium tracking-tight text-white/42">Profile</Label>
                                                    <div className="overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.02]">
                                                        {profileOptions.map((item) => (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => handleSelection('user_type', item.id)}
                                                                className={`flex w-full items-start gap-3 border-b border-white/8 px-4 py-4 text-left transition-all last:border-b-0 ${formData.user_type === item.id
                                                                    ? 'bg-[#10161f]'
                                                                    : 'hover:bg-white/[0.03]'
                                                                    }`}
                                                            >
                                                                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${formData.user_type === item.id ? 'border-[#5f84ba] bg-[#5f84ba]' : 'border-white/20'}`}>
                                                                    <div className={`h-1.5 w-1.5 rounded-full ${formData.user_type === item.id ? 'bg-[#050505]' : 'bg-transparent'}`} />
                                                                </div>
                                                                <div>
                                                                    <div className={`text-[15px] font-medium tracking-tight ${formData.user_type === item.id ? 'text-white' : 'text-white/78'}`}>{item.label}</div>
                                                                    <div className="mt-1 text-[13px] leading-5 text-white/45">{item.detail}</div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-[11px] font-medium tracking-tight text-white/42">Annual revenue</Label>
                                                    <Select
                                                        onValueChange={(v) => handleSelection('annual_revenue', v)}
                                                        value={formData.annual_revenue}
                                                    >
                                                        <SelectTrigger className="h-14 rounded-[20px] border-white/10 bg-white/[0.02] px-4 text-[13px] tracking-tight text-white focus:border-white/18">
                                                            <SelectValue placeholder="Select revenue band" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-[20px] border-white/10 bg-[#090909] text-white">
                                                            <SelectItem value="starter">Starter (&lt;$200k)</SelectItem>
                                                            <SelectItem value="growing">Growing ($200k - $1M)</SelectItem>
                                                            <SelectItem value="scaling">Scaling ($1M - $10M)</SelectItem>
                                                            <SelectItem value="enterprise">Enterprise ($10M+)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <Button
                                                    onClick={nextStep}
                                                    className="h-12 w-full justify-between rounded-[18px] border border-white/10 bg-white px-5 text-[13px] font-medium tracking-tight text-black transition hover:bg-white/92 hover:text-black"
                                                >
                                                    Continue
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}

                                        {step === 2 && (
                                            <div className="mt-8 space-y-8">
                                                <div className="space-y-4">
                                                    <div className="space-y-3">
                                                        <Label htmlFor="email" className="text-[11px] font-medium tracking-tight text-white/42">Work email</Label>
                                                        <div className="relative">
                                                            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/24" />
                                                            <Input
                                                                id="email"
                                                                name="email"
                                                                type="email"
                                                                placeholder="you@company.com"
                                                                className="h-14 rounded-[20px] border-white/10 bg-white/[0.02] pl-11 text-[14px] tracking-tight placeholder:text-white/18 focus:border-white/18"
                                                                value={formData.email}
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label htmlFor="contact_handle" className="text-[11px] font-medium tracking-tight text-white/42">Priority contact channel</Label>
                                                        <div className="relative">
                                                            <MessageSquare className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/24" />
                                                            <Input
                                                                id="contact_handle"
                                                                name="contact_handle"
                                                                placeholder="WhatsApp, Telegram, or best direct line"
                                                                className="h-14 rounded-[20px] border-white/10 bg-white/[0.02] pl-11 text-[14px] tracking-tight placeholder:text-white/18 focus:border-white/18"
                                                                value={formData.contact_handle}
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <Button
                                                        variant="outline"
                                                        onClick={prevStep}
                                                        className="h-12 rounded-[18px] border-white/10 bg-transparent px-4 text-white/68 hover:bg-white/[0.04] hover:text-white"
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        onClick={nextStep}
                                                        className="h-12 flex-1 justify-between rounded-[18px] border border-white/10 bg-white px-5 text-[13px] font-medium tracking-tight text-black transition hover:bg-white/92 hover:text-black"
                                                    >
                                                        Continue
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {step === 3 && (
                                            <div className="mt-8 space-y-8">
                                                <div className="space-y-3">
                                                    <Label className="text-[11px] font-medium tracking-tight text-white/42">Primary goal</Label>
                                                    <div className="space-y-1 overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.02]">
                                                        {goalOptions.map((item) => (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => handleSelection('primary_goal', item.id)}
                                                                className={`w-full border-b border-white/8 px-4 py-4 text-left transition-all last:border-b-0 ${formData.primary_goal === item.id
                                                                    ? 'bg-[#10161f]'
                                                                    : 'hover:bg-white/[0.03]'
                                                                    }`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${formData.primary_goal === item.id ? 'border-[#5f84ba] bg-[#5f84ba]' : 'border-white/20'}`}>
                                                                        <div className={`h-1.5 w-1.5 rounded-full ${formData.primary_goal === item.id ? 'bg-[#050505]' : 'bg-transparent'}`} />
                                                                    </div>
                                                                    <div>
                                                                        <div className={`text-[15px] font-medium tracking-tight ${formData.primary_goal === item.id ? 'text-white' : 'text-white/78'}`}>{item.label}</div>
                                                                        <div className="mt-1 text-[13px] leading-5 text-white/45">{item.detail}</div>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="text-center text-[11px] font-medium tracking-tight text-white/48">
                                                    Priority access stays private and enrollment data is encrypted.
                                                </div>

                                                <div className="flex gap-3">
                                                    <Button
                                                        variant="outline"
                                                        onClick={prevStep}
                                                        disabled={isSubmitting}
                                                        className="h-12 rounded-[18px] border-white/10 bg-transparent px-4 text-white/68 hover:bg-white/[0.04] hover:text-white"
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        onClick={handleSubmit}
                                                        disabled={isSubmitting}
                                                        className={`h-12 flex-1 rounded-[18px] border border-white/10 px-5 text-[13px] font-medium tracking-tight transition ${isSubmitting ? 'bg-white/[0.06] text-white/32' : 'bg-white text-black hover:bg-white/92 hover:text-black'}`}
                                                    >
                                                        {isSubmitting ? (
                                                            <div className="flex items-center gap-3">
                                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/15 border-t-black/70" />
                                                                Sending request
                                                            </div>
                                                        ) : (
                                                            'Request access'
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,23,31,0.95)_0%,rgba(8,8,9,0.98)_100%)] p-8 text-center shadow-[0_28px_80px_rgba(0,0,0,0.36)] md:p-12"
                                >
                                    <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#8fb7ff]/40 to-transparent" />
                                    <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                                        <div className="absolute inset-0 rounded-full bg-[#8fb7ff]/12 blur-3xl" />
                                        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#3c5a81] bg-[#10161f] text-[#d9e6fc]">
                                            <CheckCircle2 className="h-10 w-10" />
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-4">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-[#30445c] bg-[#10161f] px-3 py-1.5 text-[11px] font-medium tracking-tight text-[#d8e5fb]/76">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            {successBadge}
                                        </div>
                                        <h3 className="text-[30px] font-light leading-tight tracking-tight text-white md:text-[40px]">
                                            {successHeading}
                                        </h3>
                                        <p className="mx-auto max-w-[420px] text-[15px] leading-7 text-white/56">
                                            {successBody}
                                        </p>
                                    </div>

                                    <div className="mt-8 rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-5 text-left">
                                        <div className="text-[11px] font-medium tracking-tight text-white/38">Email confirmation</div>
                                        <p className="mt-4 text-[14px] leading-6 text-white/66">
                                            {emailConfirmationBody}
                                        </p>
                                        {submissionResult?.message ? (
                                            <p className="mt-3 text-[13px] leading-6 text-white/42">
                                                {submissionResult.message}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-5 text-left">
                                        <div className="text-[11px] font-medium tracking-tight text-white/38">What happens next</div>
                                        <div className="mt-4 space-y-3">
                                            {nextSteps.map((item, index) => (
                                                <div key={item} className="flex gap-3">
                                                    <div className="mt-0.5 text-[11px] font-medium tracking-tight text-white/34">
                                                        0{index + 1}
                                                    </div>
                                                    <p className="text-[14px] leading-6 text-white/66">{item}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <Button
                                            variant="outline"
                                            asChild
                                            className="h-12 rounded-[18px] border-white/10 bg-transparent px-6 text-[13px] font-medium tracking-tight text-white/74 hover:bg-white/[0.04] hover:text-white"
                                        >
                                            <Link to="/">Back to homepage</Link>
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </motion.div>
                </div>
            </main>

            <BrandFooter />
        </div>
    );
};

export default Waitlist;
