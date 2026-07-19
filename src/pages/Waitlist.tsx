import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';
import { trackEvent } from '@/lib/analytics';

const marketplaceOptions = [
    'USA',
    'Canada',
    'UK',
    'Germany',
    'France',
    'Italy',
    'Spain',
    'Australia',
    'UAE',
    'Japan',
    'Other'
];

const revenueOptions = [
    'Under $10k',
    '$10k-50k',
    '$50k-100k',
    '$100k-500k',
    '$500k+'
];

const recoveryChallengeOptions = [
    'Missing inbound shipments',
    'Lost inventory',
    'Refunds without returns',
    'FBA fee errors',
    'Damaged inventory',
    'Other'
];

const priorityOptions = ['Yes', 'No'];

type WaitlistSubmissionResult = {
    email: string;
    message: string;
    alreadyRegistered: boolean;
    confirmationEmailStatus: 'queued' | 'not_resent' | 'failed' | null;
};

const fieldClass =
    'h-12 rounded-[5px] border-[#CFE0EA] bg-white px-4 text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20';
const labelClass = 'text-[12px] font-semibold tracking-tight text-[#182026]';
const helperClass = 'mt-1.5 text-[12px] leading-5 text-[#7A8994]';
const primaryButtonClass =
    'h-12 rounded-[5px] bg-[#0B74DE] px-6 text-[14px] font-semibold tracking-tight text-white shadow-[0_18px_40px_rgba(11,116,222,0.2)] transition hover:bg-[#0869C9]';

