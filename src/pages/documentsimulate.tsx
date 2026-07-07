import { motion, useReducedMotion } from 'framer-motion';
import {
  Barcode,
  Briefcase,
  Calculator,
  DollarSign,
  FileText,
  Hash,
  ListChecks,
  PenLine,
  Truck,
  type LucideIcon,
} from 'lucide-react';

type Point = { x: number; y: number };

type EvidenceNode = {
  id: string;
  name: string;
  Icon: LucideIcon;
  evidence: string[];
  x: number;
  y: number;
  delay: number;
  laneX: number;
};

const marginNode: Point = { x: 22, y: 50 };
const intakePoint: Point = { x: 32, y: 50 };
const trunkX = 54;

const evidenceNodes: EvidenceNode[] = [
  {
    id: 'invoice',
    name: 'Invoice',
    Icon: FileText,
    evidence: ['Invoice', 'Supplier', '$12,400'],
    x: 68,
    y: 13,
    delay: 0.8,
    laneX: 56,
  },
  {
    id: 'shipment-id',
    name: 'Shipment ID',
    Icon: Hash,
    evidence: ['FBA15J2K', 'Inbound', 'FC log'],
    x: 86,
    y: 22,
    delay: 1.05,
    laneX: 62,
  },
  {
    id: 'asin-fnsku',
    name: 'ASIN / FNSKU',
    Icon: Barcode,
    evidence: ['ASIN', 'FNSKU', 'SKU map'],
    x: 72,
    y: 34,
    delay: 1.3,
    laneX: 58,
  },
  {
    id: 'quantity',
    name: 'Quantity',
    Icon: ListChecks,
    evidence: ['500 shipped', '462 received', '38 delta'],
    x: 90,
    y: 45,
    delay: 1.55,
    laneX: 62,
  },
  {
    id: 'bol',
    name: 'BOL',
    Icon: Truck,
    evidence: ['BOL', 'Carrier', 'Cartons'],
    x: 70,
    y: 57,
    delay: 1.8,
    laneX: 58,
  },
  {
    id: 'pod',
    name: 'POD',
    Icon: PenLine,
    evidence: ['POD', 'Signature', 'Timestamp'],
    x: 86,
    y: 67,
    delay: 2.05,
    laneX: 62,
  },
  {
    id: 'cost-basis',
    name: 'Cost Basis',
    Icon: Calculator,
    evidence: ['Unit cost', 'COGS', 'Variance'],
    x: 72,
    y: 79,
    delay: 2.3,
    laneX: 58,
  },
  {
    id: 'case',
    name: 'Case',
    Icon: Briefcase,
    evidence: ['Case #8821', 'Evidence pack', 'Ready'],
    x: 90,
    y: 86,
    delay: 2.55,
    laneX: 62,
  },
];

function buildRoute(node: EvidenceNode): Point[] {
  return [
    { x: node.x, y: node.y },
    { x: node.laneX, y: node.y },
    { x: node.laneX, y: marginNode.y },
    intakePoint,
    marginNode,
  ];
}

