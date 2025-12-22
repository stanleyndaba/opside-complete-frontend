import React from 'react';
import LegalHeader from '@/components/layout/LegalHeader';
import LegalFooter from '@/components/layout/LegalFooter';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';

const Terms = () => {
  usePageMeta({
    title: 'Opside Terms of Service',
    description: "Review the terms that govern use of Opside's automated FBA reimbursement platform.",
    url: `${SITE_META.url}/terms`,
    image: SITE_META.image
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <LegalHeader />

      <main className="flex-1 container mx-auto px-6 py-12 md:py-16">
        <article className="max-w-3xl mx-auto">
          <header className="mb-8 pb-8 border-b border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Effective Date: January 1, 2025</p>
            <p className="text-sm text-gray-500 mb-6">Last Updated: November 17, 2025</p>
            <h1 className="text-2xl font-medium text-gray-900">Opside Terms of Service</h1>
          </header>

          <div className="space-y-8 text-sm leading-relaxed text-gray-700">
            <p>
              These Terms of Service ("TOS") govern your access to and use of Opside ("Opside," "we," "us," or "our"), a SaaS platform that automates the identification, evidence-matching, and submission of FBA reimbursement claims on behalf of Amazon sellers ("User," "you," or "Seller").
            </p>
            <p>
              By creating an account, connecting your Amazon Seller Central account via OAuth, or using any part of the Service, you agree to be bound by these TOS and the Opside Data Privacy Policy (which is incorporated herein by reference).
            </p>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">1. Acceptance and Service Scope</h2>
              <p>
                Opside is a software-as-a-service (SaaS) tool that automates the identification, evidence-matching, and submission of FBA reimbursement claims on the User's behalf.
              </p>
              <p>The Service includes:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Automated analysis of Amazon SP-API data (e.g., inventory adjustments, shipment discrepancies)</li>
                <li>Extraction and matching of supporting evidence (e.g., invoices, BOLs) from user-authorized external sources</li>
                <li>Preparation and submission of reimbursement claims via Amazon's official channels</li>
              </ul>
              <p>By using Opside, you agree:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>To these TOS and the Opside Data Privacy Policy</li>
                <li>To comply with all Amazon Selling Partner Agreements, Policies, and the Amazon Selling Partner API Developer Agreement</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">2. User Responsibilities and Conduct</h2>
              <p>You are solely responsible for your use of Opside. You agree to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide accurate, complete, and authorized access to your Amazon Seller Central account and linked data sources (e.g., Gmail, Google Drive)</li>
                <li>Not use Opside to file fraudulent, fictitious, or unauthorized reimbursement claims</li>
                <li>Maintain the confidentiality and security of your Amazon Seller Central credentials and OAuth tokens</li>
                <li>Immediately notify Opside of any unauthorized use of your account</li>
              </ul>
              <p>
                Prohibited Use: Any attempt to manipulate, falsify, or misrepresent data to generate invalid claims violates these TOS and may result in immediate termination and reporting to Amazon.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">3. Fee Structure and Billing</h2>
              <p>Opside operates on a contingency commission basis.</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Commission Rate: 20% of the total reimbursement amount successfully credited to your Amazon account by Amazon</li>
                <li>Payment Trigger: Fees are calculated and invoiced only when Amazon credits funds to your Seller Central account as a result of an Opside-submitted claim</li>
                <li>No Recovery, No Fee: If no reimbursement is awarded, you owe nothing</li>
              </ul>
              <p>
                Founder's Council Exemption: Early-access users enrolled in the Founder's Council program may be exempt from fees for the initial 90-day period from activation. Standard commission applies thereafter.
              </p>
              <p>All fees are final and non-refundable unless required by law.</p>

              <h3 className="text-sm font-medium text-gray-900 mt-4">3.1 Payment and Billing</h3>
              <p>
                To use the Service, you must provide a valid payment method (e.g., credit card via Stripe). You authorize Opside to charge your payment method for all commission fees due under this TOS.
              </p>
              <p>
                Invoices will be generated monthly in arrears, based on reimbursements successfully credited to your account. Payment is due upon receipt. Failure to pay may result in suspension or termination of your account.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">4. Intellectual Property</h2>
              <p>Opside retains full ownership of:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>The Opside platform, software, and user interface</li>
                <li>All algorithms, evidence-matching logic, claim-generation models, and automation workflows</li>
                <li>Trademarks, logos, and branding</li>
              </ul>
              <p>
                Limited License: You are granted a non-exclusive, non-transferable, revocable license to use the Service solely for your internal FBA reimbursement operations during the term of your active account.
              </p>
              <p>You may not copy, modify, reverse-engineer, or create derivative works of any part of Opside.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">5. Termination and Suspension</h2>

              <h3 className="text-sm font-medium text-gray-900">Opside's Right to Suspend or Terminate</h3>
              <p>We may immediately suspend or terminate your access if:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>You violate these TOS</li>
                <li>We suspect fraudulent or policy-violating activity</li>
                <li>Amazon revokes or restricts your SP-API access</li>
                <li>Required for legal or security reasons</li>
              </ul>
              <p>
                Self-Policing Commitment: Opside actively monitors for abuse and will report suspected violations of Amazon policy to Amazon, Inc.
              </p>

              <h3 className="text-sm font-medium text-gray-900 mt-4">Your Right to Cancel</h3>
              <p>
                You may cancel your Opside account at any time via in-app settings or by emailing support@opside.co. Cancellation takes effect immediately. No further claims will be filed after cancellation.
              </p>

              <h3 className="text-sm font-medium text-gray-900 mt-4">5.1 Effect of Termination</h3>
              <p>
                Upon termination by either party, your license to use the Service ceases immediately. However, you remain liable for all commission fees on claims submitted by Opside prior to termination that are subsequently approved and credited by Amazon. Opside reserves the right to invoice for these post-termination fees.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">6. Disclaimer of Warranties</h2>
              <p>OPSIDE DOES NOT GUARANTEE:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Recovery of any specific reimbursement amount</li>
                <li>Approval or successful resolution of any claim submitted</li>
                <li>Amazon's processing timeline or decision-making</li>
              </ul>
              <p>Final authority rests solely with Amazon, Inc.</p>
              <p>
                The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">7. Limitation of Liability and Governing Law</h2>
              <p>
                Liability Cap: To the fullest extent permitted by law, Opside's total liability to you shall not exceed the total fees paid by you to Opside in the 12 months preceding the claim.
              </p>
              <p>
                No Consequential Damages: In no event shall Opside be liable for indirect, incidental, special, punitive, or consequential damages, including lost profits, data, or business opportunity.
              </p>
              <p>
                Governing Law: These TOS shall be governed by the laws of the State of Delaware, without regard to conflict of law principles. Any disputes shall be resolved exclusively in the state or federal courts located in New Castle County, Delaware.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">8. Dispute Resolution by Binding Arbitration</h2>
              <p>
                PLEASE READ THIS SECTION CAREFULLY AS IT AFFECTS YOUR RIGHTS.
              </p>
              <p>
                Any dispute, claim, or controversy arising out of or relating to these TOS or the breach, termination, enforcement, interpretation, or validity thereof, shall be determined by binding arbitration in New Castle County, Delaware, rather than in court. You agree to waive your right to a trial by jury or to participate in a class action. This arbitration provision shall survive termination of these TOS.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">9. Contact Information</h2>
              <p>For support, cancellation, or legal inquiries:</p>
              <p>Opside, Inc.</p>
              <p>Email: support@opside.co</p>
              <p>Response Time: Within 48 hours</p>
            </section>
          </div>
        </article>
      </main>

      <LegalFooter />
    </div>
  );
};

export default Terms;
