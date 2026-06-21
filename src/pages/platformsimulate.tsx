import { motion, useReducedMotion } from 'framer-motion';

type Integration = {
  id: string;
  name: string;
  icon: string;
  evidence: string;
  x: number;
  y: number;
  delay: number;
};

const integrations: Integration[] = [
  { id: 'amazon', name: 'Amazon', icon: '/amazon-logo-transparent-circle.png', evidence: 'CSV', x: 50, y: 10, delay: 0.2 },
  { id: 'gmail', name: 'Gmail', icon: '/gmailicon.png', evidence: 'Invoice', x: 11, y: 31, delay: 0.65 },
  { id: 'outlook', name: 'Outlook', icon: '/outlookicon.webp', evidence: 'BOL', x: 10, y: 62, delay: 1.1 },
  { id: 'gdrive', name: 'Google Drive', icon: '/gd.png', evidence: 'POD', x: 89, y: 27, delay: 1.55 },
  { id: 'dropbox', name: 'Dropbox', icon: '/Dropbox_Icon.svg.png', evidence: 'Photo', x: 92, y: 52, delay: 2 },
  { id: 'onedrive', name: 'OneDrive', icon: '/onedriive.png', evidence: 'Ledger', x: 85, y: 75, delay: 2.45 },
  { id: 'slack', name: 'Slack', icon: '/slack-icon-2019.png', evidence: 'Message', x: 30, y: 88, delay: 2.9 },
  { id: 'adobe-sign', name: 'Adobe Sign', icon: '/dobe.png', evidence: 'Signature', x: 69, y: 88, delay: 3.35 },
];

const evidenceBundle = ['POD', 'BOL', 'Invoice', 'CSV', 'Signature'];
const center = { x: 50, y: 46 };

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

function EvidenceToken({ integration, reduceMotion }: { integration: Integration; reduceMotion: boolean }) {
  if (reduceMotion) return null;

  return (
    <motion.div
      initial={{ left: `${integration.x}%`, top: `${integration.y}%`, opacity: 0, scale: 0.85 }}
      animate={{
        left: [`${integration.x}%`, `${integration.x}%`, `${center.x}%`],
        top: [`${integration.y}%`, `${integration.y}%`, `${center.y}%`],
        opacity: [0, 1, 0],
        scale: [0.85, 1, 0.72],
      }}
      transition={{
        duration: 1.35,
        delay: integration.delay + 0.6,
        times: [0, 0.18, 1],
        ease: [0.4, 0, 0.2, 1],
      }}
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-md border border-gray-300 bg-white px-2 py-1 text-[9px] font-semibold text-[#242424]"
    >
      {integration.evidence}
    </motion.div>
  );
}

const PlatformSimulate = () => {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const finalDelay = reduceMotion ? 0 : 5.25;

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
        <div className="absolute left-[4%] top-[19%] hidden text-[10px] font-medium text-gray-400 sm:block">Email</div>
        <div className="absolute right-[3%] top-[16%] hidden text-[10px] font-medium text-gray-400 sm:block">Storage</div>
        <div className="absolute bottom-[4%] left-1/2 hidden -translate-x-1/2 text-[10px] font-medium text-gray-400 sm:block">Collaboration</div>
        <div className="absolute left-1/2 top-[2%] hidden -translate-x-1/2 text-[10px] font-medium text-gray-400 sm:block">Commerce</div>

        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 640" aria-hidden="true">
          {integrations.map((integration) => (
            <motion.line
              key={integration.id}
              x1={integration.x * 10}
              y1={integration.y * 6.4}
              x2={center.x * 10}
              y2={center.y * 6.4}
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: reduceMotion ? 0.45 : [0, 0.35, 0.55] }}
              transition={{ delay: reduceMotion ? 0 : integration.delay + 0.25, duration: 0.9, ease: 'easeOut' }}
              stroke="#9CA3AF"
              strokeWidth="1"
            />
          ))}
        </svg>

        {integrations.map((integration) => (
          <SourceNode key={integration.id} integration={integration} reduceMotion={reduceMotion} />
        ))}

        {integrations.map((integration) => (
          <EvidenceToken key={`${integration.id}-token`} integration={integration} reduceMotion={reduceMotion} />
        ))}

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

        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: finalDelay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-1/2 top-[59%] z-40 w-[min(280px,78vw)] -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3"
        >
          <p className="text-center text-[10px] font-semibold text-gray-500">Case-ready evidence</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {evidenceBundle.map((item) => (
              <span key={item} className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-[9px] font-medium text-[#242424]">
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  );
};

export default PlatformSimulate;
