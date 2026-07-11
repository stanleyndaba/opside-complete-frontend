import { motion, useReducedMotion } from 'framer-motion';

type Point = { x: number; y: number };

type Integration = {
  id: string;
  name: string;
  icon: string;
  evidence: string[];
  x: number;
  y: number;
  delay: number;
  laneX: number;
};

const marginNode: Point = { x: 22, y: 50 };
const intakePoint: Point = { x: 32, y: 50 };
const trunkX = 54;

const integrations: Integration[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    icon: '/amazon-logo-transparent-circle.png',
    evidence: ['Orders', 'Ledger', 'Shipment'],
    x: 70,
    y: 15,
    delay: 0.8,
    laneX: 58,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: '/gmailicon.png',
    evidence: ['Email', 'Invoice', 'POD'],
    x: 63,
    y: 28,
    delay: 1.05,
    laneX: 54,
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: '/gd.png',
    evidence: ['Manifest', 'Photo', 'PDF'],
    x: 85,
    y: 25,
    delay: 1.3,
    laneX: 62,
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '/slack-icon-2019.png',
    evidence: ['Message', 'Note', 'File'],
    x: 72,
    y: 45,
    delay: 1.55,
    laneX: 58,
  },
  {
    id: 'outlook',
    name: 'Outlook',
    icon: '/outlookicon.webp',
    evidence: ['Thread', 'BOL', 'Receipt'],
    x: 87,
    y: 50,
    delay: 1.8,
    laneX: 62,
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: '/Dropbox_Icon.svg.png',
    evidence: ['Archive', 'Scan', 'CSV'],
    x: 78,
    y: 67,
    delay: 2.05,
    laneX: 58,
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: '/onedriive.png',
    evidence: ['Report', 'Ledger', 'POD'],
    x: 91,
    y: 71,
    delay: 2.3,
    laneX: 62,
  },
  {
    id: 'adobe-sign',
    name: 'Adobe Sign',
    icon: '/dobe.png',
    evidence: ['Signature', 'Proof', 'PDF'],
    x: 66,
    y: 82,
    delay: 2.55,
    laneX: 54,
  },
];

function buildRoute(integration: Integration): Point[] {
  return [
    { x: integration.x, y: integration.y },
    { x: integration.laneX, y: integration.y },
    { x: integration.laneX, y: marginNode.y },
    intakePoint,
    marginNode,
  ];
}

function pathFrom(points: Point[]) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x * 10} ${point.y * 6.4}`).join(' ');
}

function SourceNode({ integration, reduceMotion }: { integration: Integration; reduceMotion: boolean }) {
  return (
    <div
      className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${integration.x}%`, top: `${integration.y}%` }}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: 28, scale: 0.92 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: reduceMotion ? 0 : integration.delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-1.5"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white/95 sm:h-14 sm:w-14">
          <img src={integration.icon} alt={integration.name} className="h-[62%] w-[62%] object-contain" />
        </div>
        <span className="hidden text-[9px] font-medium text-gray-500 sm:block">{integration.name}</span>
      </motion.div>
    </div>
  );
}

function EvidenceToken({
  integration,
  label,
  tokenIndex,
  reduceMotion,
}: {
  integration: Integration;
  label: string;
  tokenIndex: number;
  reduceMotion: boolean;
}) {
  if (reduceMotion) return null;

  const route = buildRoute(integration);
  const lastIndex = route.length - 1;

  return (
    <motion.div
      initial={{ left: `${integration.x}%`, top: `${integration.y}%`, opacity: 0, scale: 0.86 }}
      animate={{
        left: route.map((point) => `${point.x}%`),
        top: route.map((point) => `${point.y}%`),
        opacity: route.map((_, index) => (index === 0 || index === lastIndex ? 0 : 1)),
        scale: route.map((_, index) => (index >= lastIndex - 1 ? 0.72 : 1)),
      }}
      transition={{
        duration: 7.2,
        delay: integration.delay + 1.25 + tokenIndex * 0.78,
        times: route.map((_, index) => (index === lastIndex ? 1 : (index / (lastIndex - 1)) * 0.9)),
        ease: [0.4, 0, 0.2, 1],
      }}
      className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2 rounded-md border border-gray-300 bg-white px-2 py-1 text-[9px] font-medium text-[#242424]"
    >
      {label}
    </motion.div>
  );
}

const PlatformSimulate = () => {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const finalDelay = reduceMotion ? 0 : 11.2;

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white px-4 font-sans text-[#242424]"
      aria-label="Evidence sources orchestrated into one Margin intake"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage: 'radial-gradient(rgba(156,163,175,0.38) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <section className="relative h-[min(720px,100vh)] w-full max-w-6xl" aria-label="Platform source intake">
        <div className="absolute right-[13%] top-[9%] hidden text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 sm:block">
          Platform Sources
        </div>

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1000 640"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <motion.path
            d={pathFrom([
              { x: trunkX, y: 16 },
              { x: trunkX, y: 84 },
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

          {integrations.map((integration) => {
            const route = buildRoute(integration).slice(0, -1);

            return (
              <motion.path
                key={integration.id}
                d={pathFrom(route)}
                fill="none"
                initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.58 }}
                transition={{ delay: reduceMotion ? 0 : integration.delay + 0.45, duration: 1.05, ease: 'easeOut' }}
                stroke="#CBD5E1"
                strokeWidth="1"
              />
            );
          })}

          {[trunkX, integrations[0].laneX, integrations[2].laneX].map((x) => (
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

          <motion.div
            className="absolute -right-5 -top-5 z-[60]"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
            animate={{
              opacity: reduceMotion ? 1 : [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
              scale: reduceMotion ? 1 : [0.5, 1, 0.85, 1, 0.85, 1, 0.85, 1, 0.85, 1, 0.72],
            }}
            transition={{
              delay: reduceMotion ? 0 : 1.05,
              duration: finalDelay - 1.05,
              ease: 'easeInOut',
            }}
          >
            <div className="flex h-8 w-6 flex-col items-center justify-center rounded-[3px] bg-[#EA4335] shadow-sm sm:h-10 sm:w-8">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="mt-0.5 text-[5px] font-bold tracking-tight text-white sm:text-[6px]">PDF</span>
            </div>
          </motion.div>

          <motion.div
            className="absolute -bottom-5 -left-5 z-[60]"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
            animate={{
              opacity: reduceMotion ? 1 : [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
              scale: reduceMotion ? 1 : [0.5, 1, 0.85, 1, 0.85, 1, 0.85, 1, 0.85, 1, 0.72],
            }}
            transition={{
              delay: reduceMotion ? 0 : 1.25,
              duration: finalDelay - 1.25,
              ease: 'easeInOut',
            }}
          >
            <div className="flex h-8 w-6 flex-col items-center justify-center rounded-[3px] bg-[#4285F4] shadow-sm sm:h-10 sm:w-8">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span className="mt-0.5 text-[5px] font-bold tracking-tight text-white sm:text-[6px]">DOC</span>
            </div>
          </motion.div>
        </div>

        {integrations.map((integration) => (
          <SourceNode key={integration.id} integration={integration} reduceMotion={reduceMotion} />
        ))}

        {integrations.flatMap((integration) =>
          integration.evidence.map((label, tokenIndex) => (
            <EvidenceToken
              key={`${integration.id}-${label}-${tokenIndex}`}
              integration={integration}
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

export default PlatformSimulate;