export default function Waitlist() {
    const location = useLocation();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<WaitlistSubmissionResult | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        amazon_marketplace: '',
        monthly_revenue: '',
        recovery_challenge: '',
        seller_central_email: '',
        priority_onboarding: '',
        notes: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelection = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const requiredMissing =
        !formData.full_name.trim() ||
        !formData.email.trim() ||
        !formData.amazon_marketplace ||
        !formData.monthly_revenue ||
        !formData.recovery_challenge ||
        !formData.priority_onboarding;

    const requestContext = useMemo(() => ({
        source_page: '/waitlist',
        intent: new URLSearchParams(location.search).get('intent') || undefined,
        reason: new URLSearchParams(location.search).get('reason') || undefined,
    }), [location.search]);

    useEffect(() => {
        trackEvent(ANALYTICS_EVENTS.waitlistViewed, requestContext);
    }, [requestContext]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (requiredMissing) {
            toast({
                title: 'Required fields missing',
                description: 'Complete the required fields so we can place you correctly in the rollout queue.',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);
        trackEvent(ANALYTICS_EVENTS.waitlistSignupSubmitted, {
            ...requestContext,
            amazon_marketplace: formData.amazon_marketplace,
            monthly_revenue: formData.monthly_revenue,
            recovery_challenge: formData.recovery_challenge,
            priority_onboarding: formData.priority_onboarding,
        });

        try {
            const response = await api.joinWaitlist({
                email: formData.email.trim(),
                full_name: formData.full_name.trim(),
                user_type: 'amazon_seller',
                brand_count: formData.amazon_marketplace,
                annual_revenue: formData.monthly_revenue,
                contact_handle: formData.seller_central_email.trim(),
                primary_goal: formData.recovery_challenge,
                amazon_marketplace: formData.amazon_marketplace,
                monthly_revenue: formData.monthly_revenue,
                recovery_challenge: formData.recovery_challenge,
                seller_central_email: formData.seller_central_email.trim(),
                priority_onboarding: formData.priority_onboarding,
                notes: formData.notes.trim(),
                ...requestContext,
            });

            if (response.ok) {
                const alreadyRegistered = response.data?.already_registered === true;
                const message = response.data?.message || 'Your details have been received.';
                const confirmationEmailStatus = response.data?.confirmation_email_status || null;

                setSubmissionResult({
                    email: formData.email.trim(),
                    message,
                    alreadyRegistered,
                    confirmationEmailStatus,
                });
                setIsSuccess(true);
                trackEvent(ANALYTICS_EVENTS.waitlistSignupSuccess, {
                    ...requestContext,
                    already_registered: alreadyRegistered,
                    confirmation_email_status: confirmationEmailStatus || undefined,
                    amazon_marketplace: formData.amazon_marketplace,
                    monthly_revenue: formData.monthly_revenue,
                    recovery_challenge: formData.recovery_challenge,
                    priority_onboarding: formData.priority_onboarding,
                });
                toast({
                    title: alreadyRegistered ? 'Already on waitlist' : 'Waitlist confirmed',
                    description: message,
                });
            } else {
                trackEvent(ANALYTICS_EVENTS.waitlistSignupFailed, {
                    ...requestContext,
                    failure_status: response.status,
                    failure_type: 'api_error',
                    amazon_marketplace: formData.amazon_marketplace,
                    monthly_revenue: formData.monthly_revenue,
                    recovery_challenge: formData.recovery_challenge,
                    priority_onboarding: formData.priority_onboarding,
                });
                toast({
                    title: 'Unable to submit',
                    description: response.error || 'We could not save your waitlist request.',
                    variant: 'destructive'
                });
            }
        } catch (_error) {
            trackEvent(ANALYTICS_EVENTS.waitlistSignupFailed, {
                ...requestContext,
                failure_type: 'network_or_timeout',
                amazon_marketplace: formData.amazon_marketplace,
                monthly_revenue: formData.monthly_revenue,
                recovery_challenge: formData.recovery_challenge,
                priority_onboarding: formData.priority_onboarding,
            });
            toast({
                title: 'Network issue',
                description: 'The request took too long or the connection was interrupted.',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const alreadyRegistered = submissionResult?.alreadyRegistered === true;
    const successHeading = alreadyRegistered
        ? "You're already on the waitlist."
        : "You're on the waitlist.";
    const successBody = alreadyRegistered
        ? 'We recognized this email as an existing waitlist entry and kept your original place in line.'
        : 'Your place has been reserved for the next Margin onboarding wave.';
    const emailConfirmationBody = submissionResult?.confirmationEmailStatus === 'failed'
        ? 'We secured your place, but the confirmation email is taking a little longer than expected.'
        : alreadyRegistered
            ? 'No new confirmation email was sent because this address was already registered.'
            : `A confirmation email is being sent to ${submissionResult?.email || 'the email you provided'}.`;

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
            <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
            <div
                className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(46,125,91,0.1),transparent_28%)]" />
            </div>

            <PublicNavbar variant="light" />

            <main className="relative z-10 px-4 pb-24 pt-32 md:px-6 md:pb-28 md:pt-40">
                <div className="mx-auto max-w-[1120px]">
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.75 }}
                        className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start"
                    >
                        <div className="space-y-6">
                            <div className="inline-flex items-center rounded-[5px] border border-[#DCE8EE] bg-white/78 px-3 py-1.5 text-[11px] font-semibold tracking-tight text-[#0B74DE] shadow-[0_14px_40px_rgba(37,49,58,0.06)] backdrop-blur">
                                Waitlist
                            </div>

                            <div className="space-y-5">
                                <h1 className="max-w-[720px] text-[42px] font-semibold leading-[0.98] tracking-[-0.06em] text-[#182026] md:text-[68px]">
                                    {isSuccess ? successHeading : 'Join the next Margin onboarding wave.'}
                                </h1>
                                <p className="max-w-[600px] text-[16px] leading-7 text-[#4D5B66] md:text-lg md:leading-8">
                                    {isSuccess
                                        ? successBody
                                        : 'Tell us where you sell, what recovery work is breaking down, and whether you want priority onboarding. We use this to place you in the right access queue.'}
                                </p>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {!isSuccess ? (
                                <motion.form
                                    key="waitlist-form"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.35 }}
                                    onSubmit={handleSubmit}
                                    className="relative overflow-hidden rounded-[18px] border border-[#CFE0EA] bg-white/92 shadow-[0_34px_100px_rgba(37,49,58,0.1)] backdrop-blur"
                                >
                                    <div className="border-b border-[#D8E3E8] px-5 py-5 md:px-7">
                                        <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#182026] md:text-[30px]">
                                            Access request
                                        </h2>
                                        <p className="mt-2 text-[14px] leading-6 text-[#66737F]">
                                            Eight fields. No account connection required.
                                        </p>
                                    </div>

                                    <div className="divide-y divide-[#E4EDF1]">
                                        <div className="grid gap-4 px-5 py-5 md:grid-cols-[130px_minmax(0,1fr)] md:px-7">
                                            <div>
                                                <div className="font-mono text-[11px] text-[#9AA8B2]">01</div>
                                                <Label htmlFor="full_name" className={labelClass}>Full Name</Label>
                                            </div>
                                            <Input
                                                id="full_name"
                                                name="full_name"
                                                placeholder="Your full name"
                                                className={fieldClass}
                                                value={formData.full_name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <div className="grid gap-4 px-5 py-5 md:grid-cols-[130px_minmax(0,1fr)] md:px-7">
                                            <div>
                                                <div className="font-mono text-[11px] text-[#9AA8B2]">02</div>
                                                <Label htmlFor="email" className={labelClass}>Business Email</Label>
                                                <p className={helperClass}>Primary communication channel.</p>
                                            </div>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="you@company.com"
                                                className={fieldClass}
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <div className="grid gap-4 px-5 py-5 md:grid-cols-[130px_minmax(0,1fr)] md:px-7">
                                            <div>
                                                <div className="font-mono text-[11px] text-[#9AA8B2]">03</div>
                                                <Label className={labelClass}>Amazon Marketplace</Label>
                                            </div>
                                            <Select value={formData.amazon_marketplace} onValueChange={(v) => handleSelection('amazon_marketplace', v)}>
                                                <SelectTrigger className={fieldClass}>
                                                    <SelectValue placeholder="Select marketplace" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-[10px] border-[#CFE0EA] bg-white text-[#182026] shadow-[0_22px_70px_rgba(37,49,58,0.14)]">
                                                    {marketplaceOptions.map(option => (
                                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid gap-4 px-5 py-5 md:grid-cols-[130px_minmax(0,1fr)] md:px-7">
                                            <div>
                                                <div className="font-mono text-[11px] text-[#9AA8B2]">04</div>
                                                <Label className={labelClass}>Monthly Amazon Revenue</Label>
                                            </div>
                                            <Select value={formData.monthly_revenue} onValueChange={(v) => handleSelection('monthly_revenue', v)}>
                                                <SelectTrigger className={fieldClass}>
                                                    <SelectValue placeholder="Select revenue band" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-[10px] border-[#CFE0EA] bg-white text-[#182026] shadow-[0_22px_70px_rgba(37,49,58,0.14)]">
                                                    {revenueOptions.map(option => (
                                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid gap-4 px-5 py-5 md:grid-cols-[130px_minmax(0,1fr)] md:px-7">
                                            <div>
                                                <div className="font-mono text-[11px] text-[#9AA8B2]">05</div>
                                                <Label className={labelClass}>Biggest Recovery Challenge</Label>
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {recoveryChallengeOptions.map(option => {
                                                    const active = formData.recovery_challenge === option;
                                                    return (
                                                        <button
                                                            key={option}
                                                            type="button"
                                                            onClick={() => handleSelection('recovery_challenge', option)}
                                                            className={`flex items-center gap-3 rounded-[5px] border px-3 py-3 text-left text-[14px] font-medium tracking-tight transition ${active ? 'border-[#0B74DE] bg-[#EAF4FF] text-[#0B74DE]' : 'border-[#D8E3E8] bg-white text-[#25313A] hover:bg-[#F8FAFC]'}`}
                                                        >
                                                            <span className={`h-3 w-3 rounded-full border ${active ? 'border-[#0B74DE] bg-[#0B74DE]' : 'border-[#B8C6D0]'}`} />
                                                            {option}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid gap-4 px-5 py-5 md:grid-cols-[130px_minmax(0,1fr)] md:px-7">
                                            <div>
                                                <div className="font-mono text-[11px] text-[#9AA8B2]">06</div>
                                                <Label htmlFor="seller_central_email" className={labelClass}>Seller Central Email</Label>
                                                <p className={helperClass}>Optional.</p>
                                            </div>
                                            <Input
                                                id="seller_central_email"
                                                name="seller_central_email"
                                                type="email"
                                                placeholder="sellercentral@company.com"
                                                className={fieldClass}
                                                value={formData.seller_central_email}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="grid gap-4 px-5 py-5 md:grid-cols-[130px_minmax(0,1fr)] md:px-7">
                                            <div>
                                                <div className="font-mono text-[11px] text-[#9AA8B2]">07</div>
                                                <Label className={labelClass}>Priority Onboarding</Label>
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {priorityOptions.map(option => {
                                                    const active = formData.priority_onboarding === option;
                                                    return (
                                                        <button
                                                            key={option}
                                                            type="button"
                                                            onClick={() => handleSelection('priority_onboarding', option)}
                                                            className={`flex items-center gap-3 rounded-[5px] border px-3 py-3 text-left text-[14px] font-semibold tracking-tight transition ${active ? 'border-[#0B74DE] bg-[#EAF4FF] text-[#0B74DE]' : 'border-[#D8E3E8] bg-white text-[#25313A] hover:bg-[#F8FAFC]'}`}
                                                        >
                                                            <span className={`h-3 w-3 rounded-full border ${active ? 'border-[#0B74DE] bg-[#0B74DE]' : 'border-[#B8C6D0]'}`} />
                                                            {option}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid gap-4 px-5 py-5 md:grid-cols-[130px_minmax(0,1fr)] md:px-7">
                                            <div>
                                                <div className="font-mono text-[11px] text-[#9AA8B2]">08</div>
                                                <Label htmlFor="notes" className={labelClass}>Anything we should know?</Label>
                                                <p className={helperClass}>Optional.</p>
                                            </div>
                                            <Textarea
                                                id="notes"
                                                name="notes"
                                                placeholder="Tell us anything useful about your recovery workflow."
                                                className="min-h-[104px] rounded-[5px] border-[#CFE0EA] bg-white px-4 py-3 text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20"
                                                value={formData.notes}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 border-t border-[#D8E3E8] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">
                                        <p className="text-[12px] leading-5 text-[#7A8994]">
                                            Your answers are used for rollout review and onboarding context.
                                        </p>
                                        <Button type="submit" disabled={isSubmitting} className={`${primaryButtonClass} w-full md:w-auto`}>
                                            {isSubmitting ? (
                                                <span className="flex items-center justify-center gap-3">
                                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                                                    Sending request
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    Join waitlist
                                                    <ArrowRight className="h-4 w-4" />
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative overflow-hidden rounded-[18px] border border-[#CFE0EA] bg-white p-8 text-center shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:p-12"
                                >
                                    <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                                        <div className="absolute inset-0 rounded-full bg-[#2E7D5B]/10 blur-3xl" />
                                        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#BEE0CC] bg-[#EAF6EF] text-[#2E7D5B]">
                                            <CheckCircle2 className="h-10 w-10" />
                                        </div>
                                    </div>

                                    <div className="mt-8 rounded-[12px] border border-[#E4EDF1] bg-[#F8FAFC] px-5 py-5 text-left">
                                        <div className="text-[11px] font-semibold tracking-tight text-[#66737F]">Email confirmation</div>
                                        <p className="mt-4 text-[14px] leading-6 text-[#4D5B66]">
                                            {emailConfirmationBody}
                                        </p>
                                        {submissionResult?.message ? (
                                            <p className="mt-3 text-[13px] leading-6 text-[#7A8994]">
                                                {submissionResult.message}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="mt-8">
                                        <Button variant="outline" asChild className="h-12 rounded-[5px] border-[#CFE0EA] bg-white px-6 text-[13px] font-semibold tracking-tight text-[#25313A] hover:bg-[#F8FAFC]">
                                            <Link to="/">Back to homepage</Link>
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.section>
                </div>
            </main>

            <BrandFooter />
        </div>
    );
}
