import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  FileCheck2,
  Link2,
  Search,
  Scale,
  WalletCards,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { ExploreMoreWorkflows } from '@/components/landing/ExploreMoreWorkflows';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const relationshipRows = [
  {
    title: 'Marketplace transactions',
    body: 'Charges, fees, credits, reimbursements and adjustments.',
    icon: CircleDollarSign,
  },
  {
    title: 'Operational events',
    body: 'Shipment, inventory, return and fulfilment activity where relevant records are available.',
    icon: Search,
  },
  {
    title: 'Recovery activity',
    body: 'Claims, case decisions, approved amounts, reversals and subsequent responses.',
    icon: FileCheck2,
  },
  {
    title: 'Settlement records',
    body: 'Financial activity showing how amounts are reflected in marketplace settlements and payouts.',
    icon: WalletCards,
  },
];

const positionOutcomes = [
  'Transactions with a supported financial explanation.',
  'Amounts associated with identified operational or financial events.',
  'Differences that remain unresolved.',
  'Activity requiring additional evidence or investigation.',
  'Potential recovery opportunities where the records justify further action.',
];

const reconciliationQuestions = [
  'What financial activity occurred?',
  'Which underlying event or transaction does it relate to?',
  'What financial treatment was expected?',
  'What do the available records actually show?',
  'What has been accounted for, and what remains unresolved?',
  'What action, if any, is justified by the evidence?',
];

