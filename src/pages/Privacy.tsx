import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';

const Privacy = () => {
  usePageMeta({
    title: 'Privacy Policy | Margin',
    description: "Privacy Policy for Margin's automated FBA auditing platform.",
    url: `${SITE_META.url}/privacy`,
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
            <p className="text-xs text-gray-400 uppercase tracking-tight mb-4">
              Last Updated December 22, 2025
            </p>
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tight leading-tight">
              Privacy Policy
            </h1>
            <p className="text-[16px] text-gray-500 mt-6 leading-relaxed">
              This Privacy Policy describes our policies on the collection, use, and disclosure of data when you use the Service and explains how we comply with the Amazon Data Protection Policy and the Protection of Personal Information Act.
            </p>
          </header>

          {/* Content */}
          <div className="space-y-12 text-[16px] leading-relaxed text-gray-600">

            {/* Section 1 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-tight mb-4">
                01 — Definitions
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <span className="text-gray-900">Company</span> — Refers to Margin, operating from Durban, South Africa.
                </p>
                <p>
                  <span className="text-gray-900">Service</span> — Refers to the Margin application and platform.
                </p>
                <p>
                  <span className="text-gray-900">Personal Data</span> — Any information that relates to an identified or identifiable individual.
                </p>
                <p>
                  <span className="text-gray-900">Amazon Information</span> — All data accessed via the Amazon Selling Partner API, including Restricted Data and Personally Identifiable Information.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-tight mb-4">
                02 — Data Collection
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <span className="text-gray-900">Personal Data</span> — We collect limited account information necessary to operate your workspace: email address, name, and payment information processed securely via Paystack.
                </p>
                <p>
                  <span className="text-gray-900">Amazon Information</span> — To perform automated reimbursement analysis, we access SP-API data in strict compliance with the Amazon DPP. This includes inventory adjustment reports, shipment discrepancy reports, financial and settlement reports, and PII strictly limited to matching claims to reimbursement cases.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-tight mb-4">
                03 — Data Use
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We use Personal Data and Amazon Information for a single purpose: to provide and improve the Margin reimbursement Service. Specifically, we use data to manage and authenticate your account, algorithmically identify and file reimbursement claims, and reconcile payments.
                </p>
                <p>
                  <span className="text-gray-900">Strict Prohibition on PII Use</span> — As required by the Amazon DPP, we will never use Amazon Information for any purpose outside of delivering the Service. We do not sell, rent, or monetize Amazon Information. We do not use it for marketing, remarketing, or advertising.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-tight mb-4">
                04 — Security
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <span className="text-gray-900">Encryption at Rest</span> — All Amazon Information stored in our databases is encrypted using AES-256.
                </p>
                <p>
                  <span className="text-gray-900">Encryption in Transit</span> — All data traverses HTTPS endpoints secured with TLS 1.2 or higher.
                </p>
                <p>
                  <span className="text-gray-900">Access Control</span> — We enforce least-privilege access. Only authorized engineers with MFA-protected sessions may access production systems.
                </p>
                <p>
                  <span className="text-gray-900">Network Security</span> — Infrastructure is hosted in Amazon Web Services within a locked-down Virtual Private Cloud protected by strict firewall policies.
                </p>
                <p>
                  <span className="text-gray-900">Incident Response</span> — We maintain a formal Incident Response Plan and will notify Amazon within 24 hours of any confirmed incident involving Amazon Information.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-tight mb-4">
                05 — Data Retention
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We retain Personal Data only for as long as needed to operate your account. We permanently delete all Amazon Information within 30 days of account termination. You may request deletion at any time by contacting us.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-tight mb-4">
                06 — POPIA Compliance
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  In accordance with the Protection of Personal Information Act 4 of 2013, Margin is committed to protecting your privacy.
                </p>
                <p>
                  <span className="text-gray-900">Information Officer</span> — The Founder of Margin acts as the Information Officer.
                </p>
                <p>
                  <span className="text-gray-900">Your Rights</span> — You have the right to request access to, correction of, or deletion of your personal data held by us.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-tight mb-4">
                07 — Google API Services Usage Disclosure
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Margin's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-gray-900 underline underline-offset-4 decoration-gray-200 hover:decoration-gray-400 transition-colors">Google API Services User Data Policy</a>, including the Limited Use requirements.
                </p>
                <p>
                  <span className="text-gray-900 italic font-medium">Data Access & Security:</span> Margin scans Gmail and Drive to find reimbursement-relevant evidence, and only ingests messages, attachments, and files that are relevant to the reimbursement workflow. Margin does not delete, move, or modify emails or files. Email sending and replies only happen as part of approved case workflows or reply automation. We do not use your Google data for serving ads, including retargeting, personalized, or interest-based advertising.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-tight mb-4">
                08 — Changes
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We may update this Privacy Policy from time to time. We will post any changes on this page and update the Last Updated date.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xs text-gray-400 uppercase tracking-tight mb-4">
                09 — Contact
              </h2>
              <div className="space-y-2 text-gray-700">
                <p>
                  For questions about this Privacy Policy or our compliance with the Amazon DPP, contact us at support@margin-finance.com
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
              <Link to="/privacy" className="text-gray-600">Privacy</Link>
              <Link to="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
              <Link to="/docs" className="hover:text-gray-600 transition-colors">Acceptable Use</Link>
              <Link to="/refund-policy" className="hover:text-gray-600 transition-colors">Refund</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
