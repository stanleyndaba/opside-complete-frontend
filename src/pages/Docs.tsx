import React from 'react';
import LegalHeader from '@/components/layout/LegalHeader';
import LegalFooter from '@/components/layout/LegalFooter';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';

const Docs = () => {
  usePageMeta({
    title: 'Margin Acceptable Use Policy',
    description: "Acceptable use standards for Margin's automated reimbursement platform.",
    url: `${SITE_META.url}/docs`,
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
            <h1 className="text-2xl font-medium text-gray-900">Acceptable Use Policy</h1>
            <p className="text-sm text-gray-600 mt-2">Part of Margin Terms of Service</p>
          </header>

          <div className="space-y-8 text-sm leading-relaxed text-gray-700">
            <p>
              This Acceptable Use Policy ("AUP") is incorporated into and forms a binding part of the Margin Terms of Service ("TOS"). It defines the only permitted use of Margin and establishes zero-tolerance enforcement for any behavior that could harm Amazon, its systems, or the integrity of the Seller Central ecosystem.
            </p>
            <p>
              Violation of this AUP constitutes a material breach of the TOS and will result in immediate termination of access.
            </p>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">1. Permitted Use</h2>
              <p>Margin may be used exclusively for:</p>
              <p className="pl-4 border-l-2 border-gray-300 text-gray-700">
                The automated financial reconciliation and submission of legitimate FBA reimbursement claims related to the User's own, approved Amazon Selling Partner accounts.
              </p>
              <p>This limited, non-transferable right includes only:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Analysis of SP-API data from the User's own Seller Central account</li>
                <li>Matching with evidence (invoices, BOLs) from User-authorized external sources</li>
                <li>Submission of claims via Amazon's official channels</li>
              </ul>

              <p className="font-medium text-gray-900 mt-4">Prohibited:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Using Margin for third-party accounts, agency services, or account management on behalf of others</li>
                <li>Reselling, redistributing, or repurposing Margin data or functionality</li>
                <li>Any use outside the User's own internal FBA operations</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">2. Prohibited Conduct</h2>
              <p>You are strictly prohibited from using Margin to:</p>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 border-b border-gray-200">Violation</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 border-b border-gray-200">Consequence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="py-3 px-4">File fraudulent, false, fabricated, exaggerated, or unsupported claims (e.g., claims lacking valid invoices, BOLs, or shipment records)</td>
                      <td className="py-3 px-4">Immediate termination + reporting to Amazon</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Interfere with, reverse engineer, or exploit Margin, SP-API, or Amazon systems</td>
                      <td className="py-3 px-4">Immediate termination</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Submit excessive or automated claims that could constitute abuse or a Denial of Service (DoS) attack on Amazon's systems</td>
                      <td className="py-3 px-4">Immediate termination</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Use any PII obtained via Margin for marketing, solicitation, profiling, or any non-reimbursement purpose</td>
                      <td className="py-3 px-4">Immediate termination</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Violate any Amazon Selling Partner Agreement, Policy, or Data Protection Policy</td>
                      <td className="py-3 px-4">Immediate termination + full cooperation with Amazon</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="pl-4 border-l-2 border-gray-300 text-gray-700 mt-4">
                The User assumes 100% liability for the accuracy, legitimacy, and compliance of every claim submitted through Margin.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">3. Monitoring and Enforcement</h2>
              <p>Margin actively protects the Amazon ecosystem.</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>We reserve the right to monitor account activity, claim volume, success rates, and data patterns for signs of abuse, fraud, or policy violation.</li>
                <li>We use automated and manual review to detect suspicious behavior (e.g., high claim-to-inventory ratios, duplicate submissions, missing evidence).</li>
              </ul>

              <p className="font-medium text-gray-900 mt-4">Immediate Action:</p>
              <p>Upon detection of an AUP violation, Margin will:</p>
              <ol className="list-decimal pl-6 space-y-1">
                <li>Suspend service without notice</li>
                <li>Terminate the account permanently</li>
                <li>Retain logs and evidence for Amazon review</li>
                <li>Report the User to Amazon, Inc. where required or appropriate</li>
              </ol>
              <p className="mt-2">No refunds. No appeals.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">4. Indemnification</h2>
              <p className="pl-4 border-l-2 border-gray-300 text-gray-700">
                You agree to indemnify, defend, and hold harmless Margin, its officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Your breach of this AUP</li>
                <li>Your submission of fraudulent or non-compliant claims</li>
                <li>Any investigation, penalty, or action by Amazon resulting from your use of Margin</li>
              </ul>
              <p className="text-gray-600 mt-2">This obligation survives termination of your account.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">5. Contact for AUP Violations</h2>
              <p>Report suspected abuse: support@margin.app</p>
              <p className="text-gray-600">Internal escalation only — not for user support.</p>
            </section>
          </div>
        </article>
      </main>

      <LegalFooter />
    </div>
  );
};

export default Docs;
