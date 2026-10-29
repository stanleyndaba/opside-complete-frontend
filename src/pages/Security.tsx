import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Check,
  Cloud,
  Database,
  FileCheck2,
  KeyRound,
  LockKeyhole,
  Scale,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const practiceAreas = [
  {
    title: 'SaaS platform',
    body: 'Margin is a cloud-based financial operations platform designed to bring Amazon financial data, investigation workflows, supporting evidence, and recovery activity into one controlled environment. The platform is developed to support ongoing improvements without requiring sellers to manage their own software infrastructure.',
    icon: Cloud,
  },
  {
    title: 'Encryption in transit and at rest',
    body: "Protecting financial information requires safeguards throughout its lifecycle. Margin's security approach includes protecting data during transmission and storage, with encryption and key-management practices appropriate to the underlying infrastructure.",
    icon: LockKeyhole,
  },
  {
    title: 'Monitoring and accountability',
    body: 'Financial operations require traceability. Margin is designed to connect findings, supporting evidence, decisions, recovery actions, and financial outcomes so that the basis for an investigation and its progression can be examined.',
    icon: Activity,
  },
  {
    title: 'Access controls and data isolation',
    body: "Seller financial information must remain separated and accessible only through authorized pathways. Margin's architecture incorporates access controls and tenant-isolation mechanisms to help protect each seller's workspace and records.",
    icon: Database,
  },
  {
    title: 'Human oversight and controlled actions',
    body: 'Margin combines purpose-built financial workflows, deterministic controls, and AI-assisted analysis. Recovery decisions are grounded in available evidence, and submissions remain subject to seller approval under the standard workflow. The objective is to make financial operations more efficient without removing accountability from the process.',
    icon: UserCheck,
  },
  {
    title: 'Amazon integration and data access',
    body: "Margin integrates with Amazon's Selling Partner API to support authorized access to seller financial and operational information. Amazon's developer framework includes requirements covering application registration, data protection, and security controls. Margin's integration and data handling are designed around the applicable requirements and the permissions granted by the seller.",
    icon: ShieldCheck,
  },
];

const supportedMarketplaces = [
  { country: 'United States', code: 'US', flag: 'us', region: 'Americas' },
  { country: 'Canada', code: 'CA', flag: 'ca', region: 'Americas' },
  { country: 'United Kingdom', code: 'UK', flag: 'gb', region: 'Europe' },
  { country: 'Germany', code: 'DE', flag: 'de', region: 'Europe' },
  { country: 'Australia', code: 'AU', flag: 'au', region: 'Asia-Pacific' },
  { country: 'Japan', code: 'JP', flag: 'jp', region: 'Asia-Pacific' },
  { country: 'United Arab Emirates', code: 'AE', flag: 'ae', region: 'Middle East' },
  { country: 'Saudi Arabia', code: 'SA', flag: 'sa', region: 'Middle East' },
];

const securedHighlights = [
  {
    title: 'Built around financial control',
    body: 'Margin connects financial events to evidence, decisions, and recovery activity. This supports traceability throughout an investigation instead of leaving financial conclusions disconnected from their supporting records.',
    icon: Scale,
  },
  {
    title: 'Enterprise-grade AI',
    body: "Margin combines purpose-built financial workflows and deterministic controls with advanced AI capabilities from OpenAI and Anthropic. AI supports complex financial analysis and explanations within Margin's broader investigation and recovery system.",
    icon: FileCheck2,
  },
  {
    title: 'Protected by design',
    body: "Access controls, seller-data isolation, evidence traceability, and approval gates are part of Margin's approach to handling sensitive financial operations. Our objective is to keep financial work controlled, inspectable, and accountable.",
    icon: KeyRound,
  },
];

