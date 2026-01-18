import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';

const Docs = () => {
  usePageMeta({
    title: 'Acceptable Use Policy | Margin',
    description: "Acceptable use standards for Margin's automated reimbursement platform.",
    url: `${SITE_META.url}/docs`,
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
              Effective January 13, 2026
            </p>
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tight leading-tight">
              Acceptable Use Policy
            </h1>
            <p className="text-[15px] text-gray-500 mt-6 leading-relaxed">
              This Acceptable Use Policy is incorporated into and forms a binding part of the Margin Terms of Service. It defines the only permitted use of Margin and establishes zero-tolerance enforcement for any behavior that could harm Amazon, its systems, or the integrity of the Seller Central ecosystem.
            </p>
          </header>

          {/* Content */}
          <div className="space-y-12 text-[15px] leading-relaxed text-gray-600">

            {/* Section 1 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                01 — Permitted Use
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Margin may be used exclusively for the automated financial reconciliation and submission of legitimate FBA reimbursement claims related to the User's own, approved Amazon Selling Partner accounts.
                </p>
                <p>
                  This limited, non-transferable right includes only: analysis of SP-API data from the User's own Seller Central account, matching with evidence from User-authorized external sources, and submission of claims via Amazon's official channels.
                </p>
                <p>
                  <span className="text-gray-900">Agencies and Aggregators</span> — Management of third-party Seller Central accounts is permitted only where the User has explicit written authorization from the account owner.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                02 — Prohibited Conduct
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  You are strictly prohibited from using Margin to:
                </p>
                <div className="space-y-3 pl-4 border-l border-gray-200">
                  <p>
                    <span className="text-gray-900">Fraudulent Claims</span> — File fraudulent, false, fabricated, exaggerated, or unsupported claims lacking valid invoices, BOLs, or shipment records. Consequence: Immediate termination and reporting to Amazon.
                  </p>
                  <p>
                    <span className="text-gray-900">System Interference</span> — Interfere with, reverse engineer, or exploit Margin, SP-API, or Amazon systems. Consequence: Immediate termination.
                  </p>
                  <p>
                    <span className="text-gray-900">Excessive Submissions</span> — Submit excessive or automated claims that could constitute abuse or a Denial of Service attack on Amazon's systems. Consequence: Immediate termination.
                  </p>
                  <p>
                    <span className="text-gray-900">PII Misuse</span> — Use any PII obtained via Margin for marketing, solicitation, profiling, or any non-reimbursement purpose. Consequence: Immediate termination.
                  </p>
                  <p>
                    <span className="text-gray-900">Policy Violations</span> — Violate any Amazon Selling Partner Agreement, Policy, or Data Protection Policy. Consequence: Immediate termination and full cooperation with Amazon.
                  </p>
                </div>
                <p className="text-gray-600">
                  The User assumes 100% liability for the accuracy, legitimacy, and compliance of every claim submitted through Margin.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                03 — Monitoring and Enforcement
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Margin actively protects the Amazon ecosystem. We reserve the right to monitor account activity, claim volume, success rates, and data patterns for signs of abuse, fraud, or policy violation. We use automated and manual review to detect suspicious behavior.
                </p>
                <p>
                  <span className="text-gray-900">Immediate Action</span> — Upon detection of an AUP violation, Margin will: suspend service without notice, terminate the account permanently, retain logs and evidence for Amazon review, and report the User to Amazon where required or appropriate.
                </p>
                <p className="text-gray-600">
                  No refunds. No appeals.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                04 — Indemnification
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  You agree to indemnify, defend, and hold harmless Margin, its officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses arising from your breach of this AUP, your submission of fraudulent or non-compliant claims, and any investigation, penalty, or action by Amazon resulting from your use of Margin.
                </p>
                <p className="text-gray-600">
                  This obligation survives termination of your account.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                05 — Contact
              </h2>
              <div className="space-y-2 text-gray-700">
                <p>
                  Report suspected abuse at hello@margin.io
                </p>
                <p className="text-gray-500">
                  Internal escalation only — not for user support.
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
              <Link to="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
              <Link to="/docs" className="text-gray-600">Acceptable Use</Link>
              <Link to="/refund-policy" className="hover:text-gray-600 transition-colors">Refund</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Docs;
