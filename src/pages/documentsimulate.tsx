import { motion, useReducedMotion } from 'framer-motion';

type SourceIcon = {
  id: string;
  name: string;
  src: string;
};

const sourceIcons: SourceIcon[] = [
  { id: 'amazon', name: 'Amazon', src: '/amazon-logo-transparent-circle.png' },
  { id: 'gmail', name: 'Gmail', src: '/gmailicon.png' },
  { id: 'google-drive', name: 'Google Drive', src: '/Driveboy.png' },
  { id: 'slack', name: 'Slack', src: '/slack-icon-2019.png' },
  { id: 'outlook', name: 'Outlook', src: '/outlookicon.webp' },
  { id: 'dropbox', name: 'Dropbox', src: '/Dropbox_Icon.svg.png' },
  { id: 'onedrive', name: 'OneDrive', src: '/onedriive.png' },
  { id: 'quickbooks', name: 'QuickBooks', src: '/quickbooks.png' },
  { id: 'xero', name: 'Xero', src: '/xero.png' },
  { id: 'adobe-sign', name: 'Adobe Sign', src: '/adobesign.png' },
  { id: 'sftp', name: 'S3 / SFTP', src: '/integration-icons/amazons3.jpg' },
  { id: 'amazon-duplicate', name: 'Amazon', src: '/amazon-logo-transparent-circle.png' },
  { id: 'dropbox-duplicate', name: 'Dropbox', src: '/Dropbox_Icon.svg.png' },
  { id: 'outlook-duplicate', name: 'Outlook', src: '/outlookicon.webp' },
  { id: 'excel-reference-one', name: 'Excel reference', src: '/excel-icon-margin.png' },
];

function OrbitingSource({ source, index, reduceMotion }: { source: SourceIcon; index: number; reduceMotion: boolean }) {
  const orbitAngles = [-86, -48, -12, 24, 59, 94, 131, 166, 201, 237, 274, 309, 342, 18, 72];
  const startAngle = orbitAngles[index % orbitAngles.length];
  const direction = index % 2 === 0 ? 1 : -1;
  const radius = index % 3 === 0 ? 210 : index % 2 === 0 ? 184 : 158;
  const delay = reduceMotion ? 0 : index * 0.025;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 z-30"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={reduceMotion ? { opacity: 1, rotate: startAngle } : { opacity: [0, 1, 1, 0], rotate: [startAngle, startAngle + direction * 300, startAngle + direction * 360] }}
      transition={reduceMotion ? { duration: 0 } : { delay, duration: 3.55, times: [0, 0.7, 1], ease: 'linear' }}
      aria-label={`${source.name} source orbiting Margin`}
    >
      <motion.div
        className="-translate-x-1/2 -translate-y-1/2"
        initial={reduceMotion ? { x: radius } : { x: radius, scale: 0.82 }}
        animate={reduceMotion ? { x: radius, scale: 1 } : { x: [radius, radius, 0], scale: [0.82, 1, 0.35] }}
        transition={reduceMotion ? { duration: 0 } : { delay, duration: 3.55, times: [0, 0.7, 1], ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#DCE3E7] bg-white/95 shadow-[0_8px_22px_rgba(24,32,38,0.11)] sm:h-16 sm:w-16" title={source.name}>
          <img src={source.src} alt={source.name} className="h-[60%] w-[60%] object-contain" />
        </div>
      </motion.div>
    </motion.div>
  );
}

const DocumentSimulate = () => {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white px-4 font-sans text-[#242424]"
      aria-label="Platform sources orbit Margin and become connected"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage: 'radial-gradient(rgba(156,163,175,0.38) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <section className="relative flex h-[min(720px,100vh)] w-full max-w-6xl items-center justify-center" aria-label="Orbiting platform sources">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[316px] w-[316px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#D9E2E7] sm:h-[420px] sm:w-[420px]" aria-hidden="true" />

        {sourceIcons.map((source, index) => (
          <OrbitingSource key={source.id} source={source} index={index} reduceMotion={reduceMotion} />
        ))}

        <motion.div
          className="relative z-50 flex h-24 w-24 items-center justify-center rounded-2xl border border-[#D1D5DB] bg-white shadow-[0_16px_42px_rgba(24,32,38,0.14)] sm:h-28 sm:w-28"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.82 }}
          animate={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: [0.82, 1, 1, 1.08, 1] }}
          transition={reduceMotion ? { duration: 0 } : { delay: 2.85, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src="/logoimagetwo.png" alt="Margin" className="h-9 w-auto object-contain sm:h-11" />
          <motion.span
            className="absolute inset-[-9px] rounded-[22px] border border-[#3AAA78]/40"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={reduceMotion ? { opacity: 0 } : { opacity: [0, 0, 1, 0], scale: [0.85, 0.85, 1.18, 1.35] }}
            transition={reduceMotion ? { duration: 0 } : { delay: 2.9, duration: 1.05, ease: 'easeOut' }}
            aria-hidden="true"
          />
        </motion.div>

      </section>
    </main>
  );
};

export default DocumentSimulate;
