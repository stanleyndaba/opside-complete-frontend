import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

type DocumentReferenceProps = { name: string; source: string; icon: string };

function DocumentReference({ name, source, icon }: DocumentReferenceProps) {
  return (
    <span
      className="mx-1 inline-flex max-w-full translate-y-[0.12em] items-center gap-1.5 rounded-[4px] bg-[#F1F3F4] px-2 py-1 align-baseline text-[10px] leading-4 tracking-[-0.01em] text-[#3B4650]"
      title={`${source}: ${name}`}
    >
      <img src={icon} alt={source} className="h-4 w-4 shrink-0 object-contain" />
      <span className="font-semibold">{name}</span>
    </span>
  );
}

const controlPath = [
  {
    number: '01',
    title: 'Evidence linked',
    metric: '1,842 positions reviewed',
    detail: 'Source lineage established across operational, inventory, settlement, and ledger records.',
    state: 'Established',
  },
  {
    number: '02',
    title: 'Financial determination',
    metric: 'Supported and held positions separated',
    detail: 'Materiality, attribution, policy basis, and evidence sufficiency tested before action.',
    state: 'Determined',
  },
  {
    number: '03',
    title: 'Action authorized',
    metric: 'Seller approval required before submission',
    detail: 'The proposed action remains within the approved boundary; model confidence is not permission.',
    state: 'Authorized',
  },
  {
    number: '04',
    title: 'Response recorded',
    metric: 'Amazon response linked to the originating event',
    detail: 'Case decisions, response windows, credits, reversals, and settlement treatment preserved.',
    state: 'Recorded',
  },
  {
    number: '05',
    title: 'Outcome verified',
    metric: 'Credit, payout, and ledger treatment reconciled',
    detail: 'The final position is classified as resolved, partially resolved, or still unresolved.',
    state: 'Verified',
  },
] as const;

const resolutionChecks = [
  ['Evidence lineage preserved', 'Each material conclusion remains traceable to the source records available at the time of review.'],
  ['Financial determination reproduced', 'The supported position can be reconstructed from the evidence, valuation basis, and reconciliation rules applied.'],
  ['Supported and unresolved positions separated', 'Accounted-for value and remaining exceptions are not absorbed into the recoverable population.'],
  ['Authorization boundary respected', 'No model recommendation is treated as permission to submit or change the financial position.'],
  ['Seller approval recorded', 'The approved scope, decision owner, and permitted action are retained before controlled submission.'],
  ['Amazon response linked to the event', 'Correspondence, case decisions, and evidence requests remain connected to the originating financial record.'],
  ['Settlement and payout treatment reconciled', 'Approved value, credited value, settled value, and downstream ledger treatment remain distinct until matched.'],
  ['Reversal exposure evaluated', 'Subsequent reversals, partial credits, timing differences, and residual balances remain visible after response.'],
  ['Ledger attribution confirmed', 'The final financial position is connected to the relevant entity, account, settlement period, and ledger treatment.'],
  ['Final outcome classified', 'The record distinguishes recovered and reconciled, partially recovered, and unresolved outcomes.'],
  ['Residual exposure retained where unresolved', 'Open balances remain assigned with an owner and next action instead of being presented as closed.'],
  ['Completed case added to the evaluation record', 'The determination and the financial outcome become evidence for improving future investigations and controls.'],
] as const;

