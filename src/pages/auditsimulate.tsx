import { motion, useReducedMotion } from 'framer-motion';

type AuditLine = {
  id: string;
  time: string;
  title: string;
  detail: string;
  amount: number;
  severity: 'priority' | 'review' | 'watch';
};

const auditLines: AuditLine[] = [
  {
    id: 'RFD-16874-INB',
    time: '00:03',
    title: 'Inbound shipment shortage detected',
    detail: 'Shipment record shows 36 units sent. Amazon receiving shows 32 units checked in.',
    amount: 184.72,
    severity: 'priority',
  },
  {
    id: 'RFD-16882-XFER',
    time: '00:07',
    title: 'Warehouse transfer loss surfaced',
    detail: 'Transfer movement closed without matching inventory arrival event at destination FC.',
    amount: 312.18,
    severity: 'priority',
  },
  {
    id: 'RFD-16865-DMG',
    time: '00:11',
    title: 'Damaged inventory gap found',
    detail: 'Inventory adjustment references damaged units, but no reimbursement was posted in settlements.',
    amount: 96.44,
    severity: 'review',
  },
  {
    id: 'RFD-16891-SET',
    time: '00:15',
    title: 'Settlement mismatch identified',
    detail: 'Approved reimbursement amount does not reconcile with the payout line on the seller ledger.',
    amount: 227.09,
    severity: 'review',
  },
  {
    id: 'RFD-16904-PRF',
    time: '00:19',
    title: 'Evidence gap before filing',
    detail: 'Invoice is available in Gmail, but shipment ID and SKU mapping still need to be attached.',
    amount: 418.6,
    severity: 'watch',
  },
  {
    id: 'RFD-16918-POD',
    time: '00:23',
    title: 'Carrier proof matched',
    detail: 'Signed delivery proof, BOL, and Amazon receiving event now point to the same case.',
    amount: 739.25,
    severity: 'priority',
  },
  {
    id: 'RFD-16922-FEE',
    time: '00:27',
    title: 'Fee recovery candidate queued',
    detail: 'Referral fee and FBA fee charges exceed the expected category and dimensional weight profile.',
    amount: 52.81,
    severity: 'watch',
  },
  {
    id: 'RFD-16939-APP',
    time: '00:31',
    title: 'Amazon reply requires action',
    detail: 'Support asked for supplier invoice and shipment proof. Margin found both in connected evidence.',
    amount: 301.76,
    severity: 'priority',
  },
];

const severityStyles = {
  priority: {
    label: 'Priority',
    marker: 'bg-[#7A2638]',
    text: 'text-[#F2C9D0]',
  },
  review: {
    label: 'Review',
    marker: 'bg-[#B58A32]',
    text: 'text-[#E9D3A0]',
  },
  watch: {
    label: 'Watch',
    marker: 'bg-[#66717D]',
    text: 'text-[#C2C9D0]',
  },
};

const totalExposure = auditLines.reduce((sum, line) => sum + line.amount, 0);
const auditFeed = [...auditLines, ...auditLines];

