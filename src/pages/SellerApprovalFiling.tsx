import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  FileCheck2,
  LockKeyhole,
  MessageSquareText,
  Play,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const controlAreas = [
  {
    title: 'Prepare the case before asking for approval',
    body: 'Margin investigates the discrepancy, assesses the available evidence and prepares the recovery case for review. Approval is based on an established case that makes clear what happened, why recovery is warranted, what supports it, what remains uncertain and what action is proposed.',
    icon: ClipboardCheck,
  },
  {
    title: 'Give the seller a meaningful decision',
    body: 'The seller sees the proposed action and its supporting information before deciding whether to authorise submission. The decision can be approved, declined, sent back for review or marked not ready when evidence or eligibility questions remain unresolved.',
    icon: UserCheck,
  },
  {
    title: 'File only within the authority granted',
    body: 'Once approval is given, Margin carries the authorised action through the applicable marketplace workflow. Approval relates to the specific case and proposed action; it is not silently interpreted as unrestricted permission to act on the account.',
    icon: LockKeyhole,
  },
  {
    title: 'Preserve an accountable action history',
    body: 'The case retains what was approved, when approval was given, what was submitted, which evidence accompanied the filing and what happened after submission. The purpose is to make actions taken on the seller’s behalf inspectable.',
    icon: FileCheck2,
  },
  {
    title: 'Continue managing the case after filing',
    body: 'Approval and submission are not the end of the recovery. Margin continues tracking marketplace responses, information requests, decisions and financial outcomes, applying the approval process again when further action falls outside the original authority.',
    icon: MessageSquareText,
  },
];

const approvalSteps = [
  ['Margin investigates', 'A discrepancy is identified, relevant records are examined and the financial impact is assessed.'],
  ['The case is prepared', 'Supporting evidence, the proposed recovery action and remaining uncertainties are brought together.'],
  ['The seller reviews', 'The seller can understand what happened, why recovery is pursued and what Margin proposes to submit.'],
  ['The seller decides', 'The seller approves, declines or requests further review. No filing takes place without required authorisation.'],
  ['Margin executes', 'The authorised case is submitted through the applicable marketplace process and submission details are retained.'],
  ['Margin follows the outcome', 'Responses, decisions and financial results remain connected to the original case.'],
];

const comparisonRows = [
  ['Request account access', 'Operate within defined permissions and authority'],
  ['Prepare a claim', 'Establish the case and its supporting evidence'],
  ['Ask for approval', 'Present the proposed action and its rationale'],
  ['Submit the claim', 'Execute only within the approved scope'],
  ['Record submission status', 'Preserve the approval and action history'],
  ['Report the outcome', 'Continue tracking the case through financial resolution'],
];

