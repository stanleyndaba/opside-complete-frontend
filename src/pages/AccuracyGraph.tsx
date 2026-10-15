import React from 'react';
import { motion } from 'framer-motion';

type DocumentReferenceProps = { name: string; source: string; icon: string };

function DocumentReference({ name, source, icon }: DocumentReferenceProps) {
  return (
    <span className="mx-1 inline-flex max-w-full translate-y-[0.12em] items-center gap-1.5 rounded-[4px] bg-[#F1F3F4] px-2 py-1 align-baseline text-[11px] leading-4 tracking-[-0.01em] text-[#3B4650]" title={`${source}: ${name}`}>
      <img src={icon} alt={source} className="h-4 w-4 shrink-0 object-contain" />
      <span className="font-semibold">{name}</span>
    </span>
  );
}

const AccuracyGraph = () => {
  const dataPoints = [
    { cases: 0, accuracy: 58 },
    { cases: 100, accuracy: 67 },
    { cases: 250, accuracy: 74 },
    { cases: 500, accuracy: 82 },
    { cases: 1000, accuracy: 88 },
    { cases: 2500, accuracy: 93 },
    { cases: 5000, accuracy: 96 },
  ];

  const width = 800;
  const height = 230;
  const padding = 40;

  const xScale = (cases: number) => (cases / 5000) * (width - 2 * padding) + padding;
  const yScale = (accuracy: number) => height - padding - ((accuracy - 50) / 50) * (height - 2 * padding);

  const pathData = dataPoints.reduce((acc, point, i) => {
    const x = xScale(point.cases);
    const y = yScale(point.accuracy);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  return (
    <main className="min-h-screen w-full overflow-auto bg-white p-2 font-google-sans text-[#182026] selection:bg-[#0B74DE]/16 sm:p-3">
      <section className="mx-auto flex h-[calc(100dvh-104px)] max-h-[500px] w-full max-w-5xl flex-col overflow-visible border-0 bg-white">

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_300px]">
          <div className="relative flex min-h-0 flex-col bg-white px-4 py-4">
            <div className="relative h-[230px] min-h-[230px] flex-none sm:h-[260px] sm:min-h-[260px] lg:h-auto lg:min-h-0 lg:flex-1">
          <svg 
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${width} ${height}`} 
            className="overflow-visible"
          >
            {/* Horizontal Grid Lines (The Benchmarks) */}
            {[60, 70, 80, 90, 100].map((level) => (
              <g key={level}>
                <line
                  x1={padding}
                  y1={yScale(level)}
                  x2={width - padding}
                  y2={yScale(level)}
                  stroke="rgba(0,0,0,0.05)"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={yScale(level)}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  className="fill-[#8A99A4] text-[9px] font-mono font-medium"
                >
                  {level}%
                </text>
              </g>
            ))}

            {/* X-Axis Labels (Operational Memory) */}
            {[0, 1000, 2000, 3000, 4000, 5000].map((val) => (
              <text
                key={val}
                x={xScale(val)}
                y={height - padding + 18}
                textAnchor="middle"
                className="fill-[#8A99A4] text-[9px] font-mono font-medium"
              >
                {val === 0 ? '0' : `${val / 1000}k`}
              </text>
            ))}

            {/* The Learning Path — thin charcoal line */}
            <motion.path
              d={pathData}
              fill="none"
              stroke="#182026"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
            />

            {/* Area Fill (The Intelligence Volume) */}
            <motion.path
              d={`${pathData} L ${xScale(5000)} ${height - padding} L ${padding} ${height - padding} Z`}
              fill="rgba(11,116,222,0.035)"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.5, duration: 1 }}
            />

            {/* Accuracy Nodes + Percentage Labels */}
            {dataPoints.map((point, i) => {
              const cx = xScale(point.cases);
              const cy = yScale(point.accuracy);
              return (
                <g key={i}>
                  {/* Solid dot — no outer border */}
                  <motion.circle
                    cx={cx}
                    cy={cy}
                    r="3.5"
                    fill="#182026"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 + 0.5, duration: 0.4 }}
                  />
                  {/* Percentage label — tight to the dot */}
                  <motion.text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    className="fill-[#182026] text-[10px] font-mono font-semibold tracking-tight"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 + 0.7, duration: 0.3 }}
                  >
                    {point.accuracy}%
                  </motion.text>
                </g>
              );
            })}
          </svg>

          </div>
          </div>

        </div>
      </section>

      <section className="mx-auto mt-6 max-w-5xl bg-white px-5 py-6 font-google-sans text-[15px] leading-7 tracking-[-0.012em] text-[#595E68] sm:px-8">
        <p>
          Margin learned from this recovery that a winning position depends on a connected evidence trail, not a single promising signal. The operational, inventory, settlement, and ledger records established how the affected populations relate, while <mark className="rounded-[2px] bg-[#DDEBFF] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">accepted evidence relationships</mark> made the recovery position traceable. <DocumentReference icon="/amazon-logo-transparent-circle.png" source="Amazon" name="Amazon Fulfilment Network Inventory Adjustment and Disposition Ledger" /> <DocumentReference icon="/Dropbox_Icon.svg.png" source="Dropbox" name="Seller Evidence Intake and Shipment Support Folder" /> <DocumentReference icon="/onedrive-icon.png" source="OneDrive" name="Settlement Period Reconciliation and Clearing Workbook" /> Next time, Margin will look for the same connected pattern earlier, compare expected activity with actual records, and separate a meaningful delta from activity already accounted for. <DocumentReference icon="/excel-icon-margin.png" source="Excel" name="FBA Inbound Receiving Variance and Shipment Reconciliation Schedule" /> <DocumentReference icon="/Dropbox_Icon.svg.png" source="Dropbox" name="Inventory Custody and Valuation Evidence Register" /> <DocumentReference icon="/onedrive-icon.png" source="OneDrive" name="Returns and Reimbursement Exception Register" /> The recovery is solid when the amount is bounded, the evidence supports the financial difference, and the unresolved position remains visible rather than being presented as recovered. <DocumentReference icon="/gd.png" source="Google Drive" name="Amazon Settlement Transaction Detail and Reimbursement Clearing Extract" /> Margin will apply this learning to future evidence packs by prioritising matching records, confirming settlement outcomes, and preserving the difference between expected, accepted, cleared, and unresolved activity. <DocumentReference icon="/Dropbox_Icon.svg.png" source="Dropbox" name="Enterprise Accounts Payable Invoice and Cost-Basis Support Register" /> Shipment and receiving deltas will be tested against the operating population. <DocumentReference icon="/onedrive-icon.png" source="OneDrive" name="Inventory Ledger Adjustment, Valuation, and Custody Reconciliation Workbook" /> Inventory and settlement movement will remain connected to the recovery conclusion, while exceptions and ledger gaps remain explicit. Future recoveries can therefore move faster without weakening the evidence boundary that makes the position supportable. Accepted records will be compared against the expected operating path before a recovery is prepared. Known outcomes will strengthen future scoring, while missing, contradictory, or settlement-pending evidence will remain visible as a boundary. Margin will carry forward the accepted document relationships, the confirmed delta, the recovery scope, and the conditions that made the conclusion defensible. The objective is to produce clearer evidence packs, stronger decisions, faster preparation, and a reliable route from review to verified recovery, consistently and transparently, fully.
        </p>
        <section aria-label="Progressive recovery stance" className="mt-8 border-t border-[#E8E7E1] pt-5">
          <p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]">Progressive recovery stance</p>
          <div className="mt-3 space-y-2.5 text-[14px] leading-6 text-[#595E68]">
            {[
              'Recovery pattern learned',
              'Accepted evidence relationships recorded',
              'Expected-versus-actual delta confirmed',
              'Supported recovery basis established',
              'Unresolved positions preserved',
              'Future recovery control updated',
            ].map((statement) => <div key={statement} className="flex items-center gap-2.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#26734D] text-[12px] font-bold leading-none text-white" aria-hidden="true">✓</span><span>{statement}</span></div>)}
          </div>
        </section>
      </section>
    </main>
  );
};

export default AccuracyGraph;
