import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  FileCheck2,
  History,
  Link2,
  RefreshCcw,
  Scale,
  WalletCards,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { ExploreMoreWorkflows } from '@/components/landing/ExploreMoreWorkflows';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const controlAreas = [
  {
    title: 'Connect reversals to their originating transactions',
    body: 'Margin examines transaction references, identifiers, descriptions, amounts and related records to establish the relationship between an original financial event and its subsequent reversal or adjustment. A fee credit is not treated as an isolated positive transaction when the records can show which original fee it relates to and whether it fully or partially offsets the charge.',
    icon: Link2,
  },
  {
    title: 'Track how financial outcomes change',
    body: 'A financial outcome can evolve across multiple events and settlement periods. Margin helps establish whether an amount was initially charged or credited, subsequently reversed or adjusted, partially offset, deferred, released, carried forward or left outstanding.',
    icon: RefreshCcw,
  },
  {
    title: 'Identify incomplete accounting relationships',
    body: 'When related transactions do not agree, Margin helps identify the difference: a reversal without an origin, an original charge without an expected credit, a partial reversal with an unexplained balance, or a reimbursement subsequently debited from the seller account.',
    icon: FileCheck2,
  },
  {
    title: 'Connect marketplace activity to accounting treatment',
    body: 'Margin connects marketplace events with their financial consequences across transaction records, settlement information and accounting data. This helps distinguish revenue from refunds, original charges from fee reversals, and outstanding balances from completed financial outcomes.',
    icon: Scale,
  },
  {
    title: 'Preserve the financial position across periods',
    body: 'The financial story does not necessarily end when a settlement period closes. Margin maintains connections between original transactions and later adjustments so subsequent events are not treated as isolated activity and the resulting position remains visible to Finance.',
    icon: History,
  },
];

const relationshipChecks = [
  ['Original event identified', 'Establish the transaction or case associated with the initial financial event.'],
  ['Subsequent change identified', 'Find the later debit, credit or adjustment and determine whether it relates to the original event.'],
  ['Relationship supported', 'Test whether the amounts, references and available records support the connection.'],
  ['Resulting position determined', 'Establish the net financial effect and whether any outstanding balance remains.'],
  ['Outcome reflected', 'Make the relationship and resulting status available for financial reconciliation.'],
];

const comparisonRows = [
  ['Match transaction amounts', 'Connect original events to subsequent reversals and adjustments'],
  ['Record credits and debits', 'Establish what caused the financial change'],
  ['Group transactions into periods', 'Account for differences between posting and release timing'],
  ['Show outstanding entries', 'Investigate why the financial relationship remains unresolved'],
  ['Report the resulting balance', 'Preserve the history behind how that balance was reached'],
];