export default function SellerApprovalFiling() {
  usePageMeta({
    title: 'Seller Approval & Filing | Margin',
    description: 'Delegate recovery execution while keeping seller authority, approval boundaries and filing history under control.',
    url: `${SITE_META.url}/seller-approval-filing`,
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
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Seller approval and filing</p>
              <h1 className="max-w-[780px] font-lora text-[45px] font-normal leading-[0.99] tracking-[-0.055em] text-[#30343B] sm:text-[62px] md:text-[78px]">Stay in control of every recovery submitted on your behalf.</h1>
              <p className="mt-7 max-w-[700px] text-[17px] leading-8 text-[#667177] sm:text-[19px] sm:leading-9">Margin takes the work of investigating and preparing recovery cases off your team’s hands, while keeping you in control of what gets submitted. Review the findings, understand the evidence and proposed action, and approve filing when you’re satisfied that the case is ready.</p>
              <p className="mt-6 max-w-[680px] border-l-2 border-[#5C7773] pl-4 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">Your business retains the authority. Margin takes responsibility for carrying the approved work forward.</p>
              <a href="#why-approval" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#30343B] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#20242A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30343B]/35 focus-visible:ring-offset-2">See the approval boundary <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
            </div>

            <div className="relative min-h-[360px] md:min-h-[440px]">
              <div className="absolute left-[13%] top-[8%] h-[84%] w-px bg-[#DCE2E2]" />
              <div className="absolute left-[13%] top-[8%] h-[84%] w-px bg-gradient-to-b from-transparent via-[#79918E] to-transparent" />
              {[
                ['Case prepared', 'Evidence and proposed action', 'top-[10%]'],
                ['Seller review', 'Informed decision', 'top-[34%]'],
                ['Authority granted', 'Specific scope approved', 'top-[58%]'],
                ['Action accountable', 'Submission and outcome linked', 'top-[82%]'],
              ].map(([label, value, position]) => (
                <div key={label} className={`absolute left-[7%] ${position} flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A858A]`}>
                  <span className="h-3 w-3 rounded-full border-2 border-[#5C7773] bg-white" />
                  <span>{label}</span>
                  <span className="hidden text-[12px] font-medium normal-case tracking-normal text-[#30343B] sm:inline">{value}</span>
                </div>
              ))}
              <div className="absolute left-[29%] top-[17%] right-0 border-t border-[#DCE2E2]" />
              <div className="absolute left-[29%] top-[41%] right-[8%] border-t border-[#DCE2E2]" />
              <div className="absolute left-[29%] top-[65%] right-[18%] border-t border-[#DCE2E2]" />
              <div className="absolute bottom-[4%] left-[29%] right-[3%] border-t border-[#30343B]" />
              <div className="absolute left-[31%] top-[13%] max-w-[220px] text-[14px] leading-6 text-[#667177]">Recovery case<br /><span className="font-semibold text-[#30343B]">$1,240 supported exposure</span></div>
              <div className="absolute left-[31%] top-[37%] max-w-[220px] text-[14px] leading-6 text-[#667177]">Decision options<br /><span className="font-semibold text-[#30343B]">Approve · decline · review</span></div>
              <div className="absolute left-[31%] top-[61%] max-w-[220px] text-[14px] leading-6 text-[#667177]">Approval scope<br /><span className="font-semibold text-[#5C7773]">Specific case and action</span></div>
              <div className="absolute bottom-[-1%] left-[31%] max-w-[230px] text-[14px] leading-6 text-[#30343B]">Control outcome<br /><span className="font-semibold text-[#5C7773]">Submitted · response retained</span></div>
            </div>
          </div>
        </section>

        <section id="why-approval" className="scroll-mt-24 border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">The problem this addresses</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A supported case is not automatically a case the business should submit.</h2></div>
            <div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>Recovery work involves decisions that affect the seller’s marketplace account, financial records and relationship with Amazon. The seller needs to know what is being claimed, why the case is justified, what information is being provided and what action will be taken.</p><p className="mt-5">If the seller manages every step personally, investigation, evidence gathering and filing remain with the team. If the process is delegated without clear controls, visibility can be lost into which cases are prepared, what supports them, what outcome is pursued, who authorised the action and what happened afterward.</p><p className="mt-6 font-semibold text-[#30343B]">The problem is not just the work involved in filing. It is ensuring that delegated recovery activity remains accountable to the business that owns the account.</p></div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[720px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">What Margin does</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Take ownership of the work without taking ownership away from the seller.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Preparing a case and authorising its submission are two different decisions. Margin keeps that distinction visible throughout the workflow.</p></div>
            <div className="mt-10 grid gap-3 sm:mt-14 md:grid-cols-2 lg:grid-cols-3">
              {controlAreas.map(({ title, body, icon: Icon }) => <article key={title} className="flex min-h-[300px] flex-col bg-[#F4F5F4] p-6 sm:p-7 md:p-8"><div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#DCE2E5] bg-white text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div><div className="mt-auto pt-12"><h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#30343B] sm:text-[17px]">{title}</h3><p className="mt-3 text-[14px] leading-6 text-[#667177]">{body}</p></div></article>)}
            </div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Illustrative approval workflow</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A recovery case is ready. The seller decides whether it proceeds.</h2><p className="mt-5 text-[14px] leading-6 text-[#667177]">The control principle: Margin can take responsibility for the work without taking away the seller’s authority to decide what happens to their business.</p></div>
            <div className="max-w-[760px]"><div className="grid gap-0 border-t border-[#DDE2E1]">{approvalSteps.map(([title, body], index) => <div key={title} className="grid gap-3 border-b border-[#DDE2E1] py-5 sm:grid-cols-[42px_0.72fr_1.28fr] sm:items-start sm:gap-5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#5C7773]">0{index + 1}</span><span className="text-[15px] font-semibold text-[#30343B]">{title}</span><span className="text-[14px] leading-6 text-[#667177]">{body}</span></div>)}</div></div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Why this is different</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Delegate the work. Keep control of the decision.</h2></div>
            <div><div className="overflow-hidden border-t border-[#DDE2E1]"><div className="grid grid-cols-[0.9fr_1.1fr] border-b border-[#DDE2E1] py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A858A]"><span>Basic delegated filing</span><span>Margin’s responsibility</span></div>{comparisonRows.map(([basic, margin]) => <div key={basic} className="grid grid-cols-[0.9fr_1.1fr] border-b border-[#DDE2E1] py-4 text-[13px] leading-5 sm:text-[14px]"><span className="pr-4 text-[#667177]">{basic}</span><span className="font-semibold text-[#30343B]">{margin}</span></div>)}</div><p className="mt-8 border-l-2 border-[#5C7773] pl-4 text-[16px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">Margin is designed to take ownership of recovery execution without taking ownership away from the seller.</p></div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">The approval boundary</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Informed, specific and traceable.</h2></div>
            <div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>Approval should not be a notification that something is ready to submit. The seller should understand the case, evidence, proposed action, amount or outcome being pursued and what remains uncertain.</p><div className="mt-8 grid gap-0 border-t border-[#DDE2E1] sm:grid-cols-2"><div className="flex items-start gap-3 border-b border-[#DDE2E1] py-4"><Check className="mt-1 h-4 w-4 shrink-0 text-[#5C7773]" /><span><strong className="text-[#30343B]">Approved</strong><span className="mt-1 block text-[14px] leading-6">The seller authorises the proposed filing.</span></span></div><div className="flex items-start gap-3 border-b border-[#DDE2E1] py-4"><X className="mt-1 h-4 w-4 shrink-0 text-[#8D6660]" /><span><strong className="text-[#30343B]">Declined</strong><span className="mt-1 block text-[14px] leading-6">The seller does not authorise submission.</span></span></div><div className="flex items-start gap-3 border-b border-[#DDE2E1] py-4"><MessageSquareText className="mt-1 h-4 w-4 shrink-0 text-[#5C7773]" /><span><strong className="text-[#30343B]">Needs review</strong><span className="mt-1 block text-[14px] leading-6">Further clarification or information is required.</span></span></div><div className="flex items-start gap-3 border-b border-[#DDE2E1] py-4"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[#7A858A]" /><span><strong className="text-[#30343B]">Not ready</strong><span className="mt-1 block text-[14px] leading-6">Evidence or eligibility issues remain unresolved.</span></span></div></div></div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24 md:py-32">
          <div className="mx-auto flex w-full max-w-[900px] flex-col items-center px-5 text-center sm:px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F2F1] text-[#30343B]"><ShieldCheck className="h-6 w-6" strokeWidth={1.5} /></div>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Establish the financial position</p>
            <h2 className="mt-4 font-lora text-[38px] font-normal leading-[1.04] tracking-[-0.05em] text-[#30343B] sm:text-[52px]">Delegate the recovery work. Keep control of the decisions.</h2>
            <p className="mt-5 max-w-[690px] text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Your team should not have to investigate, assemble and manage every recovery case personally to remain accountable for what gets submitted.</p>
            <p className="mt-4 max-w-[690px] text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin handles the work behind the case, presents the proposed action for approval and carries authorised submissions forward.</p>
            <Link to="/audit-start" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#635BFF] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(99,91,255,0.18)] transition-colors hover:bg-[#5148E5]">Establish Your Financial Position <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
      <BrandFooter wide />
    </div>
  );
}
