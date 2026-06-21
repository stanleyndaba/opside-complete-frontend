import { motion, useReducedMotion } from 'framer-motion';

type Integration = {
  id: string;
  name: string;
  icon: string;
  evidence: string[];
  x: number;
  y: number;
  delay: number;
  route: Array<{ x: number; y: number }>;
};

const center = { x: 50, y: 47 };

const integrations: Integration[] = [
  {
    id: 'amazon', name: 'Amazon', icon: '/amazon-logo-transparent-circle.png', evidence: ['CSV', 'Shipment', 'Ledger'], x: 50, y: 10, delay: 0.2,
    route: [{ x: 50, y: 10 }, { x: 50, y: 22 }, center],
  },
  {
    id: 'gmail', name: 'Gmail', icon: '/gmailicon.png', evidence: ['Invoice', 'Email', 'Attachment'], x: 16, y: 29, delay: 0.65,
    route: [{ x: 16, y: 29 }, { x: 23, y: 29 }, { x: 23, y: 47 }, center],
  },
  {
    id: 'outlook', name: 'Outlook', icon: '/outlookicon.webp', evidence: ['BOL', 'Thread', 'Receipt'], x: 16, y: 59, delay: 1.1,
    route: [{ x: 16, y: 59 }, { x: 23, y: 59 }, { x: 23, y: 47 }, center],
  },
  {
    id: 'gdrive', name: 'Google Drive', icon: '/gd.png', evidence: ['POD', 'Photo', 'Manifest'], x: 84, y: 24, delay: 1.55,
    route: [{ x: 84, y: 24 }, { x: 77, y: 24 }, { x: 77, y: 47 }, center],
  },
  {
    id: 'dropbox', name: 'Dropbox', icon: '/Dropbox_Icon.svg.png', evidence: ['Photo', 'Scan', 'Archive'], x: 84, y: 47, delay: 2,
    route: [{ x: 84, y: 47 }, { x: 77, y: 47 }, center],
  },
  {
    id: 'onedrive', name: 'OneDrive', icon: '/onedriive.png', evidence: ['Ledger', 'Report', 'CSV'], x: 84, y: 68, delay: 2.45,
    route: [{ x: 84, y: 68 }, { x: 77, y: 68 }, { x: 77, y: 47 }, center],
  },
  {
    id: 'slack', name: 'Slack', icon: '/slack-icon-2019.png', evidence: ['Message', 'Note', 'File'], x: 34, y: 86, delay: 2.9,
    route: [{ x: 34, y: 86 }, { x: 34, y: 72 }, { x: 50, y: 72 }, center],
  },
  {
    id: 'adobe-sign', name: 'Adobe Sign', icon: '/dobe.png', evidence: ['Signature', 'POD', 'PDF'], x: 66, y: 86, delay: 3.35,
    route: [{ x: 66, y: 86 }, { x: 66, y: 72 }, { x: 50, y: 72 }, center],
  },
];

function SourceNode({ integration, reduceMotion }: { integration: Integration; reduceMotion: boolean }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.82, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : integration.delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
      style={{ left: `${integration.x}%`, top: `${integration.y}%` }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white sm:h-14 sm:w-14">
        <img src={integration.icon} alt={integration.name} className="h-[62%] w-[62%] object-contain" />
      </div>
      <span className="hidden text-[9px] font-medium text-gray-500 sm:block">{integration.name}</span>
    </motion.div>
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

  const travelRoute = [...integration.route, center];
  const lastIndex = travelRoute.length - 1;

  return (
    <motion.div
      initial={{ left: `${integration.x}%`, top: `${integration.y}%`, opacity: 0, scale: 0.85 }}
      animate={{
        left: travelRoute.map((point) => `${point.x}%`),
        top: travelRoute.map((point) => `${point.y}%`),
        opacity: travelRoute.map((_, index) => index === 0 || index === lastIndex ? 0 : 1),
        scale: travelRoute.map((_, index) => index >= lastIndex - 1 ? 0.78 : 1),
      }}
      transition={{
        duration: 6.6,
        delay: integration.delay + 0.6 + tokenIndex * 0.6,
        times: travelRoute.map((_, index) => index === lastIndex ? 1 : (index / (lastIndex - 1)) * 0.88),
        ease: [0.4, 0, 0.2, 1],
      }}
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-md border border-gray-300 bg-white px-2 py-1 text-[9px] font-semibold text-[#242424]"
    >
      {label}
    </motion.div>
  );
}

const PlatformSimulate = () => {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const finalDelay = reduceMotion ? 0 : 12;

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white px-4 font-sans text-[#242424]"
      aria-label="Evidence sources orchestrated into one case-ready bundle"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'radial-gradient(rgba(156,163,175,0.42) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <section className="relative h-[min(720px,100vh)] w-full max-w-6xl" aria-label="Evidence orchestra">
        <div className="absolute left-[8%] top-[17%] hidden text-[10px] font-medium text-gray-400 sm:block">Email</div>
        <div className="absolute right-[8%] top-[15%] hidden text-[10px] font-medium text-gray-400 sm:block">Storage</div>
        <div className="absolute bottom-[3%] left-1/2 hidden -translate-x-1/2 text-[10px] font-medium text-gray-400 sm:block">Collaboration</div>
        <div className="absolute left-1/2 top-[2%] hidden -translate-x-1/2 text-[10px] font-medium text-gray-400 sm:block">Commerce</div>

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1000 640"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <motion.rect
            x="230"
            y="141"
            width="540"
            height="320"
            rx="10"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="1"
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {integrations.map((integration) => (
            <motion.path
              key={integration.id}
              d={integration.route.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x * 10} ${point.y * 6.4}`).join(' ')}
              fill="none"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: reduceMotion ? 0.45 : [0, 0.35, 0.55] }}
              transition={{ delay: reduceMotion ? 0 : integration.delay + 0.25, duration: 0.9, ease: 'easeOut' }}
              stroke="#9CA3AF"
              strokeWidth="1"
            />
          ))}

          {[
            { x: 500, y: 141 },
            { x: 230, y: 301 },
            { x: 770, y: 301 },
            { x: 500, y: 461 },
          ].map((point) => (
            <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="4" fill="white" stroke="#9CA3AF" strokeWidth="1" />
          ))}
        </svg>

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

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
          animate={{
            opacity: 1,
            scale: reduceMotion ? 1 : [1, 1, 1.08, 1],
            borderColor: reduceMotion ? '#D1D5DB' : ['#D1D5DB', '#D1D5DB', '#3AAA78', '#D1D5DB'],
          }}
          transition={{
            opacity: { duration: 0.4 },
            scale: { delay: finalDelay, duration: 0.85 },
            borderColor: { delay: finalDelay, duration: 0.85 },
          }}
          className="absolute z-40 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border bg-white sm:h-24 sm:w-24"
          style={{ left: `${center.x}%`, top: `${center.y}%` }}
        >
          <img src="/logoimagetwo.png" alt="Margin" className="h-7 w-auto object-contain sm:h-9" />
        </motion.div>

      </section>
    </main>
  );
};

export default PlatformSimulate;