const TransactionReconciliation = () => {
  usePageMeta({
    title: 'Transaction Reconciliation | Margin',
    description: 'Connect Amazon transaction records to the operational events, recovery activity, and settlement information that explain the financial position.',
    url: `${SITE_META.url}/transaction-reconciliation`,
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
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Transaction reconciliation</p>
              <h1 className="max-w-[780px] font-lora text-[45px] font-normal leading-[0.99] tracking-[-0.055em] text-[#30343B] sm:text-[62px] md:text-[78px]">Know what your transactions mean—and what remains unexplained.</h1>
              <p className="mt-7 max-w-[700px] text-[17px] leading-8 text-[#667177] sm:text-[19px] sm:leading-9">A transaction can appear correctly in a report without telling you whether the underlying financial event was handled as expected. Margin connects marketplace transaction records with the operational activity, adjustments, reimbursements and settlement information that give those numbers meaning—helping you establish what is accounted for, what differs and what still needs attention.</p>
              <Link to="#why-reconcile" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#30343B] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#20242A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30343B]/35 focus-visible:ring-offset-2">See Transaction Reconciliation in Action <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>

            <div className="relative min-h-[360px] md:min-h-[440px]">
              <div className="absolute left-[13%] top-[8%] h-[84%] w-px bg-[#DCE2E2]" />
              <div className="absolute left-[13%] top-[8%] h-[84%] w-px bg-gradient-to-b from-transparent via-[#79918E] to-transparent" />
              <div className="absolute left-[7%] top-[8%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#5C7773] bg-white" /> Source activity</div>
              <div className="absolute left-[7%] top-[34%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#5C7773] bg-white" /> Event context</div>
              <div className="absolute left-[7%] top-[60%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#5C7773] bg-white" /> Settlement treatment</div>
              <div className="absolute left-[7%] top-[86%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#5C7773] bg-white" /> Financial position</div>
              <div className="absolute left-[29%] top-[15%] right-0 border-t border-[#DCE2E2]" />
              <div className="absolute left-[29%] top-[41%] right-[8%] border-t border-[#DCE2E2]" />
              <div className="absolute left-[29%] top-[67%] right-[18%] border-t border-[#DCE2E2]" />
              <div className="absolute bottom-[3%] left-[29%] right-[3%] border-t border-[#30343B]" />
              <div className="absolute left-[31%] top-[11%] max-w-[190px] text-[14px] leading-6 text-[#667177]">Amazon transaction<br /><span className="font-semibold text-[#30343B]">Fee adjustment · $742.40</span></div>
              <div className="absolute left-[31%] top-[37%] max-w-[220px] text-[14px] leading-6 text-[#667177]">Related event<br /><span className="font-semibold text-[#30343B]">Inbound variance · FBA18QZ</span></div>
              <div className="absolute left-[31%] top-[63%] max-w-[220px] text-[14px] leading-6 text-[#667177]">Recorded treatment<br /><span className="font-semibold text-[#30343B]">Settlement · pending match</span></div>
              <div className="absolute bottom-[-1%] left-[31%] max-w-[220px] text-[14px] leading-6 text-[#30343B]">What the records support<br /><span className="font-semibold text-[#5C7773]">Explained · unresolved · or open</span></div>
            </div>
          </div>
        </section>

        <section id="why-reconcile" className="scroll-mt-24 border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Why reconciliation matters</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A recorded transaction is not the same as an explained financial outcome.</h2></div>
            <div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>Your marketplace generates a continuous stream of financial activity: charges, fees, credits, reimbursements, adjustments and settlement entries.</p><p className="mt-5">Those records show what Amazon reported. But understanding their financial meaning can require looking beyond an individual transaction.</p><p className="mt-5">What event produced the charge? Was an adjustment expected? Does a reimbursement relate to the original discrepancy? Has the amount appeared in subsequent settlement activity? Is the difference genuine, a timing issue or already accounted for elsewhere?</p><p className="mt-5 font-semibold text-[#30343B]">Without those connections, Finance can have the numbers without having the full explanation.</p></div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="grid gap-12 md:grid-cols-[0.72fr_1.28fr] md:gap-16">
              <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Context behind the amount</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">See the activity behind the number.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin examines transactions in the context of the records and events associated with them.</p><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Instead of treating each entry as an isolated amount, the investigation considers the relationships between:</p></div>
              <div className="border-t border-[#DDE2E1]">{relationshipRows.map(({ title, body, icon: Icon }) => <div key={title} className="grid gap-4 border-b border-[#DDE2E1] py-6 sm:grid-cols-[42px_0.8fr_1.2fr] sm:items-center sm:gap-6"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F2F1] text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div><h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#30343B] sm:text-[17px]">{title}</h3><p className="text-[14px] leading-6 text-[#667177]">{body}</p></div>)}</div>
            </div>
            <p className="mt-10 max-w-[760px] border-l-2 border-[#5C7773] pl-4 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">The purpose is to establish which relationships are supported by the records, which require further investigation and which cannot yet be confirmed.</p>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">What the position shows</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Know what has been accounted for. Find what has not.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">A difference between two records does not automatically mean money has been lost.</p><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">It may reflect a timing difference, a subsequent adjustment, a reversal, an incomplete record or a genuine discrepancy.</p></div>
            <div className="max-w-[720px]"><p className="text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9">Margin helps distinguish these possibilities so that your team isn't left treating every unmatched amount as a recovery opportunity—or assuming that every recorded amount has been fully resolved.</p><div className="mt-8 grid gap-0 border-t border-[#DDE2E1]">{positionOutcomes.map((outcome) => <div key={outcome} className="flex items-start gap-3 border-b border-[#DDE2E1] py-4 text-[15px] leading-6 text-[#30343B] sm:text-[16px]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5C7773]" strokeWidth={2} /><span>{outcome}</span></div>)}</div></div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[740px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">A connected investigation</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Follow the financial relationship—not just the transaction status.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Consider an inventory discrepancy.</p></div>
            <div className="relative mt-12 grid gap-8 border-t border-[#DDE2E1] pt-8 sm:grid-cols-4 sm:gap-0 sm:border-t-0 sm:pt-0">{[
              ['01', 'Expected movement', 'An expected inventory movement is recorded.'],
              ['02', 'Actual movement', 'The actual movement differs and a case is raised.'],
              ['03', 'Amazon response', 'Amazon responds and a reimbursement may be approved.'],
              ['04', 'Financial outcome', 'The reimbursement is examined against settlement activity.'],
            ].map(([number, title, body], index) => <div key={number} className={`relative ${index > 0 ? 'sm:border-l sm:border-[#DDE2E1] sm:pl-6' : ''} ${index < 3 ? 'sm:pr-6' : ''}`}><span className="text-[11px] font-semibold tracking-[0.16em] text-[#7A858A]">{number}</span><h3 className="mt-4 text-[16px] font-semibold text-[#30343B]">{title}</h3><p className="mt-3 text-[14px] leading-6 text-[#667177]">{body}</p></div>)}</div>
            <p className="mt-12 max-w-[820px] border-l-2 border-[#5C7773] pl-4 text-[16px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">Margin connects the available records across that sequence, helping establish what happened from the originating event through to the financial outcome.</p>
            <p className="mt-5 max-w-[820px] text-[15px] leading-7 text-[#667177] sm:text-[16px] sm:leading-8">Not every event follows the same path. The conclusion depends on the records available and the evidence they support.</p>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">The reconciliation brief</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Reconciliation that leads to an explainable financial position.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Transaction reconciliation should give Finance more than a list of matched and unmatched entries.</p></div>
            <div><p className="text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9">It should help answer:</p><div className="mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2">{reconciliationQuestions.map((question, index) => <div key={question} className="flex items-start gap-3 border-t border-[#DDE2E1] pt-4"><span className="text-[11px] font-semibold tracking-[0.14em] text-[#7A858A]">0{index + 1}</span><span className="text-[15px] leading-6 text-[#30343B]">{question}</span></div>)}</div><p className="mt-10 max-w-[720px] text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">Where relationships are supported, Margin preserves the underlying references and calculations. Where they are inferred or uncertain, that distinction remains visible.</p><p className="mt-5 max-w-[720px] text-[15px] leading-7 text-[#667177] sm:text-[16px] sm:leading-8">Your team can examine the reasoning behind a finding rather than having to accept an unexplained result.</p></div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">From finding to action</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">From financial differences to decisions you can defend.</h2></div>
            <div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>When a discrepancy is established, the next step is not automatically to submit a claim.</p><p className="mt-5">Margin evaluates the available evidence, relevant recovery conditions, potential value and outstanding questions before recommending action.</p><p className="mt-5">You can see what has been established, what remains uncertain and what may warrant further investigation. Recovery work proceeds within the agreed scope and your authorised approval.</p><p className="mt-6 font-semibold text-[#30343B]">You retain the decision. Margin carries the investigation forward.</p></div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Built for continuity</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Make the financial picture easier to establish every time.</h2></div>
            <div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>Repeatedly rebuilding transaction histories consumes Finance time and makes recurring issues harder to recognise.</p><p className="mt-5">Margin preserves relevant findings, evidence and outcomes so that previously examined activity can inform subsequent investigations where the records support a connection.</p><p className="mt-5 font-semibold text-[#30343B]">The objective is not simply to explain an individual transaction. It is to make financial discrepancies easier to identify, investigate and account for as your business continues operating.</p></div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24 md:py-32">
          <div className="mx-auto flex w-full max-w-[900px] flex-col items-center px-5 text-center sm:px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F2F1] text-[#30343B]"><Link2 className="h-6 w-6" strokeWidth={1.5} /></div>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Establish the financial position</p>
            <h2 className="mt-4 font-lora text-[38px] font-normal leading-[1.04] tracking-[-0.05em] text-[#30343B] sm:text-[52px]">Establish what your transactions are telling you.</h2>
            <p className="mt-5 max-w-[690px] text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Your financial records contain more than amounts and descriptions. They contain evidence of what happened across your marketplace operation.</p>
            <p className="mt-4 max-w-[690px] text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin helps connect that evidence, establish what the financial activity supports and identify what still needs to be resolved.</p>
            <Link to="/audit-start" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#635BFF] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(99,91,255,0.18)] transition-colors hover:bg-[#5148E5]">Establish Your Financial Position <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </section>
      <ExploreMoreWorkflows />
      </main>
      <BrandFooter wide />
    </div>
  );
};

export default TransactionReconciliation;