const formatExposure = (amount: number) =>
  `USD ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function AuditRow({
  line,
  index,
  reduceMotion,
}: {
  line: AuditLine;
  index: number;
  reduceMotion: boolean;
}) {
  const severity = severityStyles[line.severity];

  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: reduceMotion ? 0 : 0.14 + Math.min(index, auditLines.length - 1) * 0.14,
        duration: 0.44,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="grid border-b border-white/[0.08] px-5 py-4 sm:grid-cols-[72px_minmax(0,1fr)_150px] sm:px-8"
    >
      <div className="font-mono text-[11px] font-medium text-[#8B96A1] sm:pt-1">
        {line.time}
      </div>

      <div className="relative min-w-0 sm:border-l sm:border-white/[0.1] sm:pl-7">
        <span className={`absolute -left-[4.5px] top-1.5 hidden h-2 w-2 ${severity.marker} sm:block`} />
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-tight">
          <span className="text-[#AAB3BD]">{line.id}</span>
          <span className={severity.text}>{severity.label}</span>
        </div>
        <h2
          className="mt-1.5 text-[18px] font-semibold leading-tight tracking-[-0.02em] text-[#F7F4EE] sm:text-[20px]"
          style={{ fontFamily: 'Georgia, Merriweather, serif' }}
        >
          {line.title}
        </h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[#A5AFB8] sm:text-[14px]">
          {line.detail}
        </p>
      </div>

      <div className="mt-3 border-t border-white/[0.08] pt-3 sm:mt-0 sm:border-t-0 sm:pt-1 sm:text-right">
        <span className="font-mono text-[10px] uppercase tracking-tight text-[#8B96A1]">
          Exposure
        </span>
        <strong className="mt-1 block font-mono text-[14px] font-medium tracking-tight text-[#F7F4EE]">
          {formatExposure(line.amount)}
        </strong>
      </div>
    </motion.li>
  );
}

const AuditSimulate = () => {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const visibleFeed = reduceMotion ? auditLines : auditFeed;

  return (
    <main className="h-screen overflow-hidden bg-[#07111D] p-3 text-[#F7F4EE] sm:p-6">
      <section className="mx-auto grid h-full w-full max-w-7xl grid-rows-[auto_minmax(0,1fr)] border border-white/[0.12] bg-[#0A1422]">
        <header className="border-b border-white/[0.1] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div>
              <div className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#9CA7B3]">
                Amazon recovery evaluation
              </div>
              <h1
                className="mt-3 max-w-4xl text-[38px] font-semibold leading-[0.96] tracking-[-0.045em] text-[#F7F4EE] sm:text-[54px] lg:text-[68px]"
                style={{ fontFamily: 'Georgia, Merriweather, serif' }}
              >
                Recovery audit running
              </h1>
              <p className="mt-4 max-w-2xl text-[14px] leading-7 text-[#A5AFB8] sm:text-[15px]">
                Shipments, inventory events, settlement lines, support replies, and proof documents are being matched into recovery-ready findings.
              </p>
            </div>

            <div className="grid grid-cols-2 border border-white/[0.1] bg-white/[0.035]">
              <div className="border-r border-white/[0.1] p-4 sm:p-5">
                <span className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#8B96A1]">
                  Scope value
                </span>
                <strong className="mt-2 block font-mono text-[18px] font-medium tracking-[-0.03em] text-[#F7F4EE] sm:text-[21px]">
                  {formatExposure(totalExposure)}
                </strong>
              </div>
              <div className="p-4 sm:p-5">
                <span className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#8B96A1]">
                  Scope
                </span>
                <strong className="mt-2 block font-mono text-[18px] font-medium tracking-[-0.03em] text-[#F7F4EE] sm:text-[21px]">
                  {auditLines.length}
                </strong>
              </div>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-[#0A1422] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-[#0A1422] to-transparent" />
            <motion.ol
              className="relative"
              animate={reduceMotion ? undefined : { y: ['0%', '-50%'] }}
              transition={reduceMotion ? undefined : { duration: 24, ease: 'linear', repeat: Infinity }}
            >
              {visibleFeed.map((line, index) => (
                <AuditRow
                  key={`${line.id}-${index}`}
                  line={line}
                  index={index}
                  reduceMotion={reduceMotion}
                />
              ))}
            </motion.ol>
          </div>

          <aside className="border-t border-white/[0.1] bg-[#08111D] px-5 py-6 sm:px-7 lg:border-l lg:border-t-0">
            <div className="space-y-8">
              <div>
                <div className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#8B96A1]">
                  Audit scope
                </div>
                <h2
                  className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.035em] text-[#F7F4EE]"
                  style={{ fontFamily: 'Georgia, Merriweather, serif' }}
                >
                  Evidence and account movement
                </h2>
              </div>

              <div className="border-y border-white/[0.1] py-5">
                <div className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#8B96A1]">
                  Findings
                </div>
                <ul className="mt-4 space-y-3 text-[14px] leading-6 text-[#C2C9D0]">
                  <li>Inbound shipment shortages</li>
                  <li>Inventory adjustment gaps</li>
                  <li>Settlement mismatches</li>
                  <li>Amazon reply requirements</li>
                </ul>
              </div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 3.2, duration: 0.45 }}
                className="bg-[#10201A] p-5"
              >
                <div className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#7FAC95]">
                  Status: Evidence map forming
                </div>
                <p className="mt-3 text-[14px] leading-6 text-[#C7D8D0]">
                  Findings are being grouped by case so the seller can see what is recoverable, what is missing, and what needs approval.
                </p>
              </motion.div>

              <div className="border-l-2 border-[#B58A32] pl-4">
                <div className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#D7BE82]">
                  Seller approval stays required
                </div>
                <p className="mt-3 text-[14px] leading-6 text-[#C2C9D0]">
                  Margin prepares the path. The seller decides what moves.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default AuditSimulate;
