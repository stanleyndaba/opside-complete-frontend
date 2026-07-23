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
    marker: 'bg-[#0B74DE]',
    text: 'text-[#0B74DE]',
  },
  review: {
    label: 'Review',
    marker: 'bg-[#2E7D5B]',
    text: 'text-[#2E7D5B]',
  },
  watch: {
    label: 'Watch',
    marker: 'bg-[#8A99A4]',
    text: 'text-[#66737F]',
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
      className="grid border-b border-[#DCE8EE] px-4 py-2.5 sm:grid-cols-[58px_minmax(0,1fr)_128px] sm:px-5"
    >
      <div className="font-mono text-[10px] font-medium text-[#8A99A4] sm:pt-1">
        {line.time}
      </div>

      <div className="relative min-w-0 sm:border-l sm:border-[#DCE8EE] sm:pl-5">
        <span className={`absolute -left-[4.5px] top-1.5 hidden h-2 w-2 ${severity.marker} sm:block`} />
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-tight">
          <span className="text-[#66737F]">{line.id}</span>
          <span className={severity.text}>{severity.label}</span>
        </div>
        <h2
          className="mt-0.5 text-[15px] font-semibold leading-tight tracking-[-0.02em] text-[#182026] sm:text-[16px]"
          style={{ fontFamily: 'Georgia, Merriweather, serif' }}
        >
          {line.title}
        </h2>
        <p className="mt-0.5 max-w-3xl text-[12px] leading-[1.45] text-[#4D5B66]">
          {line.detail}
        </p>
      </div>

      <div className="mt-2 border-t border-[#DCE8EE] pt-2 sm:mt-0 sm:border-t-0 sm:pt-0.5 sm:text-right">
        <span className="font-mono text-[10px] uppercase tracking-tight text-[#8A99A4]">
          Exposure
        </span>
        <strong className="mt-1 block font-mono text-[13px] font-medium tracking-tight text-[#182026]">
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
    <main className="flex h-screen items-center justify-center overflow-hidden bg-[#FAFAF7] p-2 text-[#182026] selection:bg-[#0B74DE]/16 sm:p-3">
      <section className="mx-auto grid h-[calc(100vh-96px)] max-h-[540px] min-h-[430px] w-full max-w-7xl grid-rows-[auto_minmax(0,1fr)] border border-[#CFE0EA] bg-white">
        <header className="border-b border-[#DCE8EE] px-4 py-3 sm:px-6 lg:px-7 lg:py-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <div className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#0B74DE]">
                Amazon recovery evaluation
              </div>
              <h1
                className="mt-1.5 max-w-4xl text-[24px] font-semibold leading-[0.96] tracking-[-0.045em] text-[#182026] sm:text-[30px] lg:text-[34px]"
                style={{ fontFamily: 'Georgia, Merriweather, serif' }}
              >
                Recovery audit running
              </h1>
              <p className="mt-2 max-w-2xl text-[12px] leading-5 text-[#4D5B66] sm:text-[13px]">
                Shipments, inventory events, settlement lines, support replies, and proof documents are being matched into recovery-ready findings.
              </p>
            </div>

            <div className="grid grid-cols-2 border border-[#DCE8EE] bg-[#F8FAFC]">
              <div className="flex min-h-[44px] flex-col justify-center border-r border-[#DCE8EE] px-3 py-1.5">
                <span className="font-mono text-[9px] font-medium uppercase tracking-tight text-[#66737F]">
                  Scope value
                </span>
                <strong className="mt-0.5 block font-mono text-[13px] font-medium tracking-[-0.03em] text-[#182026]">
                  {formatExposure(totalExposure)}
                </strong>
              </div>
              <div className="flex min-h-[44px] flex-col justify-center px-3 py-1.5">
                <span className="font-mono text-[9px] font-medium uppercase tracking-tight text-[#66737F]">
                  Scope
                </span>
                <strong className="mt-0.5 block font-mono text-[13px] font-medium tracking-[-0.03em] text-[#182026]">
                  {auditLines.length}
                </strong>
              </div>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-white to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-white to-transparent" />
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

          <aside className="border-t border-[#DCE8EE] bg-[#F8FAFC] px-4 py-4 sm:px-5 lg:border-l lg:border-t-0">
            <div className="space-y-4">
              <div>
                <div className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#0B74DE]">
                  Audit scope
                </div>
                <h2
                  className="mt-1 text-[16px] font-semibold leading-tight tracking-[-0.035em] text-[#182026]"
                  style={{ fontFamily: 'Georgia, Merriweather, serif' }}
                >
                  Evidence and account movement
                </h2>
              </div>

              <div className="border-y border-[#DCE8EE] py-3">
                <div className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#66737F]">
                  Findings
                </div>
                <ul className="mt-2 space-y-1.5 text-[12px] leading-5 text-[#25313A]">
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
                className="border border-[#DCE8EE] bg-white p-3"
              >
                <div className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#2E7D5B]">
                  Status: Evidence map forming
                </div>
                <p className="mt-1.5 text-[12px] leading-[1.45] text-[#4D5B66]">
                  Findings are being grouped by case so the seller can see what is recoverable, what is missing, and what needs approval.
                </p>
              </motion.div>

              <div className="border-l-2 border-[#0B74DE] pl-3">
                <div className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#0B74DE]">
                  Seller approval stays required
                </div>
                <p className="mt-1.5 text-[12px] leading-[1.45] text-[#4D5B66]">
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
