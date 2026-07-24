import React from 'react';
import { motion } from 'framer-motion';

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
    <main className="flex h-[100dvh] items-center justify-center overflow-hidden bg-[#FAFAF7] p-2 font-sans text-[#182026] selection:bg-[#0B74DE]/16 sm:p-3">
      <section className="flex h-[calc(100dvh-104px)] max-h-[500px] w-full max-w-5xl flex-col overflow-hidden border border-[#CFE0EA] bg-white">
        <header className="flex shrink-0 items-start justify-between border-b border-[#DCE8EE] bg-white px-4 py-3">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#0B74DE]">Outcome intelligence</p>
            <h1
              className="mt-1 text-[20px] font-semibold leading-tight tracking-[-0.04em] text-[#182026]"
              style={{ fontFamily: 'Georgia, Merriweather, serif' }}
            >
              Evidence Calibration
            </h1>
            <p className="mt-1 max-w-xl text-[12px] leading-5 text-[#66737F]">
              Margin learns from approved, rejected, underpaid, and reversed outcomes to improve how future evidence packs are scored before filing.
            </p>
          </div>
          <div className="hidden min-w-[290px] grid-cols-2 border border-[#DCE8EE] text-left sm:grid">
            <div className="border-r border-[#DCE8EE] px-4 py-3">
              <span className="font-mono text-[9px] font-medium uppercase tracking-tight text-[#8A99A4]">Resolved cases</span>
              <p className="mt-1 font-mono text-sm text-[#182026]">5,000</p>
            </div>
            <div className="px-4 py-3">
              <span className="font-mono text-[9px] font-medium uppercase tracking-tight text-[#8A99A4]">Current score</span>
              <p className="mt-1 font-mono text-sm text-[#182026]">96%</p>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_300px]">
          <div className="relative flex min-h-0 flex-col bg-white px-4 py-4">
            <div className="mb-3 flex items-center justify-between border-b border-[#DCE8EE] pb-2">
              <span className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Evidence scoring curve</span>
              <span className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#2F8A62]">Outcome verified</span>
            </div>
            <div className="relative min-h-0 flex-1">
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

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[9px] font-medium uppercase tracking-tight text-[#66737F]">
            Resolved recovery cases learned from
          </div>
          </div>
          </div>

          <aside className="border-l border-[#DCE8EE] bg-[#F8FAFC] p-4">
            <p className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#0B74DE]">Accuracy inputs</p>
            <h2
              className="mt-2 text-[18px] font-semibold leading-tight tracking-[-0.04em] text-[#182026]"
              style={{ fontFamily: 'Georgia, Merriweather, serif' }}
            >
              Outcome patterns
            </h2>
            <div className="mt-4 border-y border-[#DCE8EE] py-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Signals learned</p>
              <ul className="mt-3 space-y-2 text-[12px] leading-5 text-[#33404A]">
                <li>Claim category</li>
                <li>Evidence type accepted</li>
                <li>Amazon response path</li>
                <li>Payout reconciliation result</li>
              </ul>
            </div>
            <div className="mt-4 border border-[#DCE8EE] bg-white p-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#2F8A62]">Recovery intelligence updated</p>
              <p className="mt-2 text-[12px] leading-5 text-[#4D5B66]">
                Future cases are scored against anonymized outcome patterns, not another seller's private records.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default AccuracyGraph;
