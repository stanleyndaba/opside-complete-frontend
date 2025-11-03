import React from 'react';
import { Link } from 'react-router-dom';

const Docs = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_-5%,rgba(16,185,129,0.08),transparent_40%),radial-gradient(circle_at_85%_-10%,rgba(59,130,246,0.06),transparent_45%)]" />
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
              <header className="space-y-4">
                <div className="space-y-2">
                  <p className="uppercase text-xs tracking-[0.3em] text-emerald-600">Docs</p>
                  <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">Acceptable Use Policy (AUP)</h1>
                </div>
                <p className="text-sm text-gray-500 font-medium">Part of Clario Terms of Service</p>
              </header>

              <section className="space-y-4">
                <p>
                  This <strong>Acceptable Use Policy</strong> ("AUP") is incorporated into and forms a binding part of the
                  {' '}<strong>Clario Terms of Service</strong> ("TOS"). It defines the <strong>only permitted use</strong> of Clario and establishes
                  {' '}<strong>zero-tolerance enforcement</strong> for any behavior that could harm Amazon, its systems, or the integrity of the Seller Central ecosystem.
                </p>
                <p>
                  Violation of this AUP constitutes a <strong>material breach</strong> of the TOS and will result in <strong>immediate termination</strong> of access.
                </p>
              </section>

              <hr className="border-gray-200" />

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">1. The Single Permitted Use (The Scope)</h2>
                <p><strong>Clario may be used exclusively for:</strong></p>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  The automated financial reconciliation and submission of legitimate FBA reimbursement claims related to the User's own, approved Amazon Selling Partner accounts.
                </blockquote>
                <p className="font-medium text-gray-700">This limited, non-transferable right includes only:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Analysis of SP-API data from the User’s own Seller Central account</li>
                  <li>Matching with evidence (invoices, BOLs) from User-authorized external sources</li>
                  <li>Submission of claims via Amazon’s official channels</li>
                </ul>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-gray-700 space-y-2">
                  <p className="font-semibold text-rose-600 uppercase tracking-[0.2em] text-xs">Prohibited</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Using Clario for <strong>third-party accounts</strong>, <strong>agency services</strong>, or account management on behalf of others</li>
                    <li>Reselling, redistributing, or repurposing Clario data or functionality</li>
                    <li>Any use outside the User’s own internal FBA operations</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">2. Prohibited Conduct (The Absolute Red Flags)</h2>
                <p className="text-gray-600">You are strictly prohibited from using Clario to:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-700">
                    <thead className="uppercase text-xs tracking-wider text-gray-500">
                      <tr>
                        <th className="py-3 pr-6">Violation</th>
                        <th className="py-3">Consequence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-3 pr-6 font-medium">File fraudulent, false, fabricated, exaggerated, or unsupported claims (e.g., claims lacking valid invoices, BOLs, or shipment records)</td>
                        <td className="py-3 text-rose-600 font-semibold">Immediate termination + reporting to Amazon</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-6 font-medium">Interfere with, reverse engineer, or exploit Clario, SP-API, or Amazon systems</td>
                        <td className="py-3 text-rose-600 font-semibold">Immediate termination</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-6 font-medium">Submit excessive or automated claims that could constitute abuse or a Denial of Service (DoS) attack on Amazon’s systems</td>
                        <td className="py-3 text-rose-600 font-semibold">Immediate termination</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-6 font-medium">Use any PII obtained via Clario for marketing, solicitation, profiling, or any non-reimbursement purpose</td>
                        <td className="py-3 text-rose-600 font-semibold">Immediate termination</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-6 font-medium">Violate any Amazon Selling Partner Agreement, Policy, or Data Protection Policy</td>
                        <td className="py-3 text-rose-600 font-semibold">Immediate termination + full cooperation with Amazon</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  The User assumes 100% liability for the accuracy, legitimacy, and compliance of every claim submitted through Clario.
                </blockquote>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">3. Monitoring and Enforcement (The Alliance)</h2>
                <p className="text-gray-600">Clario actively protects the Amazon ecosystem.</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>We <strong>reserve the right to monitor</strong> account activity, claim volume, success rates, and data patterns for signs of abuse, fraud, or policy violation.</li>
                  <li>We use <strong>automated and manual review</strong> to detect suspicious behavior (e.g., high claim-to-inventory ratios, duplicate submissions, missing evidence).</li>
                </ul>
                <div className="space-y-3">
                  <p className="font-semibold text-gray-900">Immediate Action:</p>
                  <p className="text-gray-600">Upon detection of an AUP violation, Clario will:</p>
                  <ol className="list-decimal pl-6 space-y-2 text-gray-600">
                    <li><strong>Suspend service without notice</strong></li>
                    <li><strong>Terminate the account permanently</strong></li>
                    <li><strong>Retain logs and evidence</strong> for Amazon review</li>
                    <li><strong>Report the User to Amazon, Inc.</strong> where required or appropriate</li>
                  </ol>
                  <p className="text-rose-600 font-semibold uppercase text-xs tracking-[0.2em]">No refunds. No appeals.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">4. Indemnification</h2>
                <blockquote className="border-l-4 border-emerald-500/70 pl-4 text-gray-700 italic">
                  You agree to indemnify, defend, and hold harmless Clario, its officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys’ fees) arising from:
                </blockquote>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Your breach of this AUP</li>
                  <li>Your submission of fraudulent or non-compliant claims</li>
                  <li>Any investigation, penalty, or action by Amazon resulting from your use of Clario</li>
                </ul>
                <p className="text-sm text-gray-500 italic">This obligation survives termination of your account.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">Contact for AUP Violations</h2>
                <p className="text-gray-600">
                  <strong>Report suspected abuse:</strong>{' '}
                  <a href="mailto:abuse@clario.app" className="underline text-emerald-600 hover:text-emerald-700">abuse@clario.app</a>
                </p>
                <p className="text-sm text-gray-500 italic">Internal escalation only — not for user support.</p>
              </section>

              <p className="text-sm text-gray-500 italic">
                Clario is a partner in integrity. We police our platform so Amazon doesn’t have to.
              </p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default Docs;
