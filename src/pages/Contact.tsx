import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

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

        // Simulate submission (in reality, this would send to backend or email service)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Open mailto as fallback
        const subject = encodeURIComponent(form.subject || 'Contact from Margin Website');
        const body = encodeURIComponent(
            `Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company || 'N/A'}\n\n${form.message}`
        );
        window.open(`mailto:support@margin.app?subject=${subject}&body=${body}`, '_blank');

        setIsSubmitting(false);
        setIsSubmitted(true);
        toast({
            title: 'Message prepared',
            description: 'Your email client has been opened. Send the email to complete your inquiry.',
        });
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Minimal Header */}
            <header className="border-b border-gray-100">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">

                        <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto" />
                        <span className="text-base font-semibold text-gray-900 font-montserrat">Margin</span>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-6 py-16 max-w-4xl">
                {/* Page Header */}
                <div className="text-center mb-16">
                    <h1 className="text-3xl font-semibold text-gray-900 font-montserrat mb-4">
                        Get in Touch
                    </h1>
                    <p className="text-gray-500 font-montserrat max-w-lg mx-auto">
                        Have questions about Margin? We're here to help. Reach out and we'll respond within 24 hours.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 md:gap-16">
                    {/* Contact Form */}
                    <div>
                        {isSubmitted ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 font-montserrat mb-2">
                                    Thank you
                                </h2>
                                <p className="text-gray-500 font-montserrat mb-6">
                                    Please send the prepared email to complete your inquiry.
                                </p>
                                <Button
                                    onClick={() => setIsSubmitted(false)}
                                    variant="outline"
                                    className="font-montserrat">
                                    Send another message
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5 font-montserrat">
                                            Name *
                                        </label>
                                        <Input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="Your name"
                                            className="h-11 font-montserrat"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5 font-montserrat">
                                            Email *
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5 font-montserrat">
                                            Company
                                        </label>
                                        <Input
                                            type="text"
                                            value={form.company}
                                            onChange={(e) => setForm({ ...form, company: e.target.value })}
                                            placeholder="Your company"
                                            className="h-11 font-montserrat"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5 font-montserrat">
                                            Subject
                                        </label>
                                        <Input
                                            type="text"
                                            value={form.subject}
                                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                            placeholder="How can we help?"
                                            className="h-11 font-montserrat"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5 font-montserrat">
                                        Message *
                                    </label>
                                    <Textarea
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        placeholder="Tell us about your inquiry..."
                                        className="min-h-[140px] font-montserrat resize-none"
                                        required
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
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 font-montserrat mb-4">
                                Direct Contact
                            </h2>
                            <a
                                href="mailto:support@margin.app"
                                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                    <Mail className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 font-montserrat">Email Us</p>
                                    <p className="text-xs text-gray-500 font-montserrat">support@margin.app</p>
                                </div>
                            </a>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 font-montserrat mb-4">
                                For Enterprise Sellers
                            </h2>
                            <Link
                                to="/sales"
                                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                                    <span className="text-white text-xs font-bold font-montserrat">VIP</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 font-montserrat">Talk to Sales</p>
                                    <p className="text-xs text-gray-500 font-montserrat">For high-volume sellers ($1M+ revenue)</p>
                                </div>
                            </Link>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-900 font-montserrat mb-3">
                                Response Time
                            </h2>
                            <p className="text-sm text-gray-500 font-montserrat leading-relaxed">
                                We typically respond within 24 hours during business days. For urgent matters, please indicate "URGENT" in your subject line.
                            </p>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-900 font-montserrat mb-3">
                                Location
                            </h2>
                            <p className="text-sm text-gray-500 font-montserrat leading-relaxed">
                                Margin operates globally from Durban, South Africa.<br />
                                Supporting Amazon sellers worldwide.
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
