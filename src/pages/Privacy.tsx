import React from 'react';
import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(16,185,129,0.08),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.06),transparent_45%)]" />
        <div className="relative container mx-auto px-6 py-12 md:py-20">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-12">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <img src="/donelogo.png" alt="Clario" className="h-8 w-8 rounded-full object-cover border border-black/10" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="text-sm text-gray-500 space-y-1">
              <p><strong>Effective Date:</strong> [Insert Date]</p>
              <p><strong>Last Updated:</strong> [Insert Date]</p>
            </div>
          </header>

          <article className="bg-white/90 border border-black/5 rounded-3xl shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="px-6 py-10 md:px-12 md:py-14 space-y-10 text-gray-700">
              <section className="space-y-4">
                <header className="space-y-3">
                  <p className="uppercase text-xs tracking-[0.3em] text-emerald-600">Privacy</p>
                  <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">Clario Data Privacy Policy</h1>
                </header>
                <p className="leading-relaxed">
                  Clario is committed to protecting the privacy and security of your data. This Data Privacy Policy ("Policy") explains how Clario ("we," "us," or "our") collects, uses, stores, and protects data obtained through the Amazon Selling Partner API ("SP-API") and user-linked external sources (e.g., email or cloud accounts). This Policy applies exclusively to data processed in connection with Clario's automated FBA reimbursement and financial reconciliation service ("Service").
                </p>
              </section>

              <hr className="border-gray-200" />

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">1. Data Collected (The "What")</h2>
                <p className="text-gray-600 leading-relaxed">Clario collects only the minimum data necessary to provide the Service. We do not collect irrelevant or excessive data.</p>

                <h3 className="text-xl font-medium text-gray-900">Amazon Data via SP-API</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li><strong>Minimal PII</strong>: Recipient names and shipping addresses are collected only to comply with Amazon's official FBA reconciliation and return policies (e.g., lost/damaged inventory verification). This PII is never used for advertising, marketing, user profiling, or any purpose outside the core Service.</li>
                  <li>
                    <strong>Non-PII Operational Data</strong> includes:
                    <ul className="list-disc pl-6 space-y-2 text-gray-600">
                      <li>Financial reports (e.g., GET_FBA_REIMBURSEMENTS, GET_LEDGER_DETAIL_VIEW_DATA)</li>
                      <li>Inventory adjustments (e.g., GET_FBA_INVENTORY_ADJUSTMENTS)</li>
                      <li>FBA shipment tracking (e.g., GET_FBA_SHIPMENTS)</li>
                      <li>Fee and transaction statements (e.g., GET_AMAZON_FULFILLED_SHIPMENTS)</li>
                    </ul>
                  </li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">External Evidence Data</h3>
                <p className="text-gray-600 leading-relaxed">
                  Invoice and Bill of Lading (BOL) documents extracted from user-authorized email or cloud accounts (e.g., Gmail, Google Drive, Outlook).
                </p>
                <p className="text-gray-600 leading-relaxed">Data points include: supplier names, product SKUs, quantities, shipment dates, tracking numbers, and cost values.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">2. Purpose of Collection (The "Why")</h2>
                <p className="text-gray-600 leading-relaxed">All data collection is strictly limited to enabling the Service for the seller's internal benefit.</p>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  Amazon data is collected solely for the purpose of identifying and filing FBA reimbursement claims on the user's behalf and providing a consolidated financial reporting view.
                </blockquote>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  External evidence data is collected solely for the automated matching and validation of FBA claims, as required by Amazon's official reimbursement policies.
                </blockquote>
                <p className="text-gray-600 leading-relaxed">No data is used for Clario's independent business purposes, analytics, or third-party enrichment.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">3. Data Usage Limitation (The Rejection Shield)</h2>
                <p className="text-gray-600 leading-relaxed"><strong>We agree to and comply with the Amazon Selling Partner API Data Protection Policy (DPP).</strong></p>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  We will not use any Amazon data, including PII, for any purpose other than providing the agreed-upon automated financial reconciliation service to the seller. We will never use the data for advertising, marketing, or any purpose that benefits Clario directly without explicit, documented seller consent beyond the core service.
                </blockquote>
                <p className="text-gray-600 leading-relaxed">Violation of this limitation constitutes grounds for immediate termination of data access and user notification.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">4. Data Storage and Security (The "How Protected")</h2>
                <p className="text-gray-600 leading-relaxed">Clario implements industry-leading security controls aligned with Amazon DPP requirements.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-700">
                    <thead className="uppercase text-xs tracking-wider text-gray-500">
                      <tr>
                        <th className="py-3 pr-6">Security Measure</th>
                        <th className="py-3">Implementation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-600">
                      <tr>
                        <td className="py-3 pr-6 font-medium">Encryption</td>
                        <td className="py-3">All data, including Amazon PII and external evidence, is encrypted in transit (TLS 1.2 or higher) and at rest (AES-256 or equivalent).</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-6 font-medium">Access Control</td>
                        <td className="py-3">Access to data is restricted using the principle of least privilege and is only available to personnel required for service maintenance (e.g., developers) through secure access points (e.g., multi-factor authentication, VPNs).</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-6 font-medium">Data Separation</td>
                        <td className="py-3">Amazon PII is stored logically separate from other business data.</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-6 font-medium">Infrastructure</td>
                        <td className="py-3">Hosted on AWS with VPC isolation, WAF, and automated security scanning.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">5. Data Retention Policy (The "When Deleted")</h2>
                <p className="text-gray-600 leading-relaxed">We do not retain data longer than necessary.</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li><strong>Deauthorization</strong>: If a user deauthorizes Clario from their Amazon account, Clario will initiate the secure deletion of all collected Amazon data, including PII, within 30 days (or the maximum allowed by Amazon, currently 90 days).</li>
                  <li><strong>User Request</strong>: Users can request immediate deletion of their data at any time via in-app settings or by emailing <a href="mailto:support@clario.app" className="underline text-emerald-600 hover:text-emerald-700">support@clario.app</a>. Deletion is completed within 7 business days.</li>
                </ul>
                <p className="text-gray-600 leading-relaxed">Audit logs confirming deletion are retained for compliance purposes only.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">6. Sharing and Disclosure (The "With Whom")</h2>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  Clario does not share or sell user data to third parties.
                </blockquote>
                <p className="text-gray-600 leading-relaxed"><strong>Sole Exception</strong>:</p>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  Data is shared only with Amazon, Inc., for the sole purpose of submitting reimbursement claims on the seller's behalf.
                </blockquote>
                <p className="text-gray-600 leading-relaxed">This transmission occurs exclusively via Amazon's secure SP-API endpoints and includes only the minimum required fields.</p>
                <p className="text-gray-600 leading-relaxed">No subcontractors, analytics providers, or affiliates receive access to Amazon data.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">7. Changes to This Policy</h2>
                <p className="text-gray-600 leading-relaxed">We reserve the right to update this Policy to reflect changes in our Service or legal requirements. <strong>Material changes</strong> (e.g., new data types, purposes, or sharing) will be communicated to users via:</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Email to the address associated with their Clario account</li>
                  <li>In-app notification banner</li>
                </ul>
                <p className="text-gray-600 leading-relaxed">Changes take effect 30 days after notification, during which users may review and deauthorize if desired. Continued use after this period constitutes acceptance.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">Contact Us</h2>
                <p className="text-gray-600 leading-relaxed">For questions, deletion requests, or compliance inquiries:</p>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Email</strong>: <a href="mailto:privacy@clario.app" className="underline text-emerald-600 hover:text-emerald-700">privacy@clario.app</a></p>
                  <p><strong>Response Time</strong>: Within 48 hours</p>
                </div>
              </section>

              <p className="text-sm text-gray-500 italic">Clario operates under the principle of Least Privilege. Your trust is our foundation.</p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default Privacy;

