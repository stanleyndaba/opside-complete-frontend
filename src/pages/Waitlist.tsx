import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronLeft, Mail, MessageSquare, Sparkles } from 'lucide-react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

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
        detail: 'Access opens in controlled waves so onboarding stays focused and hands-on.'
    },
    {
        title: 'Operator clarity',
        detail: 'Margin shows what is detected, blocked, filed, approved, and paid.'
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

const fieldClass =
    'h-14 rounded-[20px] border-[#CFE0EA] bg-white px-4 text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20';
const iconFieldClass =
    'h-14 rounded-[20px] border-[#CFE0EA] bg-white pl-11 text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20';
const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-[#66737F]';
const primaryButtonClass =
    'h-12 rounded-full bg-[#0B74DE] px-5 text-[13px] font-semibold tracking-tight text-white shadow-[0_18px_40px_rgba(11,116,222,0.2)] transition hover:bg-[#0869C9]';
const secondaryButtonClass =
    'h-12 rounded-full border border-[#CFE0EA] bg-white px-4 text-[#66737F] hover:bg-[#F8FAFC] hover:text-[#182026]';

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
            toast({ title: 'Identification Required', description: 'Please select your profile and revenue band.', variant: 'destructive' });
            return;
        }
        if (step === 2 && !formData.email) {
            toast({ title: 'Contact Required', description: 'A work email is required for priority access.', variant: 'destructive' });
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
            toast({ title: 'Email Required', description: 'Add your work email and we will secure your place.', variant: 'destructive' });
            return;
        }

        setIsQuickSubmitting(true);
        try {
            const response = await api.quickJoinWaitlist({
                email: formData.email.trim(),
                ...requestContext,
            });

            if (response.ok) {
                const message = response.data?.message || 'Your details have been received.';
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
                    title: 'Waitlist confirmed',
                    description: message,
                });
            } else {
                toast({
                    title: 'Unable to submit',
                    description: response.error || 'We could not secure your waitlist request.',
                    variant: 'destructive'
                });
            }
        } catch (_error) {
            toast({
                title: 'Network issue',
                description: 'The request took too long or the connection was interrupted.',
                variant: 'destructive'
            });
        } finally {
            setIsQuickSubmitting(false);
        }
    };

    const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
        e?.preventDefault();
        if (!formData.primary_goal) {
            toast({ title: 'Selection Required', description: 'Please select your primary goal.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.joinWaitlist(formData);
            if (response.ok) {
                const alreadyRegistered = response.data?.already_registered === true;
                const message = response.data?.message || 'Your details have been received.';
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
                    title: alreadyRegistered ? 'Already on waitlist' : 'Waitlist confirmed',
                    description: message,
                });
            } else {
                toast({
                    title: 'Unable to submit',
                    description: response.error || 'We could not save your waitlist request.',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            toast({
                title: 'Network issue',
                description: 'The request took too long or the connection was interrupted.',
                variant: 'destructive'
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
        <div className="relative min-h-screen overflow-hidden bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
            <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
            <div
                className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(46,125,91,0.1),transparent_28%)]" />
            </div>

            <PublicNavbar variant="light" />

            <main className="relative z-10 px-4 pb-24 pt-32 md:px-6 md:pb-28 md:pt-40">
                <div className="mx-auto max-w-[1180px]">
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start"
                    >
                        <div className="space-y-7">
                            <div className="inline-flex items-center gap-3 rounded-full border border-[#DCE8EE] bg-white/78 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0B74DE] shadow-[0_14px_40px_rgba(37,49,58,0.06)] backdrop-blur">
                                Priority access
                                <span className="h-1 w-1 rounded-full bg-[#BFD8EA]" />
                                <span className="text-[#66737F]">Seller rollout queue</span>
                            </div>

                            <div className="space-y-5">
                                <h1 className="max-w-[740px] text-[40px] font-semibold leading-[0.98] tracking-[-0.06em] text-[#182026] md:text-[68px]">
                                    Join the next Margin onboarding wave.
                                </h1>
                                <p className="max-w-[610px] text-[16px] leading-7 text-[#4D5B66] md:text-lg md:leading-8">
                                    Early access opens in controlled waves for Amazon sellers, operators, and partners who want recovery visibility without being rushed into risky account access.
                                </p>
                            </div>

                            <div className="grid gap-4 border-t border-[#D8E3E8] pt-6 md:grid-cols-3">
                                {waitlistHighlights.map((item, index) => (
                                    <div key={item.title} className="space-y-2">
                                        <div className="text-[11px] font-semibold tracking-[0.14em] text-[#9AA8B2]">0{index + 1}</div>
                                        <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-[#182026]">{item.title}</h2>
                                        <p className="text-[13px] leading-6 text-[#66737F]">{item.detail}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {!isSuccess && (
                            <section className="relative overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-white p-6 shadow-[0_34px_100px_rgba(37,49,58,0.1)]">
                                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#0B74DE]/24 to-transparent" />
                                <div className="space-y-4">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">Fast lane</div>
                                    <div>
                                        <h2 className="text-[28px] font-semibold leading-[1.04] tracking-[-0.045em] text-[#182026]">
                                            Join the waitlist in one step.
                                        </h2>
                                        <p className="mt-3 text-[14px] leading-6 text-[#66737F]">
                                            Drop your work email and we will secure your place. You can still share richer rollout context below.
                                        </p>
                                    </div>

                                    <form onSubmit={handleQuickCaptureSubmit} className="space-y-3">
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA8B2]" />
                                            <Input
                                                type="email"
                                                name="email"
                                                placeholder="you@company.com"
                                                className={iconFieldClass}
                                                value={formData.email}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <Button type="submit" disabled={isQuickSubmitting} className={`${primaryButtonClass} w-full`}>
                                            {isQuickSubmitting ? (
                                                <span className="flex items-center justify-center gap-3">
                                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                                                    Securing spot
                                                </span>
                                            ) : (
                                                'Join waitlist'
                                            )}
                                        </Button>
                                    </form>
                                </div>
                            </section>
                        )}
                    </motion.section>

                    <div className="mx-auto mt-10 max-w-[860px]">
                        <AnimatePresence mode="wait">
                            {!isSuccess ? (
                                <motion.div
                                    key={step}
                                    variants={sectionVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.35 }}
                                    className="relative overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-white p-6 shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:p-8"
                                >
                                    <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#0B74DE]/24 to-transparent" />

                                    <div className="relative">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="space-y-2">
                                                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">
                                                    {step === 1 ? 'Step 1 - Profile' : step === 2 ? 'Step 2 - Contact' : 'Step 3 - Intent'}
                                                </div>
                                                <h2 className="text-[30px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] md:text-[38px]">
                                                    {step === 1 ? 'Tell us who you are' : step === 2 ? 'Where should we reach you?' : 'What should Margin solve first?'}
                                                </h2>
                                                <p className="max-w-[520px] text-[14px] leading-6 text-[#66737F] md:text-[15px]">
                                                    {step === 1
                                                        ? 'We prioritize access based on seller context and operating complexity.'
                                                        : step === 2
                                                            ? 'Use the work email or channel we should use when your access opens.'
                                                            : 'This tells us which onboarding path should come first when you are invited in.'}
                                                </p>
                                            </div>

                                            <div className="rounded-full border border-[#DCE8EE] bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-semibold tracking-tight text-[#66737F]">
                                                {step} of 3
                                            </div>
                                        </div>

                                        <div className="mt-6 grid grid-cols-3 gap-2">
                                            {stepMeta.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className={`rounded-full border px-3 py-2 text-center text-[11px] font-semibold tracking-tight transition-colors ${step === item.id
                                                        ? 'border-[#BFD8EA] bg-[#EAF4FF] text-[#0B74DE]'
                                                        : step > item.id
                                                            ? 'border-[#CFE0EA] bg-[#F8FAFC] text-[#66737F]'
                                                            : 'border-[#E4EDF1] bg-white text-[#9AA8B2]'
                                                        }`}
                                                >
                                                    {item.label}
                                                </div>
                                            ))}
                                        </div>

                                        {step === 1 && (
                                            <div className="mt-8 space-y-8">
                                                <div className="space-y-3">
                                                    <Label className={labelClass}>Profile</Label>
                                                    <div className="overflow-hidden rounded-[24px] border border-[#E4EDF1] bg-white">
                                                        {profileOptions.map((item) => {
                                                            const active = formData.user_type === item.id;
                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    type="button"
                                                                    onClick={() => handleSelection('user_type', item.id)}
                                                                    className={`flex w-full items-start gap-3 border-b border-[#E4EDF1] px-4 py-4 text-left transition-all last:border-b-0 ${active ? 'bg-[#EAF4FF]' : 'hover:bg-[#F8FAFC]'}`}
                                                                >
                                                                    <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? 'border-[#0B74DE] bg-[#0B74DE]' : 'border-[#CFE0EA]'}`}>
                                                                        <div className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-white' : 'bg-transparent'}`} />
                                                                    </div>
                                                                    <div>
                                                                        <div className={`text-[15px] font-semibold tracking-tight ${active ? 'text-[#0B74DE]' : 'text-[#25313A]'}`}>{item.label}</div>
                                                                        <div className="mt-1 text-[13px] leading-5 text-[#66737F]">{item.detail}</div>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className={labelClass}>Annual revenue</Label>
                                                    <Select
                                                        onValueChange={(v) => handleSelection('annual_revenue', v)}
                                                        value={formData.annual_revenue}
                                                    >
                                                        <SelectTrigger className={fieldClass}>
                                                            <SelectValue placeholder="Select revenue band" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-[18px] border-[#CFE0EA] bg-white text-[#182026] shadow-[0_22px_70px_rgba(37,49,58,0.14)]">
                                                            <SelectItem value="starter">Starter (&lt;$200k)</SelectItem>
                                                            <SelectItem value="growing">Growing ($200k - $1M)</SelectItem>
                                                            <SelectItem value="scaling">Scaling ($1M - $10M)</SelectItem>
                                                            <SelectItem value="enterprise">Enterprise ($10M+)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <Button type="button" onClick={nextStep} className={`${primaryButtonClass} w-full justify-between`}>
                                                    Continue
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}

                                        {step === 2 && (
                                            <div className="mt-8 space-y-8">
                                                <div className="space-y-4">
                                                    <div className="space-y-3">
                                                        <Label htmlFor="email" className={labelClass}>Work email</Label>
                                                        <div className="relative">
                                                            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA8B2]" />
                                                            <Input
                                                                id="email"
                                                                name="email"
                                                                type="email"
                                                                placeholder="you@company.com"
                                                                className={iconFieldClass}
                                                                value={formData.email}
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label htmlFor="contact_handle" className={labelClass}>Priority contact channel</Label>
                                                        <div className="relative">
                                                            <MessageSquare className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA8B2]" />
                                                            <Input
                                                                id="contact_handle"
                                                                name="contact_handle"
                                                                placeholder="WhatsApp, Telegram, or best direct line"
                                                                className={iconFieldClass}
                                                                value={formData.contact_handle}
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <Button type="button" variant="outline" onClick={prevStep} className={secondaryButtonClass}>
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button type="button" onClick={nextStep} className={`${primaryButtonClass} flex-1 justify-between`}>
                                                        Continue
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {step === 3 && (
                                            <div className="mt-8 space-y-8">
                                                <div className="space-y-3">
                                                    <Label className={labelClass}>Primary goal</Label>
                                                    <div className="space-y-1 overflow-hidden rounded-[24px] border border-[#E4EDF1] bg-white">
                                                        {goalOptions.map((item) => {
                                                            const active = formData.primary_goal === item.id;
                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    type="button"
                                                                    onClick={() => handleSelection('primary_goal', item.id)}
                                                                    className={`w-full border-b border-[#E4EDF1] px-4 py-4 text-left transition-all last:border-b-0 ${active ? 'bg-[#EAF4FF]' : 'hover:bg-[#F8FAFC]'}`}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? 'border-[#0B74DE] bg-[#0B74DE]' : 'border-[#CFE0EA]'}`}>
                                                                            <div className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-white' : 'bg-transparent'}`} />
                                                                        </div>
                                                                        <div>
                                                                            <div className={`text-[15px] font-semibold tracking-tight ${active ? 'text-[#0B74DE]' : 'text-[#25313A]'}`}>{item.label}</div>
                                                                            <div className="mt-1 text-[13px] leading-5 text-[#66737F]">{item.detail}</div>
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="rounded-[22px] border border-[#E4EDF1] bg-[#F8FAFC] px-4 py-4 text-center text-[12px] font-medium tracking-tight text-[#66737F]">
                                                    Priority access stays private and enrollment data is used only for rollout review.
                                                </div>

                                                <div className="flex gap-3">
                                                    <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting} className={secondaryButtonClass}>
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className={`${primaryButtonClass} flex-1`}>
                                                        {isSubmitting ? (
                                                            <span className="flex items-center justify-center gap-3">
                                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                                                                Sending request
                                                            </span>
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
                                    className="relative overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-white p-8 text-center shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:p-12"
                                >
                                    <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                                        <div className="absolute inset-0 rounded-full bg-[#2E7D5B]/10 blur-3xl" />
                                        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#BEE0CC] bg-[#EAF6EF] text-[#2E7D5B]">
                                            <CheckCircle2 className="h-10 w-10" />
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-4">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE8EE] bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-semibold tracking-tight text-[#0B74DE]">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            {successBadge}
                                        </div>
                                        <h3 className="text-[32px] font-semibold leading-tight tracking-[-0.045em] text-[#182026] md:text-[42px]">
                                            {successHeading}
                                        </h3>
                                        <p className="mx-auto max-w-[460px] text-[15px] leading-7 text-[#66737F]">
                                            {successBody}
                                        </p>
                                    </div>

                                    <div className="mt-8 rounded-[24px] border border-[#E4EDF1] bg-[#F8FAFC] px-5 py-5 text-left">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#66737F]">Email confirmation</div>
                                        <p className="mt-4 text-[14px] leading-6 text-[#4D5B66]">
                                            {emailConfirmationBody}
                                        </p>
                                        {submissionResult?.message ? (
                                            <p className="mt-3 text-[13px] leading-6 text-[#7A8994]">
                                                {submissionResult.message}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="mt-4 rounded-[24px] border border-[#E4EDF1] bg-white px-5 py-5 text-left">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#66737F]">What happens next</div>
                                        <div className="mt-4 space-y-3">
                                            {nextSteps.map((item, index) => (
                                                <div key={item} className="flex gap-3">
                                                    <div className="mt-0.5 text-[11px] font-semibold tracking-[0.14em] text-[#9AA8B2]">
                                                        0{index + 1}
                                                    </div>
                                                    <p className="text-[14px] leading-6 text-[#4D5B66]">{item}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <Button variant="outline" asChild className="h-12 rounded-full border-[#CFE0EA] bg-white px-6 text-[13px] font-semibold tracking-tight text-[#25313A] hover:bg-[#F8FAFC]">
                                            <Link to="/">Back to homepage</Link>
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            <BrandFooter />
        </div>
    );
};

export default Waitlist;
