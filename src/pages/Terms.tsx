import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';

const Terms = () => {
  usePageMeta({
    title: 'Terms of Service | Margin',
    description: "Terms of Service governing use of Margin's automated FBA auditing platform.",
    url: `${SITE_META.url}/terms`,
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
              Effective December 22, 2025
            </p>
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tight leading-tight">
              Terms of Service
            </h1>
          </header>

          {/* Content */}
          <div className="space-y-12 text-[16px] leading-relaxed text-gray-600">

            {/* Section 1 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                01 — Introduction
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  These Terms of Service govern your access to and use of Margin, a SaaS platform that automates the identification and auditing of Amazon FBA discrepancies. By creating an account or using the Service, you agree to be bound by these Terms.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                02 — Relationship with Amazon
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Margin is an independent third-party software provider.
                </p>
                <p>
                  <span className="text-gray-900">No Affiliation</span> — Margin is not affiliated with, endorsed by, or sponsored by Amazon.com, Inc. or its affiliates.
                </p>
                <p>
                  <span className="text-gray-900">Amazon Terms</span> — Your use of Margin does not exempt you from complying with Amazon's Selling Partner Terms of Service. You are solely responsible for ensuring your use of our tool complies with Amazon's policies.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                03 — Service Scope
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Margin provides automated analysis of Amazon SP-API data to identify potential inventory and financial discrepancies.
                </p>
                <p>
                  <span className="text-gray-900">Automated Audits</span> — We scan your transaction logs to find potential claims.
                </p>
                <p>
                  <span className="text-gray-900">No Guarantee</span> — Margin identifies potential discrepancies. We do not guarantee that Amazon will approve any specific reimbursement claim. Final reimbursement decisions rest solely with Amazon.
                </p>
                <p>
                  <span className="text-gray-900">Fair Use</span> — You agree not to use Margin to submit false, misleading, or duplicative claims to Amazon.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                04 — Fees and Billing
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <span className="text-gray-900">Subscription Pricing</span> — Margin uses flat subscription pricing with Starter, Pro, and Enterprise plan tiers. Pricing may be billed monthly or annually depending on the plan interval you choose.
                </p>
                <p>
                  <span className="text-gray-900">Billing Cycle</span> — Subscription invoices are issued on the selected monthly or annual billing interval. The first 30 days are a promotional period where you keep 100% of recoveries, but the billing model remains flat subscription pricing throughout.
                </p>
                <p>
                  <span className="text-gray-900">Direct Seller Payouts</span> — Amazon pays reimbursements directly to your Amazon Seller account. Margin does not receive, hold, or route reimbursement funds on your behalf.
                </p>
                <p>
                  <span className="text-gray-900">Payment Method</span> — You authorize Margin to charge your payment method on file for subscription invoices. Margin charges no recovery commissions. Sellers pay for ongoing recovery management, and approved recoveries stay with the seller.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                05 — Refunds
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <span className="text-gray-900">Subscription Billing</span> — Margin no longer uses outcome-linked or commission billing. Refund requests apply to subscription charges only.
                </p>
                <p>
                  <span className="text-gray-900">Promo Window</span> — During the first 30 days you keep 100% of recoveries. After that, the same flat subscription pricing continues with no transition into success-fee billing.
                </p>
                <p>
                  <span className="text-gray-900">Disputes</span> — If you believe a subscription charge was billed in error, contact us within 30 days.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                06 — User Responsibilities
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  You are solely responsible for your use of Margin.
                </p>
                <p>
                  <span className="text-gray-900">Security</span> — Maintain the strict confidentiality of your Amazon Seller Central credentials.
                </p>
                <p>
                  <span className="text-gray-900">Data Access</span> — You grant Margin limited access to your Amazon data via the official SP-API solely for the purpose of auditing. We handle this data in strict accordance with Amazon's Data Protection Policy.
                </p>
                <p>
                  <span className="text-gray-900">Prohibited Actions</span> — You will not use Margin to reverse-engineer Amazon's systems or spam Amazon's support channels.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                07 — Intellectual Property
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Margin retains full ownership of the platform, algorithms, and source code. You are granted a limited, non-exclusive, non-transferable license to use the Service for your internal business operations.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                08 — Termination
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <span className="text-gray-900">By You</span> — You may cancel your access to the Service at any time via your dashboard.
                </p>
                <p>
                  <span className="text-gray-900">By Us</span> — We may suspend your access immediately if you violate these Terms or if your Amazon Seller account is suspended.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                09 — Limitation of Liability
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  To the fullest extent permitted by South African law:
                </p>
                <p>
                  <span className="text-gray-900">Liability Cap</span> — Margin's total liability to you shall not exceed the total fees paid by you to Margin in the 6 months preceding the claim.
                </p>
                <p>
                  <span className="text-gray-900">Amazon Actions</span> — Margin is not liable for any actions taken by Amazon against your account, including account suspension, warning letters, or withheld funds. You use this tool at your own risk.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                10 — Governing Law
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  These Terms shall be governed by the laws of the Republic of South Africa.
                </p>
                <p>
                  <span className="text-gray-900">Jurisdiction</span> — You agree to submit to the exclusive jurisdiction of the courts located in Durban, KwaZulu-Natal.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                11 — Contact
              </h2>
              <div className="space-y-2 text-gray-700">
                <p>
                  For questions about these Terms, contact us at support@margin-finance.com
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
              <Link to="/terms" className="text-gray-600">Terms</Link>
              <Link to="/docs" className="hover:text-gray-600 transition-colors">Acceptable Use</Link>
              <Link to="/refund-policy" className="hover:text-gray-600 transition-colors">Refund</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
