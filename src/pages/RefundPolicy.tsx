import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';

const RefundPolicy = () => {
    usePageMeta({
        title: 'Refund Policy | Margin',
        description: 'Review our refund and cancellation policy for the Margin FBA reimbursement platform.',
        url: `${SITE_META.url}/refund-policy`,
        image: SITE_META.image
    });

    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col">
            {/* Minimal Header */}
            <header className="border-b border-gray-100">
                <div className="container mx-auto px-6 py-6">
                    <Link to="/" className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors">
                        Margin
                    </Link>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-6 py-16 md:py-24">
                <article className="max-w-2xl mx-auto">
                    {/* Document Header */}
                    <header className="mb-16">
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                            Last Updated January 13, 2026
                        </p>
                        <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tight leading-tight">
                            Refund and Cancellation Policy
                        </h1>
                    </header>

                    {/* Content */}
                    <div className="space-y-12 text-[15px] leading-relaxed text-gray-600">

                        {/* Section 1 */}
                        <section>
                            <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                                01 — Pricing Model
                            </h2>
                            <div className="space-y-4 text-gray-700">
                                <p>
                                    Margin operates on a strict success-fee model. We charge a commission of 20% only on funds that are successfully recovered and credited to your Amazon Seller Central account.
                                </p>
                                <p>
                                    There are no monthly subscription fees. There are no setup fees. If we recover nothing, you pay nothing.
                                </p>
                            </div>
                        </section>

                        {/* Section 2 */}
                        <section>
                            <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                                02 — Refund Policy
                            </h2>
                            <div className="space-y-4 text-gray-700">
                                <p>
                                    Since our fees are charged after a successful recovery, traditional refunds rarely apply. However, we protect you in the event of an Amazon reversal.
                                </p>
                                <p>
                                    <span className="text-gray-900">Reversal Protection</span> — If Amazon reverses a reimbursement claim that you have already paid us for, Margin will issue a service credit equal to the commission fee you paid for that specific claim. This credit will be applied to future invoices.
                                </p>
                                <p>
                                    <span className="text-gray-900">Billing Errors</span> — If you believe you were charged a commission for a claim that was not actually reimbursed, contact us within 30 days. We will verify the transaction logs and issue a full refund for that specific charge if confirmed.
                                </p>
                            </div>
                        </section>

                        {/* Section 3 */}
                        <section>
                            <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                                03 — Cancellation
                            </h2>
                            <div className="space-y-4 text-gray-700">
                                <p>
                                    You may stop using Margin at any time by disconnecting your Amazon Seller Central account in the dashboard or by contacting us directly.
                                </p>
                                <p>
                                    <span className="text-gray-900">Effect of Cancellation</span> — We will immediately stop auditing your account and filing new claims.
                                </p>
                                <p>
                                    <span className="text-gray-900">Outstanding Invoices</span> — You remain responsible for paying the success fee on any claims that were successfully filed before your cancellation date, even if the reimbursement arrives after you cancel.
                                </p>
                            </div>
                        </section>

                        {/* Section 4 */}
                        <section>
                            <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                                04 — Contact
                            </h2>
                            <div className="space-y-2 text-gray-700">
                                <p>
                                    For questions about billing or refunds, contact us at hello@margin.io
                                </p>
                                <p className="text-gray-500">
                                    Response time: Within 48 hours
                                </p>
                            </div>
                        </section>

                    </div>
                </article>
            </main>

            {/* Minimal Footer */}
            <footer className="border-t border-gray-100">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
                        <p>© {new Date().getFullYear()} Margin</p>
                        <div className="flex items-center gap-6">
                            <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
                            <Link to="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
                            <Link to="/docs" className="hover:text-gray-600 transition-colors">Acceptable Use</Link>
                            <Link to="/refund-policy" className="text-gray-600">Refund</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default RefundPolicy;