const Security = () => {
  usePageMeta({
    title: 'Security | Margin',
    description: 'How Margin protects sensitive Amazon financial operations with controlled access, evidence-led workflows, and accountable actions.',
    url: `${SITE_META.url}/security`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#30343B]">
      <PublicNavbar variant="light" />

      <main>
        <section className="relative overflow-hidden bg-white pb-16 pt-32 sm:pb-20 sm:pt-40 md:pb-28 md:pt-48">
          <div className="pointer-events-none absolute right-[-12%] top-[-14%] h-[520px] w-[520px] rounded-full bg-[#EDEFF0] blur-3xl" />
          <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.75fr)] md:items-end md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="relative max-w-[780px]">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Security and data control</p>
              <h1 className="max-w-[780px] font-lora text-[45px] font-normal leading-[0.99] tracking-[-0.055em] text-[#30343B] sm:text-[62px] md:text-[78px]">Enterprise-grade security.</h1>
              <p className="mt-7 max-w-[690px] text-[17px] leading-8 text-[#667177] sm:text-[19px] sm:leading-9">Margin is built to support sensitive Amazon financial operations with controlled access, evidence-led workflows, and security practices designed to protect the integrity and confidentiality of your business data.</p>
              <a href="#practices" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#30343B] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#20242A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30343B]/35 focus-visible:ring-offset-2">Explore our security practices <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
            </div>

            <div className="relative overflow-hidden rounded-[4px] border border-[#DEE3E2] bg-[#F4F5F4] p-5 shadow-[0_22px_65px_rgba(48,52,59,0.08)] sm:p-6">
              <div className="flex items-center justify-between border-b border-[#DDE2E1] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#30343B]"><ShieldCheck className="h-5 w-5" strokeWidth={1.6} /></div>
                  <div><p className="text-[12px] font-semibold text-[#30343B]">Margin control surface</p><p className="mt-0.5 text-[10px] text-[#7A858A]">Evidence-led financial workflows</p></div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#4D7869]"><span className="h-1.5 w-1.5 rounded-full bg-[#4D7869]" /> Active</span>
              </div>
              <div className="space-y-2.5 pt-4">
                {[
                  ['Authorized data access', 'Seller workspace isolated', Check],
                  ['Evidence traceability', 'Finding linked to records', FileCheck2],
                  ['Approval before action', 'Recovery submission held', UserCheck],
                ].map(([label, detail, Icon]) => (
                  <div key={label as string} className="flex items-center gap-3 rounded-[3px] bg-white px-3.5 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF2F0] text-[#4D7869]"><Icon className="h-4 w-4" strokeWidth={1.7} /></div>
                    <div className="min-w-0"><p className="truncate text-[12px] font-semibold text-[#30343B]">{label as string}</p><p className="mt-0.5 truncate text-[10px] text-[#7A858A]">{detail as string}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-[#DDE2E1] pt-4 text-[10px] leading-4 text-[#7A858A]"><LockKeyhole className="h-3.5 w-3.5 shrink-0" /> Actions remain accountable and under seller control.</div>
            </div>
          </div>
        </section>

        <section id="practices" className="scroll-mt-24 border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[650px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">How Margin approaches security</p>
              <h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Security is part of the operating model.</h2>
              <p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">The work Margin handles touches sensitive financial records. These practices are designed to keep access controlled, actions inspectable, and responsibility visible throughout the workflow.</p>
            </div>
            <div className="mt-10 grid gap-3 sm:mt-14 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
              {practiceAreas.map(({ title, body, icon: Icon }) => (
                <article key={title} className="flex min-h-[300px] flex-col bg-white p-6 shadow-[0_1px_2px_rgba(48,52,59,0.04)] sm:p-7 md:p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#DCE2E5] bg-[#F4F6F6] text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div>
                  <div className="mt-auto pt-12"><h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#30343B] sm:text-[17px]">{title}</h3><p className="mt-3 text-[14px] leading-6 text-[#667177]">{body}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-14">
              <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Your data, secured</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Protection that stays connected to the work.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Your financial records deserve more than a generic AI interface. Margin combines purpose-built financial operations, controlled workflows, and security practices intended to keep sensitive business information protected and financial actions accountable.</p></div>
              <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                {securedHighlights.map(({ title, body, icon: Icon }) => <article key={title} className="bg-[#F4F5F4] p-5 sm:p-6"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div><h3 className="mt-10 text-[15px] font-semibold leading-5 text-[#30343B]">{title}</h3><p className="mt-3 text-[13px] leading-6 text-[#667177]">{body}</p></article>)}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-14 sm:py-18 md:py-20" aria-labelledby="security-marketplace-title">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="grid gap-8 md:grid-cols-[0.72fr_1.28fr] md:gap-12">
              <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Marketplace coverage</p><h2 id="security-marketplace-title" className="mt-4 font-lora text-[34px] font-normal leading-[1.04] tracking-[-0.05em] text-[#30343B] sm:text-[44px]">One controlled view across Amazon marketplaces.</h2><p className="mt-4 text-[14px] leading-6 text-[#667177] sm:text-[15px] sm:leading-7">Margin supports authorized financial workflows across the marketplaces where established Amazon businesses operate.</p></div>
              <div className="grid border-t border-[#DDE2E1] sm:grid-cols-2 sm:border-t-0 lg:grid-cols-4">{supportedMarketplaces.map((marketplace, index) => <div key={marketplace.code} className={`flex items-center gap-3 border-b border-[#DDE2E1] py-3.5 sm:px-4 ${index % 2 === 1 ? 'sm:border-l' : ''} ${index >= 2 ? 'lg:border-t' : ''}`}><img src={`/flags/${marketplace.flag}.svg`} alt={`${marketplace.country} flag`} className="h-[23px] w-[34px] shrink-0 rounded-[2px] object-cover" /><span className="min-w-0"><span className="block truncate text-[13px] font-semibold text-[#30343B]">{marketplace.country}</span><span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-tight text-[#7A858A]">{marketplace.region} · {marketplace.code}</span></span></div>)}</div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto flex w-full max-w-[900px] flex-col items-center px-5 text-center sm:px-6"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F2F1] text-[#30343B]"><ShieldCheck className="h-6 w-6" strokeWidth={1.5} /></div><h2 className="mt-5 font-lora text-[34px] font-normal leading-[1.04] tracking-[-0.05em] text-[#30343B] sm:text-[46px]">Questions about security?</h2><p className="mt-4 max-w-[600px] text-[16px] leading-7 text-[#667177]">Talk with our team about your data, your workflow, and what a controlled Margin engagement would require.</p><Link to="/contact" className="mt-7 inline-flex items-center gap-2 rounded-[7px] bg-[#635BFF] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(99,91,255,0.18)] transition-colors hover:bg-[#5148E5]">Contact our team <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
        </section>
      </main>

      <BrandFooter wide />
    </div>
  );
};

export default Security;
