import { motion, useReducedMotion } from 'framer-motion';

type OrbitPlatform = {
  id: string;
  name: string;
  icon: string;
  orbitRadius: number;   // vmin-based radius
  duration: number;      // seconds for a full orbit
  startAngle: number;    // degrees offset so icons don't cluster
  reverse?: boolean;     // orbit clockwise if true
};

const platforms: OrbitPlatform[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    icon: '/amazon-logo-transparent-circle.png',
    orbitRadius: 28,
    duration: 22,
    startAngle: 0,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: '/gmailicon.png',
    orbitRadius: 28,
    duration: 22,
    startAngle: 90,
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: '/gd.png',
    orbitRadius: 28,
    duration: 22,
    startAngle: 180,
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '/slack-icon-2019.png',
    orbitRadius: 28,
    duration: 22,
    startAngle: 270,
  },
  {
    id: 'outlook',
    name: 'Outlook',
    icon: '/outlookicon.webp',
    orbitRadius: 42,
    duration: 32,
    startAngle: 45,
    reverse: true,
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: '/Dropbox_Icon.svg.png',
    orbitRadius: 42,
    duration: 32,
    startAngle: 135,
    reverse: true,
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: '/onedriive.png',
    orbitRadius: 42,
    duration: 32,
    startAngle: 225,
    reverse: true,
  },
  {
    id: 'adobe-sign',
    name: 'Adobe Sign',
    icon: '/dobe.png',
    orbitRadius: 42,
    duration: 32,
    startAngle: 315,
    reverse: true,
  },
];

/* ── Orbit ring component ──────────────────────────────── */
function OrbitRing({ radius, delay, reduceMotion }: { radius: number; delay: number; reduceMotion: boolean }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: reduceMotion ? 0 : delay, duration: 0.8, ease: 'easeOut' }}
      className="absolute rounded-full border border-gray-200/60"
      style={{
        width: `${radius * 2}vmin`,
        height: `${radius * 2}vmin`,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}

/* ── Single orbiting icon ──────────────────────────────── */
function OrbitingIcon({ platform, reduceMotion }: { platform: OrbitPlatform; reduceMotion: boolean }) {
  const direction = platform.reverse ? 'reverse' : 'normal';
  const animationName = `orbit-${platform.id}`;

  /* Build the keyframes string once */
  const keyframes = `
    @keyframes ${animationName} {
      from { transform: rotate(${platform.startAngle}deg) translateX(${platform.orbitRadius}vmin) rotate(-${platform.startAngle}deg); }
      to   { transform: rotate(${platform.startAngle + 360}deg) translateX(${platform.orbitRadius}vmin) rotate(-${platform.startAngle + 360}deg); }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute z-30"
        style={{
          left: '50%',
          top: '50%',
          marginLeft: '-2.8rem',
          marginTop: '-2.8rem',
          width: '5.6rem',
          height: '5.6rem',
          animation: reduceMotion
            ? 'none'
            : `${animationName} ${platform.duration}s linear infinite ${direction}`,
        }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center gap-1">
          <div className="flex h-[4.4rem] w-[4.4rem] items-center justify-center rounded-2xl border border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm">
            <img
              src={platform.icon}
              alt={platform.name}
              className="h-[60%] w-[60%] object-contain"
              draggable={false}
            />
          </div>
          <span className="hidden text-[10px] font-medium text-gray-500 sm:block">{platform.name}</span>
        </div>
      </motion.div>
    </>
  );
}

/* ── Page component ────────────────────────────────────── */
const PlatformFly = () => {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  /* Unique orbit radii for rings */
  const rings = [...new Set(platforms.map((p) => p.orbitRadius))];

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white px-4 font-sans text-[#242424]"
      aria-label="Platform integrations orbiting around Margin"
    >
      {/* Dot-grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage: 'radial-gradient(rgba(156,163,175,0.38) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Orbit arena */}
      <section className="relative flex items-center justify-center" style={{ width: '90vmin', height: '90vmin' }}>
        {/* Orbit rings */}
        {rings.map((radius, i) => (
          <OrbitRing key={radius} radius={radius} delay={0.3 + i * 0.25} reduceMotion={reduceMotion} />
        ))}

        {/* Centre logo */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
          animate={{
            opacity: 1,
            scale: reduceMotion ? 1 : [1, 1, 1.06, 1],
            borderColor: reduceMotion ? '#D1D5DB' : ['#D1D5DB', '#D1D5DB', '#3AAA78', '#D1D5DB'],
          }}
          transition={{
            opacity: { delay: reduceMotion ? 0 : 0.1, duration: 0.5, ease: 'easeOut' },
            scale: { delay: reduceMotion ? 0 : 2, duration: 1.2, repeat: Infinity, repeatDelay: 6 },
            borderColor: { delay: reduceMotion ? 0 : 2, duration: 1.2, repeat: Infinity, repeatDelay: 6 },
          }}
          className="relative z-50 flex h-28 w-28 items-center justify-center rounded-3xl border-2 bg-white/95 shadow-lg sm:h-32 sm:w-32"
        >
          <img src="/logoimagetwo.png" alt="Margin" className="h-10 w-auto object-contain sm:h-12" />
        </motion.div>

        {/* Orbiting platform icons */}
        {platforms.map((platform) => (
          <OrbitingIcon key={platform.id} platform={platform} reduceMotion={reduceMotion} />
        ))}
      </section>
    </main>
  );
};

export default PlatformFly;
