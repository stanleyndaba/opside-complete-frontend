import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Check,
  CircleDollarSign,
  FileCheck2,
  Link2,
  PackageSearch,
  ReceiptText,
  SearchCheck,
  ShieldCheck,
  Truck,
  WalletCards,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const controlAreas = [
  {
    title: 'Investigate client accounts',
    body: 'Examine marketplace records to identify discrepancies and unresolved financial outcomes.',
    icon: Link2,
  },
  {
    title: 'Connect the evidence',
    body: 'Link operational events, transactions and supporting records to establish what happened.',
    icon: SearchCheck,
  },
  {
    title: 'Assess recovery opportunities',
    body: 'Determine which findings may warrant action and whether they remain within the applicable recovery window.',
    icon: FileCheck2,
  },
  {
    title: 'Manage case progress',
    body: 'Keep investigation findings, evidence, responses and recovery outcomes connected.',
    icon: CircleDollarSign,
  },
  {
    title: 'Track financial resolution',
    body: 'Distinguish between claims submitted, reimbursements issued and funds actually accounted for.',
    icon: Check,
  },
];

const operatingSignals = [
  {
    title: 'Client account review',
    body: 'Examine available marketplace records to identify discrepancies and unresolved financial outcomes.',
    icon: Truck,
  },
  {
    title: 'Evidence across accounts',
    body: 'Connect operational events, transactions and supporting records to establish what happened.',
    icon: ReceiptText,
  },
  {
    title: 'Case progress and outcomes',
    body: 'Keep findings, responses, recovery actions and financial outcomes connected for every client.',
    icon: WalletCards,
  },
];

const controlHighlights = [
  {
    title: 'Client investigations',
    body: 'Examine each account’s records and keep findings attributable to the client business they came from.',
    icon: Link2,
  },
  {
    title: 'Evidence that stays connected',
    body: 'Link reports, transactions and supporting records so operators can explain what happened and why.',
    icon: ShieldCheck,
  },
  {
    title: 'Resolution clients can understand',
    body: 'Distinguish claims submitted, reimbursements issued and funds actually accounted for.',
    icon: Activity,
  },
];

