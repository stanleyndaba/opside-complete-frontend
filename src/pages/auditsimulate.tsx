import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, FileSearch, ScanLine } from 'lucide-react';

type AuditLine = {
  id: string;
  time: string;
  title: string;
  detail: string;
  amount: string;
  severity: 'high' | 'medium' | 'watch';
};

const auditLines: AuditLine[] = [
  {
    id: 'RFD-16874-INB',
    time: '00:03',
    title: 'Inbound shipment shortage detected',
    detail: 'Shipment record shows 36 units sent. Amazon receiving shows 32 units checked in.',
    amount: '$184.72',
    severity: 'high',
  },
  {
    id: 'RFD-16882-XFER',
    time: '00:07',
    title: 'Warehouse transfer loss surfaced',
    detail: 'Transfer movement closed without matching inventory arrival event at destination FC.',
    amount: '$312.18',
    severity: 'high',
  },
  {
    id: 'RFD-16865-DMG',
    time: '00:11',
    title: 'Damaged inventory gap found',
    detail: 'Inventory adjustment references damaged units, but no reimbursement was posted in settlements.',
    amount: '$96.44',
    severity: 'medium',
  },
  {
    id: 'RFD-16891-SET',
    time: '00:15',
    title: 'Settlement mismatch identified',
    detail: 'Approved reimbursement amount does not reconcile with the payout line on the seller ledger.',
    amount: '$227.09',
    severity: 'medium',
  },
  {
    id: 'RFD-16904-PRF',
    time: '00:19',
    title: 'Evidence gap before filing',
    detail: 'Invoice is available in Gmail, but shipment ID and SKU mapping still need to be attached.',
    amount: '$418.60',
    severity: 'watch',
  },
  {
    id: 'RFD-16918-POD',
    time: '00:23',
    title: 'Carrier proof matched',
    detail: 'Signed delivery proof, BOL, and Amazon receiving event now point to the same case.',
    amount: '$739.25',
    severity: 'high',
  },
  {
    id: 'RFD-16922-FEE',
    time: '00:27',
    title: 'Fee recovery candidate queued',
    detail: 'Referral fee and FBA fee charges exceed the expected category and dimensional weight profile.',
    amount: '$52.81',
    severity: 'watch',
  },
  {
    id: 'RFD-16939-APP',
    time: '00:31',
    title: 'Amazon reply requires action',
    detail: 'Support asked for supplier invoice and shipment proof. Margin found both in connected evidence.',
    amount: '$301.76',
    severity: 'high',
  },
];

const severityStyles = {
  high: 'border-[#B91C1C]/20 bg-[#FFF5F5] text-[#B91C1C]',
  medium: 'border-[#C87900]/20 bg-[#FFF8EA] text-[#A35B00]',
  watch: 'border-[#1D4ED8]/20 bg-[#F3F7FF] text-[#1D4ED8]',
};

const severityLabels = {
  high: 'High priority',
  medium: 'Review',
  watch: 'Watchlist',
};

const totalExposure = auditLines.reduce((sum, line) => sum + Number(line.amount.replace(/[$,]/g, '')), 0);

