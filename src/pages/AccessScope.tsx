import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleOff,
  Clock3,
  Database,
  FileCheck2,
  FileText,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { usePageMeta } from '@/hooks/usePageMeta';
import { PUBLIC_ROUTE_META } from '@/config/seo';

const containerClass = 'mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12';
const bodyClass = 'text-[15px] leading-7 text-[#667177] sm:text-[16px] sm:leading-8';
const labelClass = 'font-google-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0B74DE]';

const coreRecords = [
  ['Amazon settlement reports', 'Settlement periods, deposits, transaction types, fees, adjustments, amounts, marketplace and fulfilment references.'],
  ['Financial-event or transaction data', 'The financial activity needed to connect the original event to its settlement or accounting outcome.'],
  ['Case correspondence and decisions', 'Amazon case IDs, requests, responses, reimbursement decisions and related outcome records.'],
  ['Reimbursement and adjustment records', 'Reimbursement IDs, reasons, SKUs, FNSKUs, ASINs, quantities, unit values and total amounts.'],
];

const supportingRecords = [
  ['FBA inventory and ledger records', 'Inventory summaries, ledger detail, receipts, shipments, returns, removals, transfers and adjustments where relevant.'],
  ['Shipment, receiving and fulfilment records', 'Used when the question concerns inbound quantity, custody, receiving or warehouse movement.'],
  ['Returns, refunds and removal records', 'Requested only where the defined question involves customer returns, removals or refund treatment.'],
  ['Accounting or reconciliation extracts', 'A focused extract may help connect Amazon activity to the business records, without requiring full ERP access.'],
];

const excludedItems = [
  'Amazon username, password or MFA code',
  'Account-administrator access',
  'Bank, payment or payout initiation access',
  'Listing, pricing, product or inventory-change permissions',
  'Feed submission, shipment creation or shipment cancellation',
  'Refund, payout or other consequential-action permissions',
  'Buyer communication access or customer personal information',
];

const outcomes = [
  ['Supported recovery position', 'The records support a defined financial position and a justified next action.'],
  ['Potential position requiring more evidence', 'The signal is credible, but the current records do not yet establish the complete position.'],
  ['Already accounted for', 'The amount or outcome is supported as credited, settled, reimbursed or otherwise accounted for.'],
  ['No material finding', 'The agreed tests do not support a material variance, recoverable exposure or further action within scope.'],
  ['Inconclusive', 'Required records were unavailable or contradictory, so the position remains qualified.'],
  ['Outside approved scope', 'The question or records fall outside the period, marketplace or investigation boundary agreed at the start.'],
];

const sourceLinks = [
  { label: 'Authorize a Service Provider', href: 'https://sellercentral.amazon.com/help/hub/reference/external/GRUJCZJ74KFU96LB' },
  { label: 'Remove a Service Provider', href: 'https://sellercentral.amazon.com/help/hub/reference/external/G9GR9Q4U6U5DPMKW' },
  { label: 'Settlement Reports', href: 'https://developer-docs.amazon.com/sp-api/docs/report-type-values-settlement' },
  { label: 'FBA Report Types', href: 'https://developer-docs.amazon.com/sp-api/docs/report-type-values-fba' },
  { label: 'SP-API Roles', href: 'https://developer-docs.amazon.com/sp-api/docs/roles-in-the-selling-partner-api' },
  { label: 'SP-API Role Mappings', href: 'https://developer-docs.amazon.com/sp-api/docs/role-mappings' },
  { label: 'SP-API Security and Compliance', href: 'https://developer-docs.amazon.com/sp-api/docs/security-compliance-overview' },
];

function RecordCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="border border-[#DDE4E7] bg-white p-5 shadow-[0_1px_2px_rgba(48,52,59,0.03)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF4F7] text-[#0B74DE]">
          <FileCheck2 className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-[15px] font-semibold tracking-[-0.015em] text-[#182026]">{title}</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#667177]">{body}</p>
        </div>
      </div>
    </article>
  );
}

