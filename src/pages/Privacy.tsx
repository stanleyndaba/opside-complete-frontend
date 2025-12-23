import React from 'react';
import LegalHeader from '@/components/layout/LegalHeader';
import LegalFooter from '@/components/layout/LegalFooter';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';

const Privacy = () => {
  usePageMeta({
    title: 'Opside Privacy Policy',
    description: "Privacy Policy for Opside's automated FBA auditing platform.",
    url: `${SITE_META.url}/privacy`,
    image: SITE_META.image
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <LegalHeader />

      <main className="flex-1 container mx-auto px-6 py-12 md:py-16">
        <article className="max-w-3xl mx-auto">
          <header className="mb-8 pb-8 border-b border-gray-200">
            <p className="text-sm text-gray-500 mb-6">Last Updated: December 22, 2025</p>
            <h1 className="text-2xl font-medium text-gray-900">Opside Privacy Policy</h1>
          </header>

          <div className="space-y-8 text-sm leading-relaxed text-gray-700">
            <p>
              This Privacy Policy describes our policies on the collection, use, and disclosure of data when you use the Service and explains how we comply with the Amazon Data Protection Policy ("DPP") and the Protection of Personal Information Act ("POPIA"). By using the Service, you agree to the collection and use of information in accordance with this Privacy Policy.
            </p>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">1. Interpretation and Definitions</h2>
              <p>
                <strong>Company</strong> ('We', 'Us', or 'Our') refers to Opside, operating from Durban, South Africa.
              </p>
              <p>
                <strong>Service</strong> refers to the Opside application accessible from https://opside-complete-frontend-ni6o7xnko-mvelo-ndabas-projects.vercel.app/.
              </p>
              <p>
                <strong>Personal Data</strong> means any information that relates to an identified or identifiable individual.
              </p>
              <p>
                <strong>Amazon Information</strong> means all data accessed via the Amazon Selling Partner API (SP-API), including Restricted Data and Personally Identifiable Information (PII).
              </p>
              <p>
                <strong>You</strong> means the individual or legal entity accessing or using the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">2. Collecting and Using Your Data</h2>

              <h3 className="text-sm font-medium text-gray-900">A. Personal Data</h3>
              <p>When you use our Service, we collect limited account information necessary to operate your workspace:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Email address</li>
                <li>First and last name</li>
                <li>Payment information (processed securely via Paystack)</li>
              </ul>

              <h3 className="text-sm font-medium text-gray-900 mt-4">B. Amazon Information (Restricted Data)</h3>
              <p>
                To perform automated reimbursement analysis, we must access SP-API data. This data is handled in strict compliance with the Amazon DPP. We only ingest what is necessary to audit reimbursements, including:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Inventory adjustment and reconciliation reports</li>
                <li>Shipment and inbound discrepancy reports</li>
                <li>Financial and settlement reports</li>
                <li>PII (e.g., order IDs) strictly limited to matching a claim to a reimbursement case</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">3. Use of Your Data</h2>
              <p>
                We use Personal Data and Amazon Information for a single purpose: to provide and improve the Opside reimbursement Service. Specifically, we use data to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Manage and authenticate your Account</li>
                <li>Algorithmically identify and file reimbursement claims</li>
                <li>Reconcile payments and calculate billing</li>
              </ul>

              <h3 className="text-sm font-medium text-gray-900 mt-4">Strict Prohibition on PII Use</h3>
              <p>
                As required by the Amazon DPP, we will never use Amazon Information—especially PII—for any purpose outside of delivering the Service. We do not:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Sell, rent, or monetize Amazon Information</li>
                <li>Use Amazon Information for marketing, remarketing, or advertising</li>
                <li>Share Amazon Information with third parties that are not required to operate the core Service (e.g., our secure AWS infrastructure)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">4. Data Protection and Security (Amazon DPP Compliance)</h2>
              <p>We implement enterprise-grade technical, physical, and administrative safeguards:</p>
              <p>
                <strong>Encryption at Rest:</strong> All Amazon Information stored in our databases is encrypted using AES-256.
              </p>
              <p>
                <strong>Encryption in Transit:</strong> All data traverses HTTPS endpoints secured with TLS 1.2 or higher.
              </p>
              <p>
                <strong>Access Control:</strong> We enforce least-privilege access. Only authorized engineers with MFA-protected sessions may access production systems, and every action is logged.
              </p>
              <p>
                <strong>Network Security:</strong> Infrastructure is hosted in Amazon Web Services (AWS) within a locked-down Virtual Private Cloud (VPC) protected by strict firewall policies.
              </p>
              <p>
                <strong>Incident Response:</strong> We maintain a formal Incident Response Plan and will notify Amazon at 3p-security@amazon.com within 24 hours of any confirmed incident involving Amazon Information, as mandated by the DPP.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">5. Data Retention and Deletion</h2>
              <p>
                We retain Personal Data only for as long as needed to operate your account. Consistent with the DPP, we permanently delete all Amazon Information within 30 days of account termination. You may request deletion at any time by contacting us.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">6. POPIA Compliance (South Africa)</h2>
              <p>
                In accordance with the Protection of Personal Information Act 4 of 2013 ("POPIA"), Opside is committed to protecting your privacy.
              </p>
              <p>
                <strong>Information Officer:</strong> The Founder of Opside acts as the Information Officer.
              </p>
              <p>
                <strong>Your Rights:</strong> You have the right to request access to, correction of, or deletion of your personal data held by us.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">7. Changes to this Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will post any changes on this page and update the "Last Updated" date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-medium text-gray-900">8. Contact Information</h2>
              <p>If you have questions about this Privacy Policy or our compliance with the Amazon DPP, contact us at:</p>
              <p>Opside</p>
              <p>Email: clariooai@gmail.com</p>
            </section>
          </div>
        </article>
      </main>

      <LegalFooter />
    </div>
  );
};

export default Privacy;
