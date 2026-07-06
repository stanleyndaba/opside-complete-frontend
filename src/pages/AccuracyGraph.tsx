import React from 'react';
import { motion } from 'framer-motion';

const AccuracyGraph = () => {
  // The Simulated Learning Data
  const dataPoints = [
    { cases: 0, accuracy: 58 },
    { cases: 100, accuracy: 67 },
    { cases: 250, accuracy: 74 },
    { cases: 500, accuracy: 82 },
    { cases: 1000, accuracy: 88 },
    { cases: 2500, accuracy: 93 },
    { cases: 5000, accuracy: 96 },
  ];

  // SVG dimensions & padding — compact height
  const width = 800;
  const height = 200;
  const padding = 40;

  // Scale functions to map data to SVG coordinates
  const xScale = (cases: number) => (cases / 5000) * (width - 2 * padding) + padding;
  const yScale = (accuracy: number) => height - padding - ((accuracy - 50) / 50) * (height - 2 * padding);

  // Generate the SVG Path string (straight lines)
  const pathData = dataPoints.reduce((acc, point, i) => {
    const x = xScale(point.cases);
    const y = yScale(point.accuracy);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  return (
    <section className="bg-white py-16 px-6 border-t border-gray-100">
      <div className="max-w-5xl mx-auto">
        
        {/* Institutional Heading — centered, compact */}
        <div className="mb-10 text-center">
          <h2 className="text-xl font-serif font-bold text-gray-900 mb-3 tracking-tight sm:text-2xl">
            Evidence Intelligence Accuracy Over Time
          </h2>
          <p className="text-gray-500 italic text-sm max-w-2xl mx-auto leading-relaxed">
            Margin learns from every approved, rejected, underpaid, and reversed claim to improve how it scores future evidence packs before filing.
          </p>
        </div>

        {/* The Simulation Canvas — compact */}
        <div className="relative bg-[#FAFAFA] rounded-xl border border-gray-100 p-5 md:p-8 shadow-sm">
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
                  className="fill-gray-400 text-[9px] font-mono font-medium"
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
                className="fill-gray-400 text-[9px] font-mono font-medium"
              >
                {val === 0 ? '0' : `${val / 1000}k`}
              </text>
            ))}

            {/* The Learning Path — thin charcoal line */}
            <motion.path
              d={pathData}
              fill="none"
              stroke="#1A1A1A"
              strokeWidth="1.5"
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
              fill="rgba(0,0,0,0.03)"
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
                    fill="#1A1A1A"
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
                    className="fill-[#1A1A1A] text-[10px] font-mono font-semibold tracking-tight"
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

          {/* Axis Labels — tracking-tight, darker */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-tight text-gray-500 font-mono font-bold">
            Resolved recovery cases learned from
          </div>
        </div>

        {/* Technical Footer */}
        <div className="mt-8 flex justify-between items-center border-t border-gray-100 pt-6">
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 font-mono uppercase tracking-tight">Current Learning State</span>
              <span className="text-sm font-bold text-gray-900">High-Velocity Synthesis</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 font-mono uppercase tracking-tight">Model Integrity</span>
              <span className="text-sm font-bold text-gray-900">99.4% Verified</span>
            </div>
          </div>
          <div className="text-[10px] text-gray-500 font-mono tracking-tight">
            Operational memory
          </div>
        </div>
      </div>
    </section>
  );
};

export default AccuracyGraph;