export default function ReversalAccountingReconciliation() {
  usePageMeta({
    title: 'Reversal & Accounting Reconciliation | Margin',
    description: 'Connect original marketplace events to reversals, adjustments, settlement timing and the accounting position they produce.',
    url: `${SITE_META.url}/reversal-accounting-reconciliation`,
    image: SITE_META.image,
  });

  return (
    <div className="workflow-page min-h-screen bg-[#F7F8F7] text-[#30343B]">
      <PublicNavbar variant="light" />
      <main>
        <section className="relative overflow-hidden bg-white pb-16 pt-32 sm:pb-20 sm:pt-40 md:pb-28 md:pt-48">
          <div className="pointer-events-none absolute right-[-14%] top-[-18%] h-[560px] w-[560px] rounded-full bg-[#ECEFF0] blur-3xl" />
          <div className="mx-auto grid w-full max-w-[1280px] gap-14 px-5 sm:px-6 md:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.78fr)] md:items-center md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="relative max-w-[780px]">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Reversal and accounting control</p>
              <h1 className="max-w-[780px] font-lora text-[45px] font-normal leading-[0.99] tracking-[-0.055em] text-[#30343B] sm:text-[62px] md:text-[78px]">Know when a financial event changes—and whether your records reflect the change.</h1>
              <p className="mt-7 max-w-[700px] text-[17px] leading-8 text-[#667177] sm:text-[19px] sm:leading-9">Financial activity does not always move in one direction. Transactions can be refunded, reversed, adjusted, deferred or carried into subsequent settlement periods. Margin connects these related events and examines how their financial consequences are reflected across records, helping establish what changed, what remains outstanding and whether the accounting position agrees.</p>
              <p className="mt-6 max-w-[680px] border-l-2 border-[#5C7773] pl-4 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">The objective is not simply to match transactions. It is to preserve the financial story when the numbers change.</p>
              <a href="#why-change" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#30343B] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#20242A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30343B]/35 focus-visible:ring-offset-2">See how Margin preserves the story <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
            </div>

            <div className="relative flex items-center justify-center bg-transparent">
              <img src="/reversal-accounting-sequence.png" alt="Accounting sequence showing an original reimbursement, subsequent reversal, connected relationship and resulting net position" className="h-auto w-full max-w-[560px] object-contain" />
            </div>
          </div>
        </section>

        <section id="why-change" className="scroll-mt-24 border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">The problem this addresses</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A transaction is recorded. Then something changes.</h2></div>
            <div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>A customer receives a refund. A previously charged fee is credited. An Amazon reimbursement is reversed. A reserve is released. An adjustment appears in a later settlement.</p><p className="mt-5">Each event may be recorded correctly in isolation, but Finance still needs to understand how it relates to the original event and what that means for the financial records.</p><p className="mt-5">Without that relationship, original transactions and subsequent reversals can be treated as unrelated entries, a reimbursement can be counted as complete even after a later debit, and deferred activity can appear in a different reporting period.</p><p className="mt-6 font-semibold text-[#30343B]">The deeper problem is continuity: preserving the relationship between the original event, the subsequent change and the final accounting consequence.</p></div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[720px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">What Margin does</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Keep the financial relationship visible as the numbers change.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin is concerned with the continuity of financial events—not just whether individual entries appear in the records.</p></div>
            <div className="mt-10 grid gap-3 sm:mt-14 md:grid-cols-2 lg:grid-cols-3">
              {controlAreas.map(({ title, body, icon: Icon }, index) => <article key={title} className={`flex min-h-[300px] flex-col bg-[#F4F5F4] p-6 sm:p-7 md:p-8 ${index === controlAreas.length - 1 ? 'lg:col-span-1' : ''}`}><div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#DCE2E5] bg-white text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div><div className="mt-auto pt-12"><h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#30343B] sm:text-[17px]">{title}</h3><p className="mt-3 text-[14px] leading-6 text-[#667177]">{body}</p></div></article>)}
            </div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-16">
              <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Illustrative example</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A reimbursement was received. Then it was reversed.</h2><p className="mt-5 text-[14px] leading-6 text-[#667177]">Hypothetical amounts. The point is the relationship, not the number.</p></div>
              <div>
                <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                  {[['INITIAL REIMBURSEMENT', '+$1,200', 'Credit recorded', CircleDollarSign], ['SUBSEQUENT REVERSAL', '−$1,200', 'Reversal recorded', RefreshCcw], ['NET FINANCIAL EFFECT', '$0', 'Position established', Scale]].map(([label, amount, detail, Icon]) => <div key={label as string} className="bg-white p-5 sm:p-6"><Icon className="h-5 w-5 text-[#5C7773]" strokeWidth={1.5} /><p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7A858A]">{label as string}</p><p className="mt-3 font-lora text-[34px] leading-none tracking-[-0.04em] text-[#30343B] sm:text-[40px]">{amount as string}</p><p className="mt-3 text-[13px] text-[#667177]">{detail as string}</p></div>)}
                </div>
                <p className="mt-8 max-w-[720px] border-l-2 border-[#5C7773] pl-4 text-[16px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">The initial reimbursement cannot be treated as a completed $1,200 recovery without accounting for the subsequent reversal.</p>
                <div className="mt-8 grid gap-0 border-t border-[#DDE2E1] sm:grid-cols-2">{relationshipChecks.map(([title, body]) => <div key={title} className="flex items-start gap-3 border-b border-[#DDE2E1] py-4 sm:pr-6"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5C7773]" strokeWidth={2} /><span><span className="block text-[15px] font-semibold text-[#30343B]">{title}</span><span className="mt-1 block text-[13px] leading-5 text-[#667177]">{body}</span></span></div>)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Why this is different</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Matching entries is not the same as preserving the financial story.</h2></div>
            <div><div className="overflow-hidden border-t border-[#DDE2E1]"><div className="grid grid-cols-[0.9fr_1.1fr] border-b border-[#DDE2E1] py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A858A]"><span>Basic accounting reconciliation</span><span>Margin's responsibility</span></div>{comparisonRows.map(([basic, margin]) => <div key={basic} className="grid grid-cols-[0.9fr_1.1fr] border-b border-[#DDE2E1] py-4 text-[13px] leading-5 sm:text-[14px]"><span className="pr-4 text-[#667177]">{basic}</span><span className="font-semibold text-[#30343B]">{margin}</span></div>)}</div><p className="mt-8 border-l-2 border-[#5C7773] pl-4 text-[16px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">Margin is concerned with the continuity of financial events—not just whether individual entries appear in the records.</p></div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Product boundary</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Control the relationship without claiming to replace accounting judgment.</h2></div>
            <div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>Margin helps establish the financial relationships and resulting position across marketplace records, settlement information and accounting data.</p><p className="mt-5">It does not automatically determine every company's tax treatment or replace its accounting system. Accounting treatment can depend on the entity, accounting policy, jurisdiction and reporting framework.</p><p className="mt-5 font-semibold text-[#30343B]">The output is a connected, reviewable financial position—what happened, what changed, what agrees and what remains to be reconciled.</p></div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24 md:py-32">
          <div className="mx-auto flex w-full max-w-[900px] flex-col items-center px-5 text-center sm:px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F2F1] text-[#30343B]"><WalletCards className="h-6 w-6" strokeWidth={1.5} /></div>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Establish the financial position</p>
            <h2 className="mt-4 font-lora text-[38px] font-normal leading-[1.04] tracking-[-0.05em] text-[#30343B] sm:text-[52px]">Stop letting financial changes become unexplained accounting differences.</h2>
            <p className="mt-5 max-w-[690px] text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Your Finance team should be able to understand not only what was recorded, but how the financial position evolved.</p>
            <p className="mt-4 max-w-[690px] text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin connects the original transaction to its subsequent reversals, adjustments and accounting consequences.</p>
            <Link to="/audit-start" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#635BFF] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(99,91,255,0.18)] transition-colors hover:bg-[#5148E5]">Establish Your Financial Position <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </section>
      <ExploreMoreWorkflows />
      </main>
      <BrandFooter wide />
    </div>
  );
}