function AuditRow({ line, index, reduceMotion }: { line: AuditLine; index: number; reduceMotion: boolean }) {
  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 18, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: reduceMotion ? 0 : 0.35 + index * 0.55, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="grid gap-4 border-b border-[#E6EDF4] px-5 py-4 last:border-b-0 sm:grid-cols-[76px_1fr_104px] sm:px-6"
    >
      <div className="flex items-center gap-3 sm:block">
        <span className="block font-mono text-xs font-semibold text-[#7A8897]">{line.time}</span>
        <span className="mt-2 hidden h-2 w-2 rounded-full bg-[#1473E6] sm:block" />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-[#536171]">{line.id}</span>
          <span className={`rounded-[3px] border px-2 py-1 text-[11px] font-semibold ${severityStyles[line.severity]}`}>
            {severityLabels[line.severity]}
          </span>
        </div>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-[#182026] sm:text-xl">{line.title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[#536171] sm:text-base">{line.detail}</p>
      </div>

      <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
        <span className="text-xs font-semibold uppercase tracking-tight text-[#7A8897]">Exposure</span>
        <strong className="block text-xl font-semibold tracking-tight text-[#182026]">{line.amount}</strong>
      </div>
    </motion.li>
  );
}

const AuditSimulate = () => {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  return (
    <main className="min-h-screen overflow-hidden bg-[#F4F8FC] px-4 py-5 font-sans text-[#182026] sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-6xl flex-col rounded-[18px] border border-[#D8E4EF] bg-white shadow-[0_24px_70px_rgba(24,32,38,0.08)]">
        <header className="border-b border-[#E6EDF4] px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-[3px] border border-[#CFE0F1] bg-[#F7FBFF] px-2.5 py-1 text-xs font-semibold text-[#1473E6]">
                <ScanLine className="h-3.5 w-3.5" />
                Recovery audit running
              </div>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[0.95] tracking-tight text-[#182026] sm:text-6xl">
                Margin is checking where Amazon may owe money back.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#536171] sm:text-lg">
                Shipments, inventory events, settlement lines, support replies, and proof documents are being matched into recovery-ready findings.
              </p>
            </div>

            <div className="grid min-w-[230px] grid-cols-2 gap-2 rounded-[8px] border border-[#D8E4EF] bg-[#FBFDFF] p-3">
              <div className="rounded-[6px] bg-white p-3">
                <span className="text-[11px] font-semibold uppercase tracking-tight text-[#7A8897]">Potential value</span>
                <strong className="mt-1 block text-2xl font-semibold tracking-tight text-[#182026]">
                  ${totalExposure.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
              <div className="rounded-[6px] bg-white p-3">
                <span className="text-[11px] font-semibold uppercase tracking-tight text-[#7A8897]">Findings</span>
                <strong className="mt-1 block text-2xl font-semibold tracking-tight text-[#182026]">{auditLines.length}</strong>
              </div>
            </div>
          </div>
        </header>

        <div className="grid flex-1 lg:grid-cols-[1fr_320px]">
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-white to-transparent" />
            <ul className="relative">
              {auditLines.map((line, index) => (
                <AuditRow key={line.id} line={line} index={index} reduceMotion={reduceMotion} />
              ))}
            </ul>
          </div>

          <aside className="border-t border-[#E6EDF4] bg-[#FBFDFF] p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-[8px] border border-[#D8E4EF] bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[#EEF6FF] text-[#1473E6]">
                    <FileSearch className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-tight text-[#182026]">Audit scope</p>
                    <p className="text-xs text-[#6B7787]">Evidence and account movement</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm text-[#536171]">
                  <p>Inbound shipment shortages</p>
                  <p>Inventory adjustment gaps</p>
                  <p>Settlement mismatches</p>
                  <p>Amazon reply requirements</p>
                </div>
              </div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 5.4, duration: 0.45 }}
                className="rounded-[8px] border border-[#B8E1CE] bg-[#F3FCF7] p-4"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#128A55]" />
                  <div>
                    <p className="text-sm font-semibold tracking-tight text-[#0F5E3C]">Evidence map forming</p>
                    <p className="mt-1 text-sm leading-6 text-[#36624F]">
                      Findings are being grouped by case so the seller can see what is recoverable, what is missing, and what needs approval.
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="rounded-[8px] border border-[#F3D2A3] bg-[#FFF9EF] p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-[#C87900]" />
                  <div>
                    <p className="text-sm font-semibold tracking-tight text-[#7A4700]">Seller approval stays required</p>
                    <p className="mt-1 text-sm leading-6 text-[#795D35]">
                      Margin prepares the path. The seller decides what moves forward.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default AuditSimulate;
