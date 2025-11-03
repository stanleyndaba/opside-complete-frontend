import React from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="min-h-screen bg-[#0B1220] text-gray-100">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.12),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_35%)]" />
        <div className="relative container mx-auto px-6 py-12 md:py-20">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-12">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
              <img src="/logo-abstract.svg" alt="Clario" className="h-6 w-6" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="text-sm text-gray-400 space-y-1">
              <p><strong>Effective Date:</strong> [Insert Date]</p>
              <p><strong>Last Updated:</strong> [Insert Date]</p>
            </div>
          </header>

          <article className="bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-sm">
            <div className="px-6 py-10 md:px-12 md:py-14 space-y-10">
              <section className="space-y-4">
                <header className="space-y-3">
                  <p className="uppercase text-xs tracking-[0.3em] text-emerald-400">Legal</p>
                  <h1 className="text-3xl md:text-4xl font-semibold">Clario Terms of Service</h1>
                </header>
                <p className="text-gray-300 leading-relaxed">
                  These Terms of Service ("TOS") govern your access to and use of Clario ("Clario," "we," "us," or "our"), a SaaS platform that automates the identification, evidence-matching, and submission of FBA reimbursement claims on behalf of Amazon sellers ("User," "you," or "Seller").
                </p>
                <p className="text-gray-300 leading-relaxed">
                  By creating an account, connecting your Amazon Seller Central account via OAuth, or using any part of the Service, you agree to be bound by these TOS and the{' '}
                  <a href="https://clario.app/privacy" className="underline text-emerald-300 hover:text-emerald-200" target="_blank" rel="noreferrer">
                    Clario Data Privacy Policy
                  </a>{' '}
                  (which is incorporated herein by reference).
                </p>
              </section>

              <hr className="border-white/10" />

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">1. Acceptance and Service Scope (The Foundation)</h2>
                <p className="text-gray-300 leading-relaxed">
                  <strong>Clario</strong> is a software-as-a-service (SaaS) tool that automates the identification, evidence-matching, and submission of FBA reimbursement claims on the User's behalf.
                </p>
                <p className="text-gray-300 leading-relaxed">The Service includes:</p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Automated analysis of Amazon SP-API data (e.g., inventory adjustments, shipment discrepancies)</li>
                  <li>Extraction and matching of supporting evidence (e.g., invoices, BOLs) from user-authorized external sources</li>
                  <li>Preparation and submission of reimbursement claims via Amazon's official channels</li>
                </ul>
                <p className="text-gray-300 leading-relaxed font-medium">By using Clario, you agree:</p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>To these TOS and the Clario Data Privacy Policy</li>
                  <li><strong>To comply with all Amazon Selling Partner Agreements, Policies, and the Amazon Selling Partner API Developer Agreement</strong></li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">2. User Responsibilities and Conduct (The Amazon Shield)</h2>
                <p className="text-gray-300 leading-relaxed">You are solely responsible for your use of Clario.</p>
                <p className="text-gray-300 leading-relaxed">You agree to:</p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Provide accurate, complete, and authorized access to your Amazon Seller Central account and linked data sources (e.g., Gmail, Google Drive)</li>
                  <li><strong>Not use Clario to file fraudulent, fictitious, or unauthorized reimbursement claims</strong></li>
                  <li>Maintain the confidentiality and security of your Amazon Seller Central credentials and OAuth tokens</li>
                  <li>Immediately notify Clario of any unauthorized use of your account</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  <strong>Prohibited Use:</strong> Any attempt to manipulate, falsify, or misrepresent data to generate invalid claims violates these TOS and may result in immediate termination and reporting to Amazon.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">3. Fee Structure and Billing (The Business Model)</h2>
                <p className="text-gray-300 leading-relaxed">Clario operates on a <strong>contingency commission basis</strong>.</p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li><strong>Commission Rate</strong>: <strong>[X]%</strong> of the total reimbursement amount successfully credited to your Amazon account by Amazon</li>
                  <li><strong>Payment Trigger</strong>: Fees are calculated and invoiced <strong>only when Amazon credits funds</strong> to your Seller Central account as a result of a Clario-submitted claim</li>
                  <li><strong>No Recovery, No Fee</strong>: If no reimbursement is awarded, you owe nothing</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  <strong>Founder's Council Exemption</strong>: Early-access users enrolled in the Founder's Council program may be exempt from fees for up to [90 days] from activation. Standard commission applies thereafter.
                </p>
                <p className="text-gray-300 leading-relaxed">All fees are final and non-refundable unless required by law.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">4. Intellectual Property (IP)</h2>
                <p className="text-gray-300 leading-relaxed">Clario retains full ownership of:</p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>The Clario platform, software, and user interface</li>
                  <li>All algorithms, evidence-matching logic, claim-generation models, and automation workflows</li>
                  <li>Trademarks, logos, and branding</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  <strong>Limited License</strong>: You are granted a <strong>non-exclusive, non-transferable, revocable license</strong> to use the Service solely for your internal FBA reimbursement operations during the term of your active account.
                </p>
                <p className="text-gray-300 leading-relaxed">You may not copy, modify, reverse-engineer, or create derivative works of any part of Clario.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">5. Termination and Suspension</h2>
                <h3 className="text-xl font-medium">Clario's Right to Suspend or Terminate</h3>
                <p className="text-gray-300 leading-relaxed">We may <strong>immediately suspend or terminate</strong> your access if:</p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>You violate these TOS</li>
                  <li>We suspect fraudulent or policy-violating activity</li>
                  <li>Amazon revokes or restricts your SP-API access</li>
                  <li>Required for legal or security reasons</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  <strong>Self-Policing Commitment</strong>: Clario actively monitors for abuse and will report suspected violations of Amazon policy to Amazon, Inc.
                </p>
                <h3 className="text-xl font-medium">Your Right to Cancel</h3>
                <p className="text-gray-300 leading-relaxed">
                  You may cancel your Clario account at any time via in-app settings or by emailing{' '}
                  <a href="mailto:support@clario.app" className="underline text-emerald-300 hover:text-emerald-200">support@clario.app</a>.
                  {' '}Cancellation takes effect immediately. No further claims will be filed after cancellation.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">6. Disclaimer of Warranties</h2>
                <p className="text-gray-300 leading-relaxed"><strong>CLARIO DOES NOT GUARANTEE:</strong></p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Recovery of any specific reimbursement amount</li>
                  <li>Approval or successful resolution of any claim submitted</li>
                  <li>Amazon's processing timeline or decision-making</li>
                </ul>
                <p className="text-gray-300 leading-relaxed"><strong>Final authority rests solely with Amazon, Inc.</strong></p>
                <p className="text-gray-300 leading-relaxed">
                  The Service is provided <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">7. Limitation of Liability and Governing Law</h2>
                <p className="text-gray-300 leading-relaxed">
                  <strong>Liability Cap</strong>: To the fullest extent permitted by law, Clario's total liability to you shall not exceed the total fees paid by you to Clario in the <strong>12 months</strong> preceding the claim.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  <strong>No Consequential Damages</strong>: In no event shall Clario be liable for indirect, incidental, special, punitive, or consequential damages, including lost profits, data, or business opportunity.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  <strong>Governing Law</strong>: These TOS shall be governed by the laws of the <strong>State of Delaware</strong>, without regard to conflict of law principles. Any disputes shall be resolved exclusively in the state or federal courts located in <strong>New Castle County, Delaware</strong>.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Contact Us</h2>
                <p className="text-gray-300 leading-relaxed">For support, cancellation, or legal inquiries:</p>
                <div className="space-y-2 text-gray-300">
                  <p><strong>Email</strong>: <a href="mailto:legal@clario.app" className="underline text-emerald-300 hover:text-emerald-200">legal@clario.app</a></p>
                  <p><strong>Response Time</strong>: Within 48 hours</p>
                </div>
              </section>

              <p className="text-sm text-gray-400 italic">Clario empowers sellers. Compliance protects us all.</p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default Terms;