const AgenciesAmazonOperators = () => {
  usePageMeta({
    title: 'Agencies & Amazon Operators | Margin',
    description: 'Structured financial control for agencies and Amazon operators managing recovery work across client accounts.',
    url: `${SITE_META.url}/agencies-amazon-operators`,
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
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Agencies & Amazon operators</p>
              <h1 className="max-w-[780px] font-lora text-[45px] font-normal leading-[0.99] tracking-[-0.055em] text-[#30343B] sm:text-[62px] md:text-[78px]">Give every client’s Amazon business the financial attention it deserves.</h1>
              <p className="mt-7 max-w-[690px] text-[17px] leading-8 text-[#667177] sm:text-[19px] sm:leading-9">Managing one Amazon account is demanding. Managing recovery and financial discrepancies across multiple client accounts introduces another layer of complexity. Every client has a different inventory history, shipment activity, fees, reimbursements, adjustments and settlement records.</p>
              <Link to="/review-consent" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#30343B] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#20242A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30343B]/35 focus-visible:ring-offset-2">Review your client portfolio <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>

            <div className="relative overflow-hidden rounded-[4px] border border-[#DEE3E2] bg-[#F4F5F4] p-5 shadow-[0_22px_65px_rgba(48,52,59,0.08)] sm:p-6">
              <div className="flex items-center justify-between border-b border-[#DDE2E1] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#30343B]"><PackageSearch className="h-5 w-5" strokeWidth={1.6} /></div>
                  <div><p className="text-[12px] font-semibold text-[#30343B]">Client portfolio control</p><p className="mt-0.5 text-[10px] text-[#7A858A]">Accountable client workflow</p></div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#4D7869]"><span className="h-1.5 w-1.5 rounded-full bg-[#4D7869]" /> In review</span>
              </div>
              <div className="space-y-2.5 pt-4">
                {[
                  ['Client account activity', 'Records remain attributable', Truck],
                  ['Evidence and case history', 'Investigation basis connected', FileCheck2],
                  ['Recovery and settlement', 'Outcome remains visible', WalletCards],
                ].map(([label, detail, Icon]) => (
                  <div key={label as string} className="flex items-center gap-3 rounded-[3px] bg-white px-3.5 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF2F0] text-[#4D7869]"><Icon className="h-4 w-4" strokeWidth={1.7} /></div>
                    <div className="min-w-0"><p className="truncate text-[12px] font-semibold text-[#30343B]">{label as string}</p><p className="mt-0.5 truncate text-[10px] text-[#7A858A]">{detail as string}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-[#DDE2E1] pt-4 text-[10px] leading-4 text-[#7A858A]"><ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Each client’s financial history remains separated and accountable.</div>
            </div>
          </div>
        </section>

        <section id="control" className="scroll-mt-24 border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[700px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">More clients. More fragmented investigations.</p>
              <h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A more reliable operating process.</h2>
              <p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">As your client portfolio grows, so does the volume of financial activity your team needs to examine. A discrepancy can sit unnoticed in one account while another client is waiting for an update. Evidence may be spread across reports and case histories, and different team members may be responsible for different clients.</p>
            </div>
            <div className="mt-10 grid gap-3 sm:mt-14 md:grid-cols-3 md:gap-4">
              {operatingSignals.map(({ title, body, icon: Icon }) => (
                <article key={title} className="flex min-h-[260px] flex-col bg-white p-6 shadow-[0_1px_2px_rgba(48,52,59,0.04)] sm:p-7 md:p-8">
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
              <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Bring structure to the work behind every client.</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Give every client investigation a connected financial record.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin gives your team a structured way to examine financial activity and follow discrepancies through to an established outcome, with a clearer view of what has been established, what remains unresolved and what has actually been recovered.</p></div>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {controlHighlights.map(({ title, body, icon: Icon }) => <article key={title} className="bg-[#F4F5F4] p-5 sm:p-6"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div><h3 className="mt-10 text-[15px] font-semibold leading-5 text-[#30343B]">{title}</h3><p className="mt-3 text-[13px] leading-6 text-[#667177]">{body}</p></article>)}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-24">
          <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:gap-14 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[540px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">A clearer answer to every client</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">An audit or claim is not the same as a resolved client outcome.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Clients do not just want to know that an audit was performed or a claim was submitted. They want to understand what was examined, what was found, what the evidence supports, what action was taken and what happened to the money.</p></div>
            <div className="relative overflow-hidden rounded-[4px] border border-[#DEE3E2] bg-white p-5 shadow-[0_16px_45px_rgba(48,52,59,0.06)] sm:p-7">
              <div className="absolute left-10 top-10 bottom-10 w-px bg-[#DDE2E1]" />
              <div className="relative space-y-7">
                {[
                  ['What was examined', 'Marketplace records and client account activity enter the investigation.', Truck],
                  ['What the evidence supports', 'Findings and supporting records are connected to the client account.', SearchCheck],
                  ['What happened to the money', 'Recovery and settlement outcomes remain visible through resolution.', Check],
                ].map(([label, body, Icon]) => (
                  <div key={label as string} className="flex gap-4">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#DCE2E5] bg-[#F4F6F6] text-[#30343B]"><Icon className="h-4 w-4" strokeWidth={1.6} /></div>
                    <div className="pt-0.5"><p className="text-[13px] font-semibold text-[#30343B]">{label as string}</p><p className="mt-1 text-[13px] leading-6 text-[#667177]">{body as string}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-14">
              <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Scale your service without losing control of the detail</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Give operators structure while clients retain control.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Whether you are an Amazon agency, specialist consultant or independent marketplace operator, Margin adds a dedicated recovery and financial-control process to your service. Your team can focus on investigating and managing the work while sellers retain authority over actions requiring their approval. Each client’s records, findings and recovery outcomes remain attributable to that client’s business.</p></div>
              <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                {[
                  ['Portfolio consistency', 'Apply a reliable investigation and resolution process across every account you manage.', PackageSearch],
                  ['Client attribution', 'Keep each client’s records, findings and outcomes separate and reviewable.', CircleDollarSign],
                  ['Seller authority', 'Manage the work while preserving seller approval for sensitive actions.', WalletCards],
                ].map(([title, body, Icon]) => <article key={title as string} className="bg-[#F4F5F4] p-5 sm:p-6"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div><h3 className="mt-10 text-[15px] font-semibold leading-5 text-[#30343B]">{title as string}</h3><p className="mt-3 text-[13px] leading-6 text-[#667177]">{body as string}</p></article>)}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto flex w-full max-w-[900px] flex-col items-center px-5 text-center sm:px-6"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F2F1] text-[#30343B]"><ShieldCheck className="h-6 w-6" strokeWidth={1.5} /></div><h2 className="mt-5 font-lora text-[34px] font-normal leading-[1.04] tracking-[-0.05em] text-[#30343B] sm:text-[46px]">Make every client investigation accountable.</h2><p className="mt-4 max-w-[600px] text-[16px] leading-7 text-[#667177]">You manage the relationships and the marketplace operation. Margin helps establish what happened financially, what needs attention and whether the outcome was resolved.</p><Link to="/review-consent" className="mt-7 inline-flex items-center gap-2 rounded-[7px] bg-[#635BFF] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(99,91,255,0.18)] transition-colors hover:bg-[#5148E5]">Review your client portfolio <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
        </section>
      </main>

      <BrandFooter wide />
    </div>
  );
};

export default AgenciesAmazonOperators;
