import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  Check,
  CircleAlert,
  FileCheck2,
  Landmark,
  Link2,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const payoutChecks = [
  ['Establishes what was expected to be paid', 'Margin examines available settlement and transaction records to establish the amounts contributing to a payout.', Receipt],
  ['Verifies the payout against settlement records', 'Margin connects payout information to the relevant settlement period and underlying financial activity.', Link2],
  ['Checks whether the money reached the bank', 'Where bank records are available, Margin compares the expected payout with the corresponding bank deposit.', Landmark],
  ['Identifies differences that need investigation', 'Margin helps establish what could explain a difference between expected and received amounts.', CircleAlert],
  ['Carries the financial position through to closure', 'Margin maintains the relationship between settlement, payout, bank deposit and underlying transactions.', ShieldCheck],
] as const;

const statusRows = [
  ['Expected', 'The amount indicated as payable.', 'Amazon or settlement record'],
  ['Released or initiated', 'The payout has progressed through Amazon’s disbursement process.', 'Payout status'],
  ['Received', 'The corresponding funds appear in the available bank records.', 'Bank-side evidence'],
  ['Unverified', 'The available records do not yet establish whether the funds arrived.', 'Further evidence required'],
];

const varianceSteps = [
  ['01', 'Connect the settlement', 'Identify the transactions and adjustments contributing to the reported amount.'],
  ['02', 'Verify the payout', 'Establish the payout status and amount Amazon reports as released or initiated.'],
  ['03', 'Compare the bank record', 'Identify the corresponding deposit and quantify the difference.'],
  ['04', 'Investigate the variance', 'Determine whether it is explained by timing, adjustments, reserves, an unmatched deposit or an unresolved issue.'],
  ['05', 'Establish the outcome', 'Record what has been verified and what still requires follow-up.'],
];

const comparisonRows = [
  ['Display settlement totals', 'Establish how the settlement amount was formed'],
  ['Show payout status', 'Distinguish expected, released and received funds'],
  ['List bank deposits', 'Connect deposits to the relevant payout and settlement'],
  ['Flag different amounts', 'Investigate and explain the variance where evidence permits'],
  ['Mark a settlement complete', 'Establish whether the financial outcome has actually closed'],
];