export const AccuracyGraphContent = () => {
  return (
    <>
      <section className="mx-auto w-full max-w-6xl overflow-visible bg-white">
        <div className="px-4 pt-4 pb-1 sm:px-8 sm:pt-7">
          <p className="text-[10px] font-medium uppercase tracking-tight text-[#7B8A97]">Resolution evaluation</p>
          <h1 className="mt-1.5 font-google-sans text-[24px] font-normal leading-tight tracking-[-0.04em] text-[#182026] sm:text-[30px]">What the completed record proves</h1>
          <p className="mt-2 max-w-3xl text-[12px] leading-5 tracking-tight text-[#66737F] sm:text-[13px]">
            Margin evaluates the complete path from supported determination to verified financial outcome—not simply whether an agent completed an investigation.
          </p>
        </div>

        <div className="px-4 py-5 sm:px-8 sm:py-8">
          <div className="relative grid grid-cols-1 gap-0 md:grid-cols-5" aria-label="Decision-to-Resolution Control Path">
            <div className="pointer-events-none absolute left-[18px] top-[18px] bottom-[18px] w-px bg-[#D7E6EE] md:left-[10%] md:right-[10%] md:top-[18px] md:bottom-auto md:h-px md:w-auto" aria-hidden="true" />
            {controlPath.map((stage, index) => (
              <div key={stage.number} className="relative min-w-0">
                <motion.article
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: index * 0.12, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10 flex gap-3 bg-white py-3 md:block md:px-2 md:py-0 md:text-center"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B74DE] font-google-sans text-[10px] font-semibold text-white md:mx-auto">
                    {stage.number}
                  </span>
                  <div className="min-w-0 pt-0.5 md:pt-4">
                    <h2 className="font-google-sans text-[12px] font-semibold tracking-tight text-[#182026]">{stage.title}</h2>
                    <p className="mt-1 text-[10px] font-semibold leading-4 tracking-tight text-[#285A86]">{stage.metric}</p>
                    <p className="mt-1.5 text-[10px] leading-4 tracking-tight text-[#66737F] md:mx-auto md:max-w-[180px]">{stage.detail}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-tight text-[#26704E]">
                      <Check className="h-3 w-3" strokeWidth={2.5} /> {stage.state}
                    </span>
                  </div>
                </motion.article>
                {index < controlPath.length - 1 ? <ChevronRight className="absolute right-[-10px] top-[12px] z-20 hidden h-4 w-4 text-[#A7C4D5] md:block" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-0 max-w-6xl bg-white px-5 pt-3 pb-7 font-google-sans text-[13px] leading-6 tracking-[-0.012em] text-[#595E68] sm:px-8 sm:pt-5 sm:text-[14px] sm:leading-7">
        <h2 className="mb-3 font-google-sans text-[22px] font-normal leading-tight tracking-[-0.03em] text-[#182026] sm:text-[26px]">Resolution outcome analysis</h2>
        <div className="max-w-5xl space-y-4">
          <p>
            Margin did not evaluate the investigation as a standalone model response. It evaluated whether the connected records supported the determination, whether the proposed action remained within the approved boundary, and whether the final position could be reproduced from the <DocumentReference icon="/amazon-logo-transparent-circle.png" source="Amazon" name="Amazon Fulfilment Network Inventory Adjustment and Disposition Ledger" /> <DocumentReference icon="/Dropbox_Icon.svg.png" source="Dropbox" name="Seller Evidence Intake and Shipment Support Folder" /> and the <DocumentReference icon="/onedriive.png" source="OneDrive" name="Settlement Period Reconciliation and Clearing Workbook" />.
          </p>
          <p>
            A discrepancy is not treated as resolved because it was detected, explained, or submitted. Margin follows the position through authorization, Amazon response, settlement, payout, reversal review, and ledger treatment, preserving the distinction between <mark className="rounded-[2px] bg-[#DDEBFF] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">supported determination</mark>, credited value, and verified financial closure. The response trail remains linked through the <DocumentReference icon="/gmailicon.png" source="Gmail" name="Amazon Case Correspondence and Decision Register" /> and the <DocumentReference icon="/outlookicon.webp" source="Outlook" name="Seller Approval and Action Authorization Record" />.
          </p>
          <p>
            The completed case becomes useful beyond its original recovery. Known outcomes strengthen future evidence matching and control decisions, while missing, contradictory, settlement-pending, or reversal-prone records remain visible as boundaries. The final evaluation is therefore based on what happened to the money, not only what an agent predicted. Margin carries the outcome forward in the <DocumentReference icon="/excel-icon-margin.png" source="Excel" name="Payout and Settlement Reconciliation Workbook" /> and the <DocumentReference icon="/gd.png" source="Google Drive" name="Verified Resolution Outcome Register" />.
          </p>
        </div>

        <section aria-label="Resolution control checks" className="mt-8 border-t border-[#E8E7E1] pt-5">
          <p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]">Resolution control checks</p>
          <div className="mt-3 grid gap-x-8 gap-y-2.5 md:grid-cols-2">
            {resolutionChecks.map(([title, detail], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 7 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: index * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-2.5"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#26734D] text-[12px] font-bold leading-none text-white" aria-hidden="true">✓</span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold leading-4 tracking-tight text-[#182026]">{title}</span>
                  <span className="mt-0.5 block text-[10px] leading-4 tracking-tight text-[#66737F]">{detail}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </section>
      </section>
    </>
  );
};

const AccuracyGraph = () => (
  <main className="min-h-screen w-full overflow-auto bg-white p-2 font-google-sans text-[#182026] selection:bg-[#0B74DE]/16 sm:p-3">
    <AccuracyGraphContent />
  </main>
);

export default AccuracyGraph;