function pathFrom(points: Point[]) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x * 10} ${point.y * 6.4}`).join(' ');
}

function EvidenceSourceNode({ node, reduceMotion }: { node: EvidenceNode; reduceMotion: boolean }) {
  const Icon = node.Icon;

  return (
    <div
      className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: 28, scale: 0.92 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: reduceMotion ? 0 : node.delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-1.5"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white/95 sm:h-14 sm:w-14">
          <Icon className="h-[46%] w-[46%] text-[#242424]" strokeWidth={1.7} />
        </div>
        <span className="hidden text-[9px] font-medium text-gray-500 sm:block">{node.name}</span>
      </motion.div>
    </div>
  );
}

function EvidenceToken({
  node,
  label,
  tokenIndex,
  reduceMotion,
}: {
  node: EvidenceNode;
  label: string;
  tokenIndex: number;
  reduceMotion: boolean;
}) {
  if (reduceMotion) return null;

  const route = buildRoute(node);
  const lastIndex = route.length - 1;

  return (
    <motion.div
      initial={{ left: `${node.x}%`, top: `${node.y}%`, opacity: 0, scale: 0.86 }}
      animate={{
        left: route.map((point) => `${point.x}%`),
        top: route.map((point) => `${point.y}%`),
        opacity: route.map((_, index) => (index === 0 || index === lastIndex ? 0 : 1)),
        scale: route.map((_, index) => (index >= lastIndex - 1 ? 0.72 : 1)),
      }}
      transition={{
        duration: 7.2,
        delay: node.delay + 1.25 + tokenIndex * 0.78,
        times: route.map((_, index) => (index === lastIndex ? 1 : (index / (lastIndex - 1)) * 0.9)),
        ease: [0.4, 0, 0.2, 1],
      }}
      className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2 rounded-md border border-gray-300 bg-white px-2 py-1 text-[9px] font-medium text-[#242424]"
    >
      {label}
    </motion.div>
  );
}

const DocumentSimulate = () => {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const finalDelay = reduceMotion ? 0 : 11.2;

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white px-4 font-sans text-[#242424]"
      aria-label="Documents linked into one persistent Margin evidence graph"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage: 'radial-gradient(rgba(156,163,175,0.38) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <section className="relative h-[min(720px,100vh)] w-full max-w-6xl" aria-label="Evidence document graph">
        <div className="absolute right-[13%] top-[9%] hidden text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 sm:block">
          Evidence Graph
        </div>

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1000 640"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <motion.path
            d={pathFrom(evidenceNodes.map((node) => ({ x: node.x, y: node.y })))}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="1"
            strokeDasharray="4 8"
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ delay: reduceMotion ? 0 : 0.95, duration: 2.4, ease: 'easeOut' }}
          />
          <motion.path
            d={pathFrom([
              { x: trunkX, y: 13 },
              { x: trunkX, y: 87 },
            ])}
            fill="none"
            stroke="#D1D5DB"
            strokeWidth="1"
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.65 }}
            transition={{ delay: reduceMotion ? 0 : 2.85, duration: 1, ease: 'easeOut' }}
          />
          <motion.path
            d={pathFrom([{ x: trunkX, y: marginNode.y }, intakePoint, marginNode])}
            fill="none"
            stroke="#B8C0CC"
            strokeWidth="1.2"
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ delay: reduceMotion ? 0 : 3, duration: 0.9, ease: 'easeOut' }}
          />

          {evidenceNodes.map((node) => {
            const route = buildRoute(node).slice(0, -1);

            return (
              <motion.path
                key={node.id}
                d={pathFrom(route)}
                fill="none"
                initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.58 }}
                transition={{ delay: reduceMotion ? 0 : node.delay + 0.45, duration: 1.05, ease: 'easeOut' }}
                stroke="#CBD5E1"
                strokeWidth="1"
              />
            );
          })}

          {[trunkX, evidenceNodes[1].laneX, evidenceNodes[3].laneX].map((x) => (
            <circle key={x} cx={x * 10} cy={marginNode.y * 6.4} r="3.5" fill="white" stroke="#B8C0CC" strokeWidth="1" />
          ))}
          <circle cx={intakePoint.x * 10} cy={intakePoint.y * 6.4} r="4" fill="white" stroke="#9CA3AF" strokeWidth="1" />
        </svg>

        <div
          className="absolute z-50 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${marginNode.x}%`, top: `${marginNode.y}%` }}
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.84 }}
            animate={{
              opacity: 1,
              scale: reduceMotion ? 1 : [1, 1, 1.08, 1],
              borderColor: reduceMotion ? '#D1D5DB' : ['#D1D5DB', '#D1D5DB', '#3AAA78', '#D1D5DB'],
            }}
            transition={{
              opacity: { delay: reduceMotion ? 0 : 0.15, duration: 0.45, ease: 'easeOut' },
              scale: { delay: finalDelay, duration: 0.85 },
              borderColor: { delay: finalDelay, duration: 0.85 },
            }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl border bg-white/95 sm:h-24 sm:w-24"
          >
            <img src="/logoimagetwo.png" alt="Margin" className="h-7 w-auto object-contain sm:h-9" />
          </motion.div>
        </div>

        {evidenceNodes.map((node) => (
          <EvidenceSourceNode key={node.id} node={node} reduceMotion={reduceMotion} />
        ))}

        {evidenceNodes.flatMap((node) =>
          node.evidence.map((label, tokenIndex) => (
            <EvidenceToken
              key={`${node.id}-${label}-${tokenIndex}`}
              node={node}
              label={label}
              tokenIndex={tokenIndex}
              reduceMotion={reduceMotion}
            />
          )),
        )}
      </section>
    </main>
  );
};

export default DocumentSimulate;