const PayoutVerification = () => {
  usePageMeta({
    title: 'Payout Verification | Margin',
    description: 'Establish whether what Amazon says it paid matches the payout, the underlying settlement, and the money received by the business.',
    url: `${SITE_META.url}/payout-verification`,
    image: SITE_META.image,
  });

  return (
    <div className="workflow-page min-h-screen bg-[#F7F8F7] text-[#30343B]">
      <PublicNavbar variant="light" />
      <main>
        <section className="relative overflow-hidden bg-white pb-16 pt-32 sm:pb-20 sm:pt-40 md:pb-28 md:pt-48">
          <div className="pointer-events-none absolute right-[-15%] top-[-18%] h-[580px] w-[580px] rounded-full bg-[#ECEFF0] blur-3xl" />
          <div className="mx-auto grid w-full max-w-[1280px] gap-14 px-5 sm:px-6 md:grid-cols-[minmax(0,1.03fr)_minmax(360px,0.77fr)] md:items-center md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="relative max-w-[790px]">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Payout verification</p>
              <h1 className="max-w-[790px] font-lora text-[45px] font-normal leading-[0.99] tracking-[-0.055em] text-[#30343B] sm:text-[62px] md:text-[78px]">Know what Amazon paid, what reached your bank, and what remains outstanding.</h1>
              <p className="mt-7 max-w-[710px] text-[17px] leading-8 text-[#667177] sm:text-[19px] sm:leading-9">A settlement statement is not the same as money received. Margin connects payout and settlement records with the underlying transactions and available bank records to establish what was expected, what was released, what arrived, and what still needs to be explained.</p>
              <p className="mt-5 max-w-[710px] text-[17px] leading-8 text-[#667177] sm:text-[19px] sm:leading-9">Because knowing that a payout was initiated is not the same as knowing that the money reached your account.</p>
              <Link to="#payout-checks" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#30343B] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#20242A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30343B]/35 focus-visible:ring-offset-2">See how payout verification works <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>

            <div className="relative min-h-[380px] md:min-h-[460px]">
              <div className="absolute left-[13%] top-[7%] h-[86%] w-px bg-gradient-to-b from-[#DCE2E2] via-[#6B8581] to-[#30343B]" />
              <div className="absolute left-[7%] top-[7%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#6B8581] bg-white" /> Settlement recorded</div>
              <div className="absolute left-[7%] top-[31%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#6B8581] bg-white" /> Payout initiated</div>
              <div className="absolute left-[7%] top-[55%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#6B8581] bg-white" /> Bank evidence</div>
              <div className="absolute left-[7%] top-[79%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#30343B] bg-[#30343B]" /> Financial outcome</div>
              <div className="absolute left-[29%] top-[13%] right-0 border-t border-[#DCE2E2]" />
              <div className="absolute left-[29%] top-[37%] right-[9%] border-t border-[#DCE2E2]" />
              <div className="absolute left-[29%] top-[61%] right-[17%] border-t border-[#DCE2E2]" />
              <div className="absolute bottom-[9%] left-[29%] right-[2%] border-t border-[#30343B]" />
              <div className="absolute left-[31%] top-[8%] text-[14px] leading-6 text-[#667177]">Settlement amount<br /><span className="font-semibold text-[#30343B]">$48,500 recorded</span></div>
              <div className="absolute left-[31%] top-[32%] text-[14px] leading-6 text-[#667177]">Payout status<br /><span className="font-semibold text-[#30343B]">Released · transfer initiated</span></div>
              <div className="absolute left-[31%] top-[56%] text-[14px] leading-6 text-[#667177]">Bank deposit identified<br /><span className="font-semibold text-[#30343B]">$46,900 received</span></div>
              <div className="absolute bottom-[3%] left-[31%] max-w-[235px] text-[14px] leading-6 text-[#30343B]">Variance to explain<br /><span className="font-semibold text-[#5C7773]">$1,600 outstanding · not yet a loss</span></div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28"><div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">The payout problem</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A settlement report is not proof of cash received.</h2></div><div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>Amazon processes thousands of financial events across orders, refunds, fees, adjustments, reserves, reimbursements and settlements. These events ultimately contribute to the balance from which payouts are calculated.</p><p className="mt-5">But the financial journey does not end when a settlement statement becomes available.</p><p className="mt-5">A business still needs to establish whether the settlement amount agrees with the transactions that make up the settlement, whether deferred transactions were distinguished from released transactions, whether fees, refunds, adjustments and reserves were accounted for, whether the payout amount matches what Amazon reported as payable, whether the payout was actually released, and whether the expected deposit reached the bank account.</p><p className="mt-6 font-semibold text-[#30343B]">The problem is not simply knowing what Amazon says it paid. It is establishing whether the financial journey from marketplace activity to the seller’s bank account actually closed.</p></div></div></section>

        <section id="payout-checks" className="scroll-mt-24 bg-white py-16 sm:py-20 md:py-28"><div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12"><div className="grid gap-12 md:grid-cols-[0.72fr_1.28fr] md:gap-16"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">The verification layer</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">What Margin does.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin connects the payout to its settlement composition, bank-side evidence and resulting financial position.</p></div><div className="border-t border-[#DDE2E1]">{payoutChecks.map(([title, body, Icon]) => <div key={title} className="grid gap-4 border-b border-[#DDE2E1] py-6 sm:grid-cols-[42px_0.86fr_1.14fr] sm:items-center sm:gap-6"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F2F1] text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div><h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#30343B] sm:text-[17px]">{title}</h3><p className="text-[14px] leading-6 text-[#667177]">{body}</p></div>)}</div></div></div></section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28"><div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Status distinctions</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Know the difference between expected, released and received.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Where bank records are available, Margin compares the expected payout with the corresponding deposit.</p><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">A payout marked as initiated is not, by itself, proof of a completed bank deposit.</p></div><div className="max-w-[720px]"><div className="grid gap-0 border-t border-[#DDE2E1]">{statusRows.map(([title, body, source]) => <div key={title} className="grid gap-3 border-b border-[#DDE2E1] py-5 sm:grid-cols-[0.8fr_1.25fr_0.75fr] sm:items-center sm:gap-6"><h3 className="text-[16px] font-semibold text-[#30343B]">{title}</h3><p className="text-[14px] leading-6 text-[#667177]">{body}</p><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5C7773]">{source}</span></div>)}</div><p className="mt-8 border-l-2 border-[#5C7773] pl-4 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">This distinction matters because knowing a transfer was initiated is not the same as verifying that funds arrived.</p></div></div></section>

        <section className="bg-white py-16 sm:py-20 md:py-28"><div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[780px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Illustrative example</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A payout is reported. Has the money actually arrived?</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Illustrative example — amounts are hypothetical.</p></div><div className="mt-12 grid gap-3 sm:grid-cols-4"><div className="border-t-2 border-[#30343B] pt-4"><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7A858A]">Amazon settlement amount</p><p className="mt-3 font-lora text-[34px] tracking-[-0.04em] text-[#30343B]">$48,500</p><p className="mt-1 text-[12px] text-[#667177]">Settlement recorded</p></div><div className="border-t-2 border-[#30343B] pt-4"><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7A858A]">Expected bank deposit</p><p className="mt-3 font-lora text-[34px] tracking-[-0.04em] text-[#30343B]">$48,500</p><p className="mt-1 text-[12px] text-[#667177]">Expected to arrive</p></div><div className="border-t-2 border-[#5C7773] pt-4"><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7A858A]">Bank deposit identified</p><p className="mt-3 font-lora text-[34px] tracking-[-0.04em] text-[#30343B]">$46,900</p><p className="mt-1 text-[12px] text-[#667177]">Variance identified</p></div><div className="border-t-2 border-[#7C4F49] pt-4"><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7A858A]">Unexplained difference</p><p className="mt-3 font-lora text-[34px] tracking-[-0.04em] text-[#30343B]">$1,600</p><p className="mt-1 text-[12px] text-[#667177]">Not automatically a loss</p></div></div><p className="mt-10 max-w-[820px] border-l-2 border-[#5C7773] pl-4 text-[16px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">The difference becomes an item to investigate against payout, settlement and bank records—not a conclusion before the evidence is connected.</p><div className="relative mt-12 grid gap-8 border-t border-[#DDE2E1] pt-8 sm:grid-cols-5 sm:gap-0 sm:border-t-0 sm:pt-0">{varianceSteps.map(([number, title, body], index) => <div key={number} className={`relative ${index > 0 ? 'sm:border-l sm:border-[#DDE2E1] sm:pl-5' : ''} ${index < 4 ? 'sm:pr-5' : ''}`}><span className="text-[11px] font-semibold tracking-[0.16em] text-[#7A858A]">{number}</span><h3 className="mt-4 text-[15px] font-semibold text-[#30343B]">{title}</h3><p className="mt-3 text-[13px] leading-6 text-[#667177]">{body}</p></div>)}</div></div></section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28"><div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[760px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Why this is different</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Close the gap between what you were paid and what your business actually received.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">A settlement report tells you what Amazon recorded for a settlement period. A bank statement tells you what reached the bank. The important work is connecting those records and establishing whether the financial position agrees.</p></div><div className="mt-12 overflow-x-auto border-t border-[#DDE2E1]"><div className="min-w-[680px]"><div className="grid grid-cols-[0.85fr_1.15fr] border-b border-[#DDE2E1] py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span>Basic payout reporting</span><span>Margin’s responsibility</span></div>{comparisonRows.map(([basic, margin]) => <div key={basic} className="grid grid-cols-[0.85fr_1.15fr] border-b border-[#DDE2E1] py-5 text-[14px] leading-6"><span className="pr-8 text-[#667177]">{basic}</span><span className="font-semibold text-[#30343B]">{margin}</span></div>)}</div></div><p className="mt-9 max-w-[820px] border-l-2 border-[#5C7773] pl-4 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">Margin does not stop at showing what Amazon reported. It works to establish whether the reported financial outcome agrees with the money received and the underlying records.</p></div></section>

        <section className="bg-white py-16 sm:py-20 md:py-28"><div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">The commercial outcome</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Make the actual financial outcome visible.</h2></div><div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>Your finance team should not have to assume that a settlement is correct because Amazon marked it as paid.</p><p className="mt-5">Margin helps establish what was expected, what arrived, what can be explained and what still needs attention—giving your business a more reliable view of its actual financial position.</p><div className="mt-7 flex items-start gap-3 border-t border-[#DDE2E1] pt-5 text-[14px] leading-6 text-[#667177]"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#5C7773]" strokeWidth={1.7} />Bank-side verification depends on the corresponding bank records being available. Margin keeps verified, inferred and unverified states distinct.</div></div></div></section>

        <section className="border-t border-[#E1E5E5] bg-[#F4F5F4] py-20 sm:py-24 md:py-32"><div className="mx-auto flex w-full max-w-[900px] flex-col items-center px-5 text-center sm:px-6"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#30343B]"><Banknote className="h-6 w-6" strokeWidth={1.5} /></div><p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Establish the financial position</p><h2 className="mt-4 font-lora text-[38px] font-normal leading-[1.04] tracking-[-0.05em] text-[#30343B] sm:text-[52px]">Know whether the financial journey actually closed.</h2><p className="mt-5 max-w-[700px] text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin helps connect settlement records, payout status, bank evidence and underlying transactions so your team can establish what was paid, what was received and what remains outstanding.</p><Link to="/audit-start" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#635BFF] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(99,91,255,0.18)] transition-colors hover:bg-[#5148E5]">Establish Your Financial Position <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></section>
      </main>
      <BrandFooter wide />
    </div>
  );
};

export default PayoutVerification;
