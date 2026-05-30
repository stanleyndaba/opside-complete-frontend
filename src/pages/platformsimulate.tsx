import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type IntegrationLogo = {
  id: string;
  name: string;
  icon: string;
};

type FloatingIntegration = IntegrationLogo & {
  startX: number;
  startY: number;
  rotate: number;
  delay: number;
  size?: 'sm' | 'md' | 'lg';
};

const integrations: IntegrationLogo[] = [
  { id: 'amazon', name: 'Amazon', icon: '/amazon-logo-transparent-circle.png' },
  { id: 'gmail', name: 'Gmail', icon: '/gmailicon.png' },
  { id: 'outlook', name: 'Outlook', icon: '/outlookicon.webp' },
  { id: 'gdrive', name: 'Google Drive', icon: '/gd.png' },
  { id: 'dropbox', name: 'Dropbox', icon: '/Dropbox_Icon.svg.png' },
  { id: 'slack', name: 'Slack', icon: '/slack-icon-2019.png' },
  { id: 'adobe-sign', name: 'Adobe Sign', icon: '/dobe.png' },
  { id: 'onedrive', name: 'OneDrive', icon: '/onedriive.png' },
];

const paths = [
  { startX: -560, startY: -260, rotate: -8 },
  { startX: 510, startY: -250, rotate: 7 },
  { startX: -455, startY: 300, rotate: 5 },
  { startX: 560, startY: 275, rotate: -6 },
  { startX: -180, startY: -380, rotate: 4 },
  { startX: 230, startY: 375, rotate: -4 },
  { startX: -660, startY: 50, rotate: 8 },
  { startX: 660, startY: -45, rotate: -7 },
  { startX: -310, startY: -330, rotate: -5 },
  { startX: 345, startY: 330, rotate: 6 },
  { startX: -590, startY: 195, rotate: -9 },
  { startX: 600, startY: -205, rotate: 9 },
  { startX: -80, startY: 420, rotate: 3 },
  { startX: 85, startY: -420, rotate: -3 },
  { startX: -710, startY: -125, rotate: 6 },
  { startX: 710, startY: 125, rotate: -6 },
  { startX: -390, startY: 395, rotate: 7 },
  { startX: 420, startY: -395, rotate: -7 },
  { startX: -520, startY: -20, rotate: 2 },
  { startX: 520, startY: 25, rotate: -2 },
  { startX: -245, startY: 120, rotate: -4 },
  { startX: 265, startY: -125, rotate: 4 },
  { startX: -30, startY: -315, rotate: 5 },
  { startX: 35, startY: 315, rotate: -5 },
];

const floatingIntegrations: FloatingIntegration[] = paths.map((path, index) => {
  const source = integrations[index % integrations.length];
  return {
    ...source,
    id: `${source.id}-${index}`,
    ...path,
    delay: index * 0.16,
    size: index % 5 === 0 ? 'lg' : index % 3 === 0 ? 'sm' : 'md',
  };
});

const tileSize = {
  sm: 62,
  md: 74,
  lg: 86,
};

const FloatingLogo = ({ name, icon, startX, startY, rotate, delay, size = 'md' }: FloatingIntegration) => {
  const reduceMotion = useReducedMotion();
  const dimension = tileSize[size];

  return (
    <motion.div
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-[#D8E0E7] bg-white/95 shadow-sm"
      style={{
        width: dimension,
        height: dimension,
        transformOrigin: 'center',
        boxShadow: '0 16px 42px rgba(24, 32, 38, 0.1), 0 0 24px rgba(77, 121, 255, 0.08)',
      }}
      initial={{ x: startX, y: startY, opacity: 0, scale: 0.82, rotate }}
      animate={
        reduceMotion
          ? { x: startX * 0.24, y: startY * 0.24, opacity: 0.9, scale: 1, rotate: 0 }
          : {
              x: [startX, startX * 0.62, startX * 0.28, 0],
              y: [startY, startY * 0.54, startY * 0.22, 0],
              opacity: [0, 0.98, 0.92, 0],
              scale: [0.82, 1.15, 0.86, 0.1],
              rotate: [rotate, rotate * 0.42, rotate * 0.12, 0],
            }
      }
      transition={{
        duration: reduceMotion ? 0 : 5.4,
        delay,
        repeat: reduceMotion ? 0 : Infinity,
        repeatDelay: 0.08,
        ease: [0.76, 0, 0.24, 1],
      }}
    >
      <img src={icon} alt={name} className="h-[64%] w-[64%] object-contain" />
    </motion.div>
  );
};

const PlatformSimulate = () => {
  const reduceMotion = useReducedMotion();

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white px-6 font-sans text-[#182026]"
      aria-label="Margin platform integration ingestion animation"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        style={{
          backgroundImage: 'radial-gradient(rgba(94, 108, 122, 0.42) 1.15px, transparent 1.15px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(77,121,255,0.07),transparent_31%),linear-gradient(180deg,rgba(246,248,250,0.42),rgba(255,255,255,0.28)_45%,rgba(246,248,250,0.46))]" />

      <section className="relative h-[min(760px,100vh)] w-[min(1180px,100vw)]" aria-label="Platform integrations flowing into the Margin logo">
        {floatingIntegrations.map((integration) => (
          <FloatingLogo key={integration.id} {...integration} />
        ))}

        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <motion.div
            className="flex items-center gap-3"
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [1, 1.035, 1],
                    filter: [
                      'drop-shadow(0 16px 36px rgba(24,32,38,0.12))',
                      'drop-shadow(0 22px 46px rgba(77,121,255,0.2))',
                      'drop-shadow(0 16px 36px rgba(24,32,38,0.12))',
                    ],
                  }
            }
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img src="/logoimagetwo.png" alt="Margin" width="72" height="72" className="h-14 w-auto object-contain md:h-20" />
            <span className="brand-wordmark font-merriweather text-4xl tracking-tight text-[#182026] md:text-6xl">Margin</span>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default PlatformSimulate;
