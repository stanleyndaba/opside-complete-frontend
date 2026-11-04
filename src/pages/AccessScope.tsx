import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleOff,
  Database,
  FileCheck2,
  Users,
} from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { PUBLIC_ROUTE_META } from '@/config/seo';

const containerClass = 'mx-auto w-full max-w-[860px] px-4 sm:px-8 lg:px-10';
const bodyClass = 'text-[14px] leading-6 text-[#595E68] sm:text-[15px] sm:leading-7';
const labelClass = 'text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]';
const headingClass = 'font-google-sans text-[24px] font-normal leading-[1.08] tracking-tight text-[#30343B] sm:text-[32px]';

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
    <article className="border border-[#E8E7E1] bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#F4F3ED] text-[#3F51A8]">
          <FileCheck2 className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-[14px] font-semibold tracking-tight text-[#30343B]">{title}</h3>
          <p className="mt-1.5 text-[13px] leading-5 text-[#595E68]">{body}</p>
        </div>
      </div>
    </article>
  );
}

function ScopeDetail({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <details className="group border-t border-[#E8E7E1] py-4 first:border-t-0" open={label === '02'}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 outline-none marker:hidden focus-visible:text-[#0B74DE]">
        <span><span className="mr-3 text-[11px] font-semibold text-[#0B74DE]">{label}</span><span className="text-[16px] font-semibold tracking-tight text-[#30343B]">{title}</span></span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#7B909D] transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pt-4">{children}</div>
    </details>
  );
}

export default function AccessScope() {
  usePageMeta(PUBLIC_ROUTE_META['/access-scope']);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBFAF7] font-google-sans text-[#191B20] selection:bg-[#5165C7]/16 selection:text-[#191B20]">
      <header className="sticky top-0 z-50 border-b border-[#E8E7E1] bg-[#FBFAF7]/95 backdrop-blur">
        <div className={`${containerClass} flex min-h-12 items-center justify-between gap-4`}>
          <Link to="/" title="Margin home" className="inline-flex items-center gap-2 rounded-md px-1.5 py-2 text-[16px] font-semibold tracking-tight text-[#191B20] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">Margin</Link>
          <Link to="/audit-start" className="inline-flex h-9 items-center justify-center gap-1 rounded-[5px] bg-[#0B74DE] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#075EBA]"><ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />Back</Link>
        </div>
      </header>

      <main className={`${containerClass} py-6 sm:py-9`}>
        <section className="border-b border-[#E8E7E1] pb-6 sm:pb-8" aria-labelledby="access-scope-title">
          <p className={labelClass}>Financial Review · Access Scope</p>
          <h1 id="access-scope-title" className="mt-3 max-w-[720px] text-[32px] font-normal leading-[1.06] tracking-tight text-[#191B20] sm:text-[48px]">The records Margin needs. No broader access than the work requires.</h1>
          <p className="mt-4 max-w-[680px] text-[15px] leading-7 text-[#595E68] sm:text-[16px]">Start with the files relevant to one defined Amazon financial question. If those records do not establish the position, Margin can request narrowly scoped, time-bounded, read-only Amazon access.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link to="/audit-start" className="inline-flex h-11 items-center justify-center gap-2 rounded-[5px] bg-[#0B74DE] px-5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(11,116,222,0.16)] transition-colors hover:bg-[#075EBA]">Continue to send records <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            <a href="#records" className="inline-flex h-11 items-center justify-center rounded-[5px] bg-[#E5E8EA] px-5 text-[13px] font-semibold text-[#30343B] transition-colors hover:bg-[#D9DEE1]">See the records checklist</a>
          </div>
        </section>

        <section className="border-b border-[#E8E7E1] py-6 sm:py-8" aria-labelledby="scope-principle-title">
          <div className="grid gap-5 md:grid-cols-[0.72fr_1.28fr] md:gap-12">
            <div><p className={labelClass}>Before you continue</p><h2 id="scope-principle-title" className={`${headingClass} mt-2`}>Files first. Narrow access only when the records cannot answer the question.</h2></div>
            <div className="space-y-4"><p className={bodyClass}>Margin does not ask for an Amazon username, password, MFA code, bank access, ERP access or unrestricted administrator access.</p><p className={bodyClass}>The preferred model is seller authorization through Amazon’s official service-provider or Selling Partner API flow, with only the roles, reports and marketplaces required for the agreed investigation. Access can be removed by the seller and is not a substitute for approval to submit a claim or take another consequential action.</p><div className="border-l-2 border-[#5165C7] pl-4 text-[13px] font-medium leading-6 text-[#30343B]">The initial review is records-first, read-only and defined around one question and one agreed period.</div></div>
          </div>
        </section>

        <section id="records" className="scroll-mt-16 border-b border-[#E8E7E1] py-6 sm:py-8" aria-labelledby="records-title">
          <p className={labelClass}>01 · Records first</p>
          <h2 id="records-title" className={`${headingClass} mt-2 max-w-[700px]`}>The initial review does not require a full system handover.</h2>
          <p className={`mt-3 max-w-[700px] ${bodyClass}`}>Margin begins with the relevant files for the agreed question and period. The report list is generated from the case type; the complete Amazon account is not requested by default.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">{coreRecords.map(([title, body]) => <RecordCard key={title} title={title} body={body} />)}</div>
          <div className="mt-7 border-t border-[#E8E7E1] pt-6"><p className={labelClass}>Only where relevant</p><h3 className="mt-2 text-[18px] font-semibold tracking-tight text-[#30343B]">Supporting records follow the question.</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{supportingRecords.map(([title, body]) => <RecordCard key={title} title={title} body={body} />)}</div></div>
        </section>

        <section className="border-b border-[#E8E7E1] py-2 sm:py-3" aria-label="Detailed access scope">
          <ScopeDetail label="02" title="If Amazon access is required">
            <div className="space-y-5">
              <p className={bodyClass}>For a normal FBA financial investigation, the relevant Amazon roles may include:</p>
              <div className="grid gap-3 sm:grid-cols-3">{[['Finance and Accounting', 'Settlement and financial records'], ['Amazon Fulfillment', 'FBA inventory and fulfilment records'], ['Inventory and Order Tracking', 'Only where inventory or order reconciliation requires it']].map(([title, body]) => <div key={title} className="border border-[#E8E7E1] bg-[#F4F3ED] p-4"><p className="text-[13px] font-semibold text-[#30343B]">{title}</p><p className="mt-1.5 text-[12px] leading-5 text-[#595E68]">{body}</p></div>)}</div>
              <div className="border border-[#E8E7E1] bg-white p-4 sm:p-5"><div className="flex items-center gap-2"><CircleOff className="h-4 w-4 text-[#3F51A8]" strokeWidth={1.7} /><h3 className="text-[14px] font-semibold text-[#30343B]">Not requested in the standard review</h3></div><ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">{excludedItems.map((item) => <li key={item} className="flex items-start gap-2 text-[13px] leading-5 text-[#595E68]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3B8F5A]" strokeWidth={2} aria-hidden="true" />{item}</li>)}</ul></div>
              <p className="text-[12px] leading-5 text-[#777A82]">Some Amazon report operations are technically named <code className="rounded bg-[#F4F3ED] px-1.5 py-0.5 text-[11px] text-[#48677A]">createReport</code> because the application requests report generation. That does not mean Margin is asking for account-management or operational-write authority.</p>
            </div>
          </ScopeDetail>
          <ScopeDetail label="03" title="Review period">
            <div className="space-y-4"><p className={bodyClass}>Margin does not request “all historical Amazon data.” The initial review normally examines the agreed investigation period, commonly the 12 months preceding the identified event through the latest available settlement period.</p><div className="grid gap-3 sm:grid-cols-2"><div className="border border-[#E8E7E1] bg-[#F4F3ED] p-4"><p className="text-[12px] font-semibold uppercase tracking-tight text-[#0B74DE]">For a specific FBA event</p><ul className="mt-3 space-y-2 text-[13px] leading-5 text-[#595E68]"><li><strong className="text-[#30343B]">Primary:</strong> event date through the relevant settlement period.</li><li><strong className="text-[#30343B]">Context:</strong> normally up to 90 days before the event.</li></ul></div><div className="border border-[#E8E7E1] bg-[#F4F3ED] p-4"><p className="text-[12px] font-semibold uppercase tracking-tight text-[#0B74DE]">Follow-through</p><ul className="mt-3 space-y-2 text-[13px] leading-5 text-[#595E68]"><li><strong className="text-[#30343B]">Post-event:</strong> until reimbursement, adjustment, settlement or case outcome is recorded.</li><li><strong className="text-[#30343B]">Extension:</strong> only when evidence indicates it is needed and the seller approves it.</li></ul></div></div><p className="text-[12px] leading-5 text-[#777A82]">Report availability and historical coverage can vary by account and marketplace. Margin confirms the usable period before relying on a report.</p></div>
          </ScopeDetail>
          <ScopeDetail label="04" title="Data boundaries">
            <div className="space-y-4"><p className={bodyClass}>The data used is limited to the authorized seller account, marketplaces, reports, fields and investigation period. Depending on the question, it may include settlement transactions, fees, adjustments, reimbursements, case IDs, SKUs, ASINs, FNSKUs, quantities, warehouse events, shipment references, inventory movements, return outcomes and related correspondence.</p><div className="grid gap-3 sm:grid-cols-2"><div className="border border-[#E8E7E1] bg-[#F4F3ED] p-4"><div className="flex items-center gap-2"><Database className="h-4 w-4 text-[#3F51A8]" strokeWidth={1.5} /><h3 className="text-[13px] font-semibold text-[#30343B]">Minimized by purpose</h3></div><p className="mt-2 text-[13px] leading-5 text-[#595E68]">The standard review does not require buyer names, addresses, phone numbers, email addresses, payment-card information or other customer PII.</p></div><div className="border border-[#E8E7E1] bg-[#F4F3ED] p-4"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-[#3F51A8]" strokeWidth={1.5} /><h3 className="text-[13px] font-semibold text-[#30343B]">Role-based access</h3></div><p className="mt-2 text-[13px] leading-5 text-[#595E68]">Authorized Margin personnel and controlled service providers involved in ingestion, reconciliation, investigation, security and customer delivery only.</p></div></div><p className="text-[12px] leading-5 text-[#777A82]">Exact storage locations, subprocessors, access logging, incident response, retention and deletion arrangements should be confirmed in the relevant security, privacy and contractual materials before processing begins.</p></div>
          </ScopeDetail>
          <ScopeDetail label="05" title="What Margin returns">
            <div className="space-y-4"><p className={bodyClass}>Margin returns a Financial Position Brief that connects the operational event to the available financial evidence and makes the decision boundary visible.</p><div className="grid gap-2 sm:grid-cols-2">{['Case summary and approved scope', 'Investigation period and marketplaces examined', 'Source reports and records used', 'Transaction, inventory or settlement reconciliation', 'Evidence chain connecting event to financial impact', 'Supported exposure and amounts already credited, settled or accounted for', 'Unresolved balance, evidence gaps and contradictions', 'Recommended next action, accountable owner and approval boundary'].map((item) => <div key={item} className="flex items-start gap-2 border border-[#E8E7E1] bg-[#F4F3ED] p-3 text-[13px] leading-5 text-[#595E68]"><FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3B8F5A]" strokeWidth={1.8} />{item}</div>)}</div><div className="border-l-2 border-[#5165C7] pl-4 text-[13px] leading-6 text-[#48677A]">A supported exposure is not the same as a recovered amount. The brief keeps supported exposure, pending claim, Amazon-approved reimbursement, cash received, and unresolved balance distinct.</div></div>
          </ScopeDetail>
          <ScopeDetail label="06" title="If nothing material is found">
            <div className="space-y-4"><p className={bodyClass}>Margin does not imply that every investigation produces a reimbursement claim. If the records do not support a material variance, recoverable exposure or defensible action, Margin returns a documented no-material-finding result.</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{outcomes.map(([title, body]) => <article key={title} className="border border-[#E8E7E1] bg-[#F4F3ED] p-4"><h3 className="text-[13px] font-semibold text-[#30343B]">{title}</h3><p className="mt-1.5 text-[12px] leading-5 text-[#595E68]">{body}</p></article>)}</div></div>
          </ScopeDetail>
        </section>

        <section className="border-b border-[#E8E7E1] py-6 sm:py-8" aria-labelledby="working-request-title">
          <div className="grid gap-5 md:grid-cols-[0.72fr_1.28fr] md:gap-12"><div><p className={labelClass}>The working request</p><h2 id="working-request-title" className={`${headingClass} mt-2`}>Specific data. Specific people. Specific output.</h2></div><div className="space-y-4"><blockquote className="border-l-2 border-[#5165C7] pl-4 text-[14px] leading-6 text-[#595E68]">Margin is requesting scoped, read-only access to the seller’s authorized Amazon business data for the purpose of investigating and reconciling FBA inventory, settlement, reimbursement and related operational events.</blockquote><p className={bodyClass}>Margin will not submit a claim, alter the seller’s Amazon account, initiate a payout or take another consequential action without the seller’s separate approval.</p></div></div>
        </section>

        <section className="py-6 sm:py-8" aria-labelledby="source-references-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className={labelClass}>Source references</p><h2 id="source-references-title" className="mt-2 text-[20px] font-semibold tracking-tight text-[#30343B]">The Amazon framework behind the boundary.</h2></div><Link to="/security" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0B74DE] underline underline-offset-4">Read Margin security practices <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></div>
          <div className="mt-4 grid gap-x-6 gap-y-2 border-t border-[#E8E7E1] pt-4 sm:grid-cols-2">{sourceLinks.map((source) => <a key={source.href} href={source.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[13px] text-[#48677A] underline underline-offset-4 transition-colors hover:text-[#0B74DE]"><ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{source.label}</a>)}</div>
        </section>

        <section className="border-t border-[#E8E7E1] py-6 sm:py-8" aria-label="Continue to records submission"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[15px] font-semibold text-[#30343B]">Ready to send the records you already have?</p><p className="mt-1 text-[13px] leading-5 text-[#595E68]">You do not need to prepare a perfect package. Margin will explain if anything important is missing.</p></div><Link to="/audit-start" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[5px] bg-[#0B74DE] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#075EBA]">Continue to send records <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></section>
      </main>
    </div>
  );
}
