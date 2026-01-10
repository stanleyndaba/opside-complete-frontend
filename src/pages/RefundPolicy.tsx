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
                        <p className="text-sm text-gray-500 mb-6">Last Updated: 14 December 2025</p>
                        <h1 className="text-2xl font-medium text-gray-900">Refund and Cancellation Policy</h1>
                    </header>

                    <div className="space-y-8 text-sm leading-relaxed text-gray-700">
                        <p>
                            This policy describes how you can cancel your Margin subscription and our approach to refunds.
                        </p>

                        <section className="space-y-4">
                            <h2 className="text-base font-medium text-gray-900">1. Subscription Cancellation</h2>
                            <p>
                                You may cancel your Margin subscription at any time via your account dashboard or by emailing support@margin.app.
                            </p>
                            <p>
                                Cancellation takes effect at the end of your current billing cycle. You will retain full access until that date and will not be charged again.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-base font-medium text-gray-900">2. Refund Policy</h2>
                            <p>
                                Margin is a recurring monthly subscription service with instant access to automated FBA reimbursement auditing.
                            </p>
                            <p>
                                No refunds or credits are provided for partial months, unused periods, or months remaining on an active account.
                            </p>
                            <p>
                                If you cancel mid-cycle, you continue to receive the full service until the end of the paid period.
                            </p>
                            <p>
                                <strong>Billing Errors:</strong> In the event of a genuine billing error (for example, a charge after cancellation or a double charge), contact support@margin.app within 7 days of the charge. We will investigate promptly and refund any erroneous amount immediately.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-base font-medium text-gray-900">3. Service Delivery</h2>
                            <p>
                                Upon successful payment, access to the Margin platform and all its features is activated instantly. As this is a fully digital service, no physical delivery or shipping is involved.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-base font-medium text-gray-900">4. Contact Information</h2>
                            <p>If you have any questions about our refund or cancellation policy, please contact us:</p>
                            <p>Email: support@margin.app</p>
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