export default function AccessScope() {
  usePageMeta(PUBLIC_ROUTE_META['/access-scope']);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
      <PublicNavbar variant="light" />
      <main>
        <section className="relative overflow-hidden border-b border-[#DDE4E7] bg-white pb-16 pt-32 sm:pb-20 sm:pt-40 md:pb-28 md:pt-48">
          <div className="pointer-events-none absolute right-[-12%] top-[-20%] h-[600px] w-[600px] rounded-full bg-[#E9F1F4] blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-[-22%] left-[-12%] h-[440px] w-[440px] rounded-full bg-[#F2EFE8] blur-3xl" aria-hidden="true" />
          <div className={`${containerClass} relative grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)] lg:items-end lg:gap-20`}>
            <div className="max-w-[790px]">
              <p className={labelClass}>Amazon access scope</p>
              <h1 className="mt-5 max-w-[790px] font-lora text-[46px] font-normal leading-[0.99] tracking-[-0.06em] text-[#182026] sm:text-[64px] md:text-[82px]">The records Margin needs. No broader access than the work requires.</h1>
              <p className="mt-7 max-w-[700px] text-[18px] leading-8 tracking-[-0.02em] text-[#48677A] sm:text-[22px] sm:leading-9">Start with the files relevant to one defined Amazon financial question. If the records do not establish the position, Margin can request narrowly scoped, time-bounded, read-only Amazon access.</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a href="#records" className="inline-flex h-11 items-center gap-2 rounded-[7px] bg-[#0B74DE] px-5 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(11,116,222,0.18)] transition-colors hover:bg-[#075EBA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/35 focus-visible:ring-offset-2">See the records checklist <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
                <Link to="/" className="inline-flex h-11 items-center gap-2 rounded-[7px] px-3 text-[13px] font-semibold text-[#30343B] transition-colors hover:text-[#0B74DE]">Back to Margin <ChevronRight className="h-4 w-4" aria-hidden="true" /></Link>
              </div>
            </div>
            <div className="relative overflow-hidden border border-[#D9E3E6] bg-[#F4F7F6] p-5 shadow-[0_24px_70px_rgba(37,49,58,0.08)] sm:p-6">
              <div className="flex items-center justify-between border-b border-[#D9E1E1] pb-4">
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0B74DE]"><ScanSearch className="h-5 w-5" strokeWidth={1.6} /></div><div><p className="text-[12px] font-semibold text-[#182026]">Defined review</p><p className="mt-0.5 text-[10px] text-[#7A858A]">Seller-controlled access boundary</p></div></div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#4D7869]"><span className="h-1.5 w-1.5 rounded-full bg-[#4D7869]" /> Scoped</span>
              </div>
              <div className="space-y-2.5 pt-4">
                {[['Question', 'One financial or marketplace question', FileText], ['Period', 'Agreed event and settlement window', Clock3], ['Access', 'Files first · read-only if required', LockKeyhole], ['Output', 'Financial Position Brief', FileCheck2]].map(([label, detail, Icon]) => (
                  <div key={label as string} className="flex items-center gap-3 bg-white px-3.5 py-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF4F7] text-[#0B74DE]"><Icon className="h-4 w-4" strokeWidth={1.6} /></div><div><p className="text-[12px] font-semibold text-[#182026]">{label as string}</p><p className="mt-0.5 text-[10px] text-[#7A858A]">{detail as string}</p></div></div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2 border-t border-[#D9E1E1] pt-4 text-[10px] leading-4 text-[#667177]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4D7869]" />No account-management or consequential action is included in the standard review.</div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#DDE4E7] bg-[#F4F7F6] py-14 sm:py-20 md:py-24">
          <div className={containerClass}>
            <div className="grid gap-10 md:grid-cols-[0.7fr_1.3fr] md:gap-16">
              <div><p className={labelClass}>The access principle</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#182026] sm:text-[50px]">Least privilege. Case-scoped. Time-bounded.</h2></div>
              <div className="max-w-[720px] space-y-5"><p className={bodyClass}>Margin does not ask for an Amazon username, password, MFA code, bank access, ERP access or unrestricted administrator access.</p><p className={bodyClass}>The preferred model is seller authorization through Amazon’s official service-provider or Selling Partner API flow, with only the roles, reports and marketplaces required for the agreed investigation. Access can be removed by the seller and is not a substitute for approval to submit a claim or take another consequential action.</p><div className="border-l-2 border-[#0B74DE] pl-5"><p className="font-lora text-[22px] leading-8 tracking-[-0.025em] text-[#182026]">Files first. Narrow access only when the records cannot answer the question.</p></div></div>
            </div>
          </div>
        </section>

        <section id="records" className="scroll-mt-24 bg-white py-16 sm:py-20 md:py-28">
          <div className={containerClass}>
            <div className="max-w-[720px]"><p className={labelClass}>01 · Start with the records</p><h2 className="mt-4 font-lora text-[38px] font-normal leading-[1.03] tracking-[-0.05em] text-[#182026] sm:text-[54px]">The initial review does not require a full system handover.</h2><p className={`mt-5 ${bodyClass}`}>Margin begins with the relevant files for the agreed question and period. The report list is generated from the case type; the complete Amazon account is not requested by default.</p></div>
            <div className="mt-10 grid gap-3 md:grid-cols-2 md:gap-4">{coreRecords.map(([title, body]) => <RecordCard key={title} title={title} body={body} />)}</div>
            <div className="mt-14 grid gap-8 border-t border-[#DDE4E7] pt-10 md:grid-cols-[0.72fr_1.28fr] md:gap-14"><div><p className={labelClass}>Only where relevant</p><h3 className="mt-3 font-lora text-[30px] leading-[1.05] tracking-[-0.045em] text-[#182026] sm:text-[38px]">Supporting records follow the question.</h3></div><div className="grid gap-3 sm:grid-cols-2">{supportingRecords.map(([title, body]) => <RecordCard key={title} title={title} body={body} />)}</div></div>
          </div>
        </section>

        <section className="border-y border-[#DDE4E7] bg-[#F4F7F6] py-16 sm:py-20 md:py-28">
          <div className={containerClass}>
            <div className="grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-16">
              <div><p className={labelClass}>02 · If Amazon access is required</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#182026] sm:text-[50px]">Only the roles and data needed for the investigation.</h2></div>
              <div className="space-y-8">
                <div><p className={bodyClass}>For a normal FBA financial investigation, the relevant Amazon roles may include:</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{[['Finance and Accounting', 'Settlement and financial records'], ['Amazon Fulfillment', 'FBA inventory and fulfilment records'], ['Inventory and Order Tracking', 'Only where inventory or order reconciliation requires it']].map(([title, body]) => <div key={title} className="border border-[#D6E1E3] bg-white p-4"><p className="text-[13px] font-semibold text-[#182026]">{title}</p><p className="mt-2 text-[12px] leading-5 text-[#667177]">{body}</p></div>)}</div></div>
                <div className="border border-[#D6E1E3] bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF4F7] text-[#0B74DE]"><CircleOff className="h-4 w-4" strokeWidth={1.7} /></div><h3 className="text-[15px] font-semibold text-[#182026]">Not requested in the standard review</h3></div><ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">{excludedItems.map((item) => <li key={item} className="flex items-start gap-2 text-[13px] leading-5 text-[#667177]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#4D7869]" strokeWidth={2} aria-hidden="true" />{item}</li>)}</ul></div>
                <p className="text-[12px] leading-6 text-[#7A858A]">Some Amazon report operations are technically named <code className="rounded bg-white px-1.5 py-0.5 text-[11px] text-[#48677A]">createReport</code> because the application requests report generation. That does not mean Margin is asking for account-management or operational-write authority. The intended boundary is report retrieval and financial or inventory analysis only.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className={containerClass}>
            <div className="grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-16">
              <div><p className={labelClass}>03 · The review boundary</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#182026] sm:text-[50px]">A defined question. A defined period.</h2></div>
              <div className="space-y-6"><p className={bodyClass}>Margin does not request “all historical Amazon data.” The initial review normally examines the agreed investigation period, commonly the 12 months preceding the identified event through the latest available settlement period.</p><div className="grid gap-3 sm:grid-cols-2"><div className="border border-[#DDE4E7] bg-[#F4F7F6] p-5"><p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0B74DE]">For a specific FBA event</p><ul className="mt-4 space-y-3 text-[13px] leading-6 text-[#667177]"><li><strong className="text-[#182026]">Primary period:</strong> event date through the relevant settlement period.</li><li><strong className="text-[#182026]">Pre-event context:</strong> normally up to 90 days before the event.</li></ul></div><div className="border border-[#DDE4E7] bg-[#F4F7F6] p-5"><p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0B74DE]">Follow-through</p><ul className="mt-4 space-y-3 text-[13px] leading-6 text-[#667177]"><li><strong className="text-[#182026]">Post-event:</strong> until reimbursement, adjustment, settlement or case outcome is recorded.</li><li><strong className="text-[#182026]">Extension:</strong> only when evidence indicates it is needed and the seller approves it.</li></ul></div></div><p className="text-[12px] leading-6 text-[#7A858A]">Report availability and historical coverage can vary by account and marketplace. Margin confirms the usable period before relying on a report for the finding.</p></div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#DDE4E7] bg-[#F4F7F6] py-16 sm:py-20 md:py-28">
          <div className={containerClass}>
            <div className="grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-16">
              <div><p className={labelClass}>04 · Data boundaries</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#182026] sm:text-[50px]">Business records for the investigation. Not customer data for its own sake.</h2></div>
              <div className="space-y-6"><p className={bodyClass}>The data used is limited to the authorized seller account, marketplaces, reports, fields and investigation period. Depending on the question, it may include settlement transactions, fees, adjustments, reimbursements, case IDs, SKUs, ASINs, FNSKUs, quantities, warehouse events, shipment references, inventory movements, return outcomes and related correspondence.</p><div className="grid gap-3 sm:grid-cols-2"><div className="border border-[#D6E1E3] bg-white p-5"><div className="flex items-center gap-3"><Database className="h-5 w-5 text-[#0B74DE]" strokeWidth={1.5} /><h3 className="text-[14px] font-semibold text-[#182026]">Minimized by purpose</h3></div><p className="mt-3 text-[13px] leading-6 text-[#667177]">The standard review does not require buyer names, addresses, phone numbers, email addresses, payment-card information or other customer PII.</p></div><div className="border border-[#D6E1E3] bg-white p-5"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-[#0B74DE]" strokeWidth={1.5} /><h3 className="text-[14px] font-semibold text-[#182026]">Role-based access</h3></div><p className="mt-3 text-[13px] leading-6 text-[#667177]">Authorized Margin personnel and controlled service providers involved in ingestion, reconciliation, investigation, security and customer delivery only.</p></div></div><p className="text-[12px] leading-6 text-[#7A858A]">The exact storage locations, subprocessors, access logging, incident response, retention and deletion arrangements applicable to an engagement should be confirmed in the relevant security, privacy and contractual materials before processing begins.</p></div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className={containerClass}>
            <div className="grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-16">
              <div><p className={labelClass}>05 · What Margin returns</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#182026] sm:text-[50px]">A documented financial position, not just an analysis.</h2></div>
              <div className="space-y-6"><p className={bodyClass}>Margin returns a Financial Position Brief that connects the operational event to the available financial evidence and makes the decision boundary visible.</p><div className="grid gap-3 sm:grid-cols-2">{['Case summary and approved scope', 'Investigation period and marketplaces examined', 'Source reports and records used', 'Transaction, inventory or settlement reconciliation', 'Evidence chain connecting event to financial impact', 'Supported exposure and amounts already credited, settled or accounted for', 'Unresolved balance, evidence gaps and contradictions', 'Recommended next action, accountable owner and approval boundary'].map((item) => <div key={item} className="flex items-start gap-3 border border-[#DDE4E7] bg-[#F4F7F6] p-4 text-[13px] leading-5 text-[#667177]"><FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4D7869]" strokeWidth={1.8} />{item}</div>)}</div><div className="border-l-2 border-[#0B74DE] pl-5"><p className="text-[13px] leading-6 text-[#48677A]">A supported exposure is not the same as a recovered amount. The brief keeps these states distinct:</p><p className="mt-3 font-semibold text-[13px] leading-6 text-[#182026]">Supported exposure · Submitted or pending claim · Amazon-approved reimbursement · Cash or settlement received · Unresolved or unsupported balance</p></div></div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#DDE4E7] bg-[#F4F7F6] py-16 sm:py-20 md:py-28">
          <div className={containerClass}>
            <div className="max-w-[760px]"><p className={labelClass}>06 · If nothing material is found</p><h2 className="mt-4 font-lora text-[38px] font-normal leading-[1.03] tracking-[-0.05em] text-[#182026] sm:text-[54px]">A clean result is still a result.</h2><p className={`mt-5 ${bodyClass}`}>Margin does not imply that every investigation produces a reimbursement claim. If the records do not support a material variance, recoverable exposure or defensible action, Margin returns a documented no-material-finding result.</p></div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{outcomes.map(([title, body]) => <article key={title} className="min-h-[150px] border border-[#D6E1E3] bg-white p-5"><h3 className="text-[14px] font-semibold text-[#182026]">{title}</h3><p className="mt-3 text-[13px] leading-6 text-[#667177]">{body}</p></article>)}</div>
          </div>
        </section>

        <section className="bg-[#182026] py-16 text-white sm:py-20 md:py-24">
          <div className={containerClass}>
            <div className="grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-16"><div><p className="font-google-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9CCCF1]">The working request</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-white sm:text-[50px]">Specific data. Specific people. Specific output.</h2></div><div><blockquote className="border-l-2 border-[#9CCCF1] pl-5 text-[15px] leading-8 text-white/80 sm:text-[17px] sm:leading-9">Margin is requesting scoped, read-only access to the seller’s authorized Amazon business data for the purpose of investigating and reconciling FBA inventory, settlement, reimbursement and related operational events. The requested access is limited to the relevant seller account, marketplaces, report types and investigation period.</blockquote><p className="mt-6 text-[14px] leading-7 text-white/65">Margin uses the data to reconstruct the financial and operational position, reconcile supported and unsupported amounts, identify evidence gaps and return a documented recommendation. Margin will not submit a claim, alter the seller’s Amazon account, initiate a payout or take another consequential action without the seller’s separate approval.</p></div></div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className={`${containerClass} flex flex-col gap-8 md:flex-row md:items-end md:justify-between`}><div className="max-w-[720px]"><p className={labelClass}>Source and security references</p><h2 className="mt-4 font-lora text-[34px] font-normal leading-[1.04] tracking-[-0.05em] text-[#182026] sm:text-[46px]">Review the Amazon framework behind the boundary.</h2><p className={`mt-4 ${bodyClass}`}>The access model is designed around Amazon’s published authorization, report, role and data-protection guidance. Engagement-specific arrangements remain subject to the applicable contract and security materials.</p></div><Link to="/security" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[7px] bg-[#30343B] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#20242A]">Read Margin security practices <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
          <div className={`${containerClass} mt-10 grid gap-x-8 gap-y-3 border-t border-[#DDE4E7] pt-7 sm:grid-cols-2 lg:grid-cols-3`}>{sourceLinks.map((source) => <a key={source.href} href={source.href} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 text-[13px] font-semibold text-[#48677A] transition-colors hover:text-[#0B74DE]"><ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />{source.label}</a>)}</div>
        </section>

        <section className="border-t border-[#DDE4E7] bg-[#F4F7F6] py-16 sm:py-20"><div className="mx-auto flex w-full max-w-[900px] flex-col items-center px-5 text-center sm:px-6"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0B74DE]"><LockKeyhole className="h-6 w-6" strokeWidth={1.5} /></div><h2 className="mt-5 font-lora text-[34px] font-normal leading-[1.04] tracking-[-0.05em] text-[#182026] sm:text-[46px]">Ready to define the question?</h2><p className="mt-4 max-w-[650px] text-[16px] leading-7 text-[#667177]">Start with the relevant records for the agreed period. Margin will show what they establish before any discussion about further recovery or control work.</p><Link to="/contact" className="mt-7 inline-flex items-center gap-2 rounded-[7px] bg-[#0B74DE] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(11,116,222,0.18)] transition-colors hover:bg-[#075EBA]">Contact Margin about a defined review <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></section>
      </main>
      <BrandFooter wide />
    </div>
  );
}
