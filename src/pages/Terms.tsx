import React from 'react';
import { Link } from 'react-router-dom';
import LegalHeader from '@/components/layout/LegalHeader';
import LegalFooter from '@/components/layout/LegalFooter';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';

const Terms = () => {
  usePageMeta({
    title: 'Opside Terms of Service',
    description: "Terms of Service governing use of Opside's automated FBA auditing platform.",
    url: `${SITE_META.url}/terms`,
    image: SITE_META.image
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <LegalHeader />

      <main className="flex-1 container mx-auto px-6 py-12 md:py-16">
        <article className="max-w-3xl mx-auto">
          <header className="mb-8 pb-8 border-b border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Effective Date: December 22, 2025</p>
            <p className="text-sm text-gray-500 mb-6">Last Updated: December 22, 2025</p>
            <h1 className="text-2xl font-medium text-gray-900">Terms of Service</h1>
          </header>

          <div className="space-y-8 text-sm leading-relaxed text-gray-700">

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">1. Introduction</h2>
              <p>
                These Terms of Service ("Terms") govern your access to and use of Opside ("Opside," "we," "us," or "our"), a SaaS platform that automates the identification and auditing of Amazon FBA discrepancies. By creating an account or using the Service, you agree to be bound by these Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">2. Relationship with Amazon (Crucial)</h2>
              <p>Opside is an independent third-party software provider.</p>
              <p>
                <strong>No Affiliation:</strong> Opside is not affiliated with, endorsed by, or sponsored by Amazon.com, Inc. or its affiliates.
              </p>
              <p>
                <strong>Amazon Terms:</strong> Your use of Opside does not exempt you from complying with Amazon's Selling Partner Terms of Service. You agree that you are solely responsible for ensuring your use of our tool complies with Amazon's policies.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">3. Service Scope</h2>
              <p>
                Opside provides automated analysis of Amazon SP-API data to identify potential inventory and financial discrepancies.
              </p>
              <p>
                <strong>Automated Audits:</strong> We scan your transaction logs to find potential claims.
              </p>
              <p>
                <strong>No Guarantee:</strong> Opside identifies potential discrepancies. We do not guarantee that Amazon will approve any specific reimbursement claim. Final reimbursement decisions rest solely with Amazon.
              </p>
              <p>
                <strong>Fair Use:</strong> Opside automates the detection of claims. You agree not to use Opside to submit false, misleading, or duplicative claims to Amazon, which may violate Amazon's Code of Conduct.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">4. Fees and Billing</h2>

              <h3 className="text-sm font-medium text-gray-900">4.1 Subscription Fees</h3>
              <p>Opside operates on a recurring subscription basis.</p>
              <p>
                <strong>Billing:</strong> Subscription fees are billed in advance via our payment processor, Paystack.
              </p>
              <p>
                <strong>Authorization:</strong> You authorize Opside to charge your payment method for all fees.
              </p>
              <p>
                <strong>Changes:</strong> Opside reserves the right to change pricing with 30 days' notice.
              </p>

              <h3 className="text-sm font-medium text-gray-900 mt-4">4.2 Refunds</h3>
              <p>
                As stated in our <Link to="/refund-policy" className="underline text-gray-900 hover:text-gray-700">Refund Policy</Link>, we do not offer refunds for partial months of service or unused time.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">5. User Responsibilities and Data</h2>
              <p>You are solely responsible for your use of Opside. You agree to:</p>
              <p>
                <strong>Security:</strong> Maintain the strict confidentiality of your Amazon Seller Central credentials.
              </p>
              <p>
                <strong>Data Access:</strong> You grant Opside limited access to your Amazon data via the official SP-API solely for the purpose of auditing. We handle this data in strict accordance with Amazon's Data Protection Policy (DPP).
              </p>
              <p>
                <strong>Prohibited Actions:</strong> You will not use Opside to reverse-engineer Amazon's systems or spam Amazon's support channels.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">6. Intellectual Property</h2>
              <p>
                Opside (Pty) Ltd retains full ownership of the platform, algorithms, and source code. You are granted a limited, non-exclusive, non-transferable license to use the Service for your internal business operations.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">7. Termination</h2>
              <p>
                <strong>By You:</strong> You may cancel your subscription at any time via your dashboard.
              </p>
              <p>
                <strong>By Us:</strong> We may suspend your access immediately if you violate these Terms or if your Amazon Seller account is suspended.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">8. Limitation of Liability</h2>
              <p>To the fullest extent permitted by South African law:</p>
              <p>
                <strong>Liability Cap:</strong> Opside's total liability to you shall not exceed the total fees paid by you to Opside in the 6 months preceding the claim.
              </p>
              <p>
                <strong>Amazon Actions:</strong> Opside is NOT liable for any actions taken by Amazon against your account, including account suspension, warning letters, or withheld funds. You use this tool at your own risk.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">9. Governing Law and Dispute Resolution</h2>
              <p>
                These Terms shall be governed by the laws of the Republic of South Africa.
              </p>
              <p>
                <strong>Jurisdiction:</strong> You agree to submit to the exclusive jurisdiction of the courts located in Durban, KwaZulu-Natal.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">10. Contact Us</h2>
              <p>Opside (Pty) Ltd</p>
              <p>Email: support@opside.co</p>
            </section>
          </div>
        </article>
      </main>

      <LegalFooter />
    </div>
  );
};

export default Terms;
