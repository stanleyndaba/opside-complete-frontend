import React from 'react';
import LegalHeader from '@/components/layout/LegalHeader';
import LegalFooter from '@/components/layout/LegalFooter';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';

const RefundPolicy = () => {
    usePageMeta({
        title: 'Margin Refund & Cancellation Policy',
        description: 'Review our refund and cancellation policy for the Margin FBA reimbursement platform.',
        url: `${SITE_META.url}/refund-policy`,
        image: SITE_META.image
    });

    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col">
            <LegalHeader />

            <main className="flex-1 container mx-auto px-6 py-12 md:py-16">
                <article className="max-w-3xl mx-auto">
                    <header className="mb-8 pb-8 border-b border-gray-200">
                        <p className="text-sm text-gray-500 mb-6">Last Updated: January 13, 2026</p>
                        <h1 className="text-2xl font-medium text-gray-900">Refund and Cancellation Policy</h1>
                        <p className="text-sm text-gray-600 mt-2">This policy describes how Margin handles billing, cancellations, and refunds for our recovery services.</p>
                    </header>

                    <div className="space-y-8 text-sm leading-relaxed text-gray-700">

                        <section className="space-y-4">
                            <h2 className="text-base font-medium text-gray-900">1. Commission-Based Pricing (No Upfront Fees)</h2>
                            <p>
                                Margin operates on a strict "Success Fee" model. We charge a commission (currently 20%) only on funds that are successfully recovered and credited to your Amazon Seller Central account.
                            </p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>There are no monthly subscription fees.</li>
                                <li>There are no setup fees.</li>
                                <li>If we recover nothing, you pay nothing.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-base font-medium text-gray-900">2. Refund Policy (Service Credits)</h2>
                            <p>
                                Since our fees are charged after a successful recovery, traditional "refunds" rarely apply. However, we protect you in the event of an Amazon reversal:
                            </p>
                            <p>
                                <strong>Reversal Protection:</strong> If Amazon reverses a reimbursement claim that you have already paid us for (e.g., they claw back the funds), Margin will issue a Service Credit equal to the commission fee you paid for that specific claim. This credit will be applied to future invoices.
                            </p>
                            <p>
                                <strong>Billing Errors:</strong> If you believe you were charged a commission for a claim that was not actually reimbursed, contact clariooai@gmail.com within 30 days. We will verify the transaction logs and issue a full refund for that specific charge if confirmed.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-base font-medium text-gray-900">3. Cancellation Policy</h2>
                            <p>
                                You may stop using Margin at any time by disconnecting your Amazon Seller Central account in the dashboard or emailing clariooai@gmail.com.
                            </p>
                            <p>
                                <strong>Effect of Cancellation:</strong> We will immediately stop auditing your account and filing new claims.
                            </p>
                            <p>
                                <strong>Outstanding Invoices:</strong> You remain responsible for paying the success fee on any claims that were successfully filed before your cancellation date, even if the reimbursement arrives after you cancel.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-base font-medium text-gray-900">4. Contact Information</h2>
                            <p>If you have questions about billing or refunds, contact us:</p>
                            <p>Email: clariooai@gmail.com</p>
                            <p>Response Time: Within 48 hours</p>
                        </section>
                    </div>
                </article>
            </main>

            <LegalFooter />
        </div>
    );
};

export default RefundPolicy;
