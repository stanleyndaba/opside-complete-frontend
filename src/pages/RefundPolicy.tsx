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
                            Last Updated 25 June 2027
                        </p>
                        <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tight leading-tight">
                            Refund & Cancellation Policy
                        </h1>
                    </header>

                    {/* Content */}
                    <div className="space-y-12 text-[16px] leading-relaxed text-gray-600">

                        {/* Section 1 */}
                        <section>
                            <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                                01 — Overview
                            </h2>
                            <div className="space-y-4 text-gray-700">
                                <p>
                                    Margin is committed to transparent billing and the fair resolution of customer concerns.
                                </p>
                                <p>
                                    This Refund & Cancellation Policy explains how we handle refunds, cancellations, billing questions, and payment disputes relating to the <span className="text-gray-900 font-medium">Founding 500 Early Access</span> program.
                                </p>
                                <p>
                                    This policy should be read together with our Terms of Service.
                                </p>
                            </div>
                        </section>

                        {/* Section 2 */}
                        <section>
                            <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                                02 — Founding 500 Early Access
                            </h2>
                            <div className="space-y-4 text-gray-700">
                                <p>
                                    Margin currently offers access to the Service through the <span className="text-gray-900 font-medium">Founding 500 Early Access</span> program.
                                </p>
                                <p>
                                    Early Access is a <span className="text-gray-900 font-medium">one-time payment of USD $99</span> and provides access to the Margin platform during the Early Access period, together with the features and services described at checkout.
                                </p>
                                <p>
                                    The Early Access fee is a payment for access to the Service. It is <span className="text-gray-900 font-medium">not</span> a guarantee that Amazon will approve any reimbursement claim or that any specific recovery amount will be achieved.
                                </p>
                                <p>
                                    Amazon remains solely responsible for approving or rejecting reimbursement claims and pays all approved reimbursements directly to your Amazon Seller account.
                                </p>
                            </div>
                        </section>

                        {/* Section 3 */}
                        <section>
                            <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                                03 — Refund Policy
                            </h2>
                            <div className="space-y-4 text-gray-700">
                                <p>
                                    If you believe you have been charged incorrectly or wish to request a refund, please contact Margin Support as soon as possible.
                                </p>
                                <p>
                                    All refund requests are reviewed individually and fairly in accordance with this policy and any applicable laws.
                                </p>
                                <p>
                                    Refunds may be considered in circumstances including:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>verified billing or payment errors;</li>
                                    <li>duplicate charges;</li>
                                    <li>charges processed incorrectly; or</li>
                                    <li>other circumstances where a refund is required under applicable law.</li>
                                </ul>
                                <p>
                                    Where a refund request is not approved, we will explain the reason for our decision.
                                </p>
                            </div>
                        </section>

                        {/* Section 4 */}
                        <section>
                            <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                                04 — Cancellation Policy
                            </h2>
                            <div className="space-y-4 text-gray-700">
                                <p>
                                    You may stop using Margin at any time by disconnecting your Amazon Seller Central account through the dashboard or by contacting our support team.
                                </p>
                                <p>
                                    Once your cancellation takes effect:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Margin will stop auditing your account.</li>
                                    <li>No new reimbursement claims will be prepared or submitted.</li>
                                    <li>Your access to the Service may be disabled in accordance with our Terms of Service.</li>
                                </ul>
                                <p>
                                    Cancellation of your account does not automatically entitle you to a refund. Refund eligibility is determined in accordance with this Refund & Cancellation Policy.
                                </p>
                            </div>
                        </section>

                        {/* Section 5 */}
                        <section>
                            <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                                05 — Billing Disputes & Chargebacks
                            </h2>
                            <div className="space-y-4 text-gray-700">
                                <p>
                                    If you believe a payment was processed incorrectly or you are dissatisfied with the Service, we encourage you to contact us before initiating a payment dispute or chargeback through your bank or payment provider.
                                </p>
                                <p>
                                    Our team will:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>acknowledge your request within 48 hours;</li>
                                    <li>investigate the matter promptly;</li>
                                    <li>work with you to reach a fair resolution; and</li>
                                    <li>issue a refund where appropriate under this policy.</li>
                                </ul>
                                <p>
                                    We are committed to resolving billing concerns quickly and fairly.
                                </p>
                            </div>
                        </section>

                        {/* Section 6 */}
                        <section>
                            <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                                06 — Refund Processing
                            </h2>
                            <div className="space-y-4 text-gray-700">
                                <p>
                                    Where a refund is approved, it will be returned to the original payment method used for the purchase.
                                </p>
                                <p>
                                    Refund processing times may vary depending on your payment provider or financial institution, but approved refunds are generally processed within <span className="text-gray-900 font-medium">5–10 business days</span>.
                                </p>
                            </div>
                        </section>

                        {/* Section 7 */}
                        <section>
                            <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                                07 — Contact Us
                            </h2>
                            <div className="space-y-4 text-gray-700">
                                <p>
                                    If you have any questions regarding billing, refunds, cancellations, or this policy, please contact us:
                                </p>
                                <div className="space-y-2">
                                    <p><span className="text-gray-900 font-medium">Support:</span> <a href="mailto:support@margin-finance.com" className="text-blue-600 hover:underline">support@margin-finance.com</a></p>
                                    <p><span className="text-gray-900 font-medium">Billing:</span> <a href="mailto:billing@margin-finance.com" className="text-blue-600 hover:underline">billing@margin-finance.com</a></p>
                                    <p><span className="text-gray-900 font-medium">Response Time:</span> Within 48 hours</p>
                                </div>
                            </div>
                        </section>

                    </div>
                </article>
            </main>

            {/* Minimal Footer */}
            <footer className="border-t border-gray-100">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
                        <div className="flex flex-col gap-1">
                            <p>© {new Date().getFullYear()} Margin</p>
                            <p className="text-[10px] text-gray-400">Margin is a trading name of K2026125019 (SOUTH AFRICA) PTY LTD, registration number 2026/125019/07.</p>
                        </div>
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
