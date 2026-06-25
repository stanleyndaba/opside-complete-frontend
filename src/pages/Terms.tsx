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
                  <span className="text-gray-900">Account Activation</span> — Access to the Service may require completion of onboarding and connection of an eligible Amazon Seller Central account. Certain functionality may not be available until onboarding is complete.
                </p>
                <p>
                  <span className="text-gray-900">Automated Audits</span> — We scan your transaction logs to find potential claims.
                </p>
                <p>
                  <span className="text-gray-900">No Guarantee</span> — Margin identifies potential discrepancies. We do not guarantee that Amazon will approve any reimbursement claim, that any particular amount will be recovered, or that recoveries will occur within any specific timeframe. Final reimbursement decisions rest solely with Amazon.
                </p>
                <p>
                  <span className="text-gray-900">Fair Use</span> — You agree not to use Margin to submit false, misleading, or duplicative claims to Amazon.
                </p>
                <p>
                  <span className="text-gray-900">Service Availability</span> — We may update, improve, maintain, or temporarily suspend the Service as reasonably necessary to provide, secure, or improve the platform.
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
                  <span className="text-gray-900">Current Offering</span> — At launch, Margin offers access through the Founding 500 Early Access program. This is a one-time payment of USD $99 for access to the Founding 500 Early Access program and the Services made available during the Early Access period. The fee is not a guarantee of any reimbursement or recovery from Amazon. Additional plans or pricing models may be introduced in the future and will be governed by the terms applicable at that time.
                </p>
                <p>
                  <span className="text-gray-900">Founding 500</span> — Founding 500 Early Access is a $99 one-time offer that runs through December 31, 2026. During the Early Access period, you keep 100% of approved recoveries.
                </p>
                <p>
                  <span className="text-gray-900">Direct Seller Payouts</span> — Amazon pays all approved reimbursements directly to your Amazon Seller account. Margin does not receive, hold, route, or control reimbursement funds on your behalf.
                </p>
                <p>
                  <span className="text-gray-900">Payment Method</span> — By completing your purchase, you authorize Margin to charge the payment method you provide for the applicable Founding 500 Early Access fee.
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
                  Refunds for the Founding 500 Early Access fee are governed by the Refund & Cancellation Policy available on our website. By purchasing Early Access, you acknowledge that refund requests will be reviewed in accordance with that policy.
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
                  <span className="text-gray-900">By You</span> — You may terminate your account at any time via your dashboard. Termination does not automatically entitle you to a refund. Refund eligibility is governed by the Refund & Cancellation Policy.
                </p>
                <p>
                  <span className="text-gray-900">By Us</span> — We may suspend or terminate your access if you violate these Terms, misuse the Service, or if continued access would expose Margin or its users to legal, security, or operational risk.
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
                  <span className="text-gray-900">Liability Cap</span> — Margin's total liability to you shall not exceed the total amount paid for the applicable Founding 500 Early Access purchase.
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
                  For questions about these Terms, contact us at support@margin-finance.com or billing@margin-finance.com. Billing inquiries should generally go to the billing address.
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
            <div className="flex flex-col gap-1">
              <p>© {new Date().getFullYear()} Margin</p>
              <p className="text-[10px] text-gray-400">Margin is a trading name of K2026125019 (SOUTH AFRICA) PTY LTD, registration number 2026/125019/07.</p>
            </div>
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
