import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, ArrowLeft, CheckCircle2, Building2, DollarSign, Users, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

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

        // Simulate submission
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Open mailto with enterprise-formatted email
        const subject = encodeURIComponent(`[Enterprise Inquiry] ${form.company} - ${form.revenue || 'Volume TBD'}`);
        const body = encodeURIComponent(
            `ENTERPRISE SALES INQUIRY\n${'='.repeat(40)}\n\nName: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company}\nAnnual Revenue: ${form.revenue || 'Not specified'}\nAmazon Seller ID: ${form.sellerId || 'Not provided'}\n\n${'='.repeat(40)}\nMESSAGE:\n\n${form.message || 'No additional message provided.'}\n\n${'='.repeat(40)}\nSent via Margin Enterprise Sales Form`
        );
        window.open(`mailto:clariooai@gmail.com?subject=${subject}&body=${body}`, '_blank');

        setIsSubmitting(false);
        setIsSubmitted(true);
        toast({
            title: 'Inquiry prepared',
            description: 'Your email client has been opened. Send the email to connect with us.',
        });
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Minimal Header */}
            <header className="border-b border-gray-100">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <ArrowLeft className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto" />
                        <span className="text-base font-semibold text-gray-900 font-montserrat">Margin</span>
                    </Link>
                    <Link to="/contact" className="text-sm text-gray-500 hover:text-gray-700 font-montserrat transition-colors">
                        General inquiries →
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-6 py-16 max-w-5xl">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold font-montserrat mb-6">
                        <Sparkles className="h-3 w-3" />
                        Enterprise
                    </div>
                    <h1 className="text-4xl font-semibold text-gray-900 font-montserrat mb-4">
                        Partner with Margin
                    </h1>
                    <p className="text-gray-500 font-montserrat max-w-xl mx-auto text-lg">
                        For Amazon sellers doing $1M+ annually. Get priority support, custom integrations, and direct access to our team.
                    </p>
                </div>

                <div className="grid lg:grid-cols-5 gap-16">
                    {/* Enterprise Benefits */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-sm font-semibold text-gray-900 font-montserrat uppercase tracking-wide">
                            Enterprise Benefits
                        </h2>

                        <div className="space-y-4">
                            <div className="flex gap-4 p-4 rounded-lg bg-gray-50">
                                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 font-montserrat">Dedicated Account Manager</h3>
                                    <p className="text-xs text-gray-500 font-montserrat mt-0.5">Direct line to your success team</p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-lg bg-gray-50">
                                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                                    <DollarSign className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 font-montserrat">Volume Pricing</h3>
                                    <p className="text-xs text-gray-500 font-montserrat mt-0.5">Custom rates for high-volume recovery</p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-lg bg-gray-50">
                                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                                    <Building2 className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 font-montserrat">Multi-Account Support</h3>
                                    <p className="text-xs text-gray-500 font-montserrat mt-0.5">Manage all your seller accounts in one place</p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-lg bg-gray-50">
                                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                                    <Calendar className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 font-montserrat">Priority Onboarding</h3>
                                    <p className="text-xs text-gray-500 font-montserrat mt-0.5">White-glove setup and training</p>
                                </div>
                            </div>
                        </div>

                        {/* Founder Note */}
                        <div className="mt-8 p-5 rounded-lg border border-gray-200 bg-white">
                            <p className="text-sm text-gray-700 font-montserrat leading-relaxed">
                                <span className="font-semibold">"</span>I personally review every enterprise inquiry. If you're doing serious volume and losing money to Amazon errors, I want to hear from you directly.
                                <span className="font-semibold">"</span>
                            </p>
                            <p className="text-xs text-gray-500 font-montserrat mt-3">
                                — Founder, Margin
                            </p>
                        </div>
                    </div>

                    {/* Enterprise Form */}
                    <div className="lg:col-span-3">
                        <div className="p-8 rounded-xl border border-gray-200 bg-white shadow-sm">
                            {isSubmitted ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900 font-montserrat mb-2">
                                        Thank you
                                    </h2>
                                    <p className="text-gray-500 font-montserrat mb-2">
                                        Please send the prepared email to complete your inquiry.
                                    </p>
                                    <p className="text-sm text-gray-400 font-montserrat mb-6">
                                        I personally review all enterprise inquiries within 24 hours.
                                    </p>
                                    <Button
                                        onClick={() => setIsSubmitted(false)}
                                        variant="outline"
                                        className="font-montserrat">
                                        Submit another inquiry
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <h3 className="text-lg font-semibold text-gray-900 font-montserrat mb-6">
                                        Enterprise Inquiry
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5 font-montserrat">
                                                Your Name *
                                            </label>
                                            <Input
                                                type="text"
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                placeholder="Full name"
                                                className="h-11 font-montserrat"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5 font-montserrat">
                                                Work Email *
                                            </label>
                                            <Input
                                                type="email"
                                                value={form.email}
                                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                placeholder="you@company.com"
                                                className="h-11 font-montserrat"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5 font-montserrat">
                                            Company Name *
                                        </label>
                                        <Input
                                            type="text"
                                            value={form.company}
                                            onChange={(e) => setForm({ ...form, company: e.target.value })}
                                            placeholder="Your company or brand name"
                                            className="h-11 font-montserrat"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5 font-montserrat">
                                                Annual Amazon Revenue
                                            </label>
                                            <Select value={form.revenue} onValueChange={(value) => setForm({ ...form, revenue: value })}>
                                                <SelectTrigger className="h-11 font-montserrat">
                                                    <SelectValue placeholder="Select range" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="$1M - $5M">$1M - $5M</SelectItem>
                                                    <SelectItem value="$5M - $10M">$5M - $10M</SelectItem>
                                                    <SelectItem value="$10M - $25M">$10M - $25M</SelectItem>
                                                    <SelectItem value="$25M - $50M">$25M - $50M</SelectItem>
                                                    <SelectItem value="$50M+">$50M+</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5 font-montserrat">
                                                Amazon Seller ID
                                            </label>
                                            <Input
                                                type="text"
                                                value={form.sellerId}
                                                onChange={(e) => setForm({ ...form, sellerId: e.target.value })}
                                                placeholder="Optional"
                                                className="h-11 font-montserrat"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5 font-montserrat">
                                            What brings you to Margin?
                                        </label>
                                        <Textarea
                                            value={form.message}
                                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                                            placeholder="Tell us about your current challenges with Amazon FBA reimbursements, your volume, and what you're looking for..."
                                            className="min-h-[120px] font-montserrat resize-none"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-12 bg-black hover:bg-gray-900 text-white font-semibold font-montserrat rounded-none">
                                        {isSubmitting ? (
                                            <>Preparing...</>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Submit Enterprise Inquiry
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-xs text-gray-400 font-montserrat text-center">
                                        By submitting, you agree to our <Link to="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
                                    </p>
                                </form>
                            )}
                        </div>

                        {/* Direct Contact Alternative */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-500 font-montserrat">
                                Prefer email? Reach out directly at{' '}
                                <a href="mailto:clariooai@gmail.com" className="text-gray-900 underline hover:no-underline font-medium">
                                    clariooai@gmail.com
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Minimal Footer */}
            <footer className="border-t border-gray-100 py-8 mt-16">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-xs text-gray-400 font-montserrat">
                        © {new Date().getFullYear()} Margin AI. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
