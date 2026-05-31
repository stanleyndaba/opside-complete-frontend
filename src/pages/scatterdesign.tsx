import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type FileType = 'PDF' | 'DOC' | 'TSX' | 'XLS' | 'JSON';

type ScatterFile = {
  id: string;
  type: FileType;
  color: string;
  left: string;
  top: string;
  path: Array<{ x: number; y: number; rotate: number }>;
  delay: number;
  duration: number;
  size?: 'sm' | 'md' | 'lg';
};

const FILE_COLORS: Record<FileType, string> = {
  PDF: '#FF4D4D',
  DOC: '#4D79FF',
  TSX: '#19A974',
  XLS: '#E2A22A',
  JSON: '#8B5CF6',
};

const basePaths = [
  [{ x: -90, y: -36, rotate: -8 }, { x: 54, y: -72, rotate: 6 }, { x: 108, y: 46, rotate: -4 }, { x: -42, y: 82, rotate: 9 }],
  [{ x: 74, y: -84, rotate: 7 }, { x: -62, y: -48, rotate: -5 }, { x: -118, y: 52, rotate: 6 }, { x: 34, y: 92, rotate: -8 }],
  [{ x: -54, y: 86, rotate: 5 }, { x: 96, y: 64, rotate: -7 }, { x: 72, y: -72, rotate: 4 }, { x: -108, y: -44, rotate: -6 }],
  [{ x: 112, y: 38, rotate: -6 }, { x: 28, y: -92, rotate: 8 }, { x: -86, y: -34, rotate: -4 }, { x: -42, y: 96, rotate: 7 }],
  [{ x: -130, y: -20, rotate: 9 }, { x: -36, y: 106, rotate: -6 }, { x: 112, y: 72, rotate: 5 }, { x: 78, y: -88, rotate: -8 }],
];

const anchors = [
  ['10%', '16%'], ['24%', '13%'], ['43%', '16%'], ['63%', '14%'], ['82%', '18%'],
  ['14%', '34%'], ['32%', '31%'], ['53%', '34%'], ['72%', '31%'], ['90%', '38%'],
  ['8%', '58%'], ['25%', '54%'], ['44%', '58%'], ['64%', '55%'], ['84%', '59%'],
  ['16%', '78%'], ['35%', '82%'], ['55%', '76%'], ['74%', '82%'], ['91%', '76%'],
  ['6%', '86%'], ['47%', '88%'], ['67%', '22%'], ['38%', '42%'], ['59%', '68%'],
];

const fileTypes: FileType[] = ['PDF', 'DOC', 'TSX', 'XLS', 'JSON'];

const scatterFiles: ScatterFile[] = anchors.map(([left, top], index) => {
  const type = fileTypes[index % fileTypes.length];
  return {
    id: `${type.toLowerCase()}-${index}`,
    type,
    color: FILE_COLORS[type],
    left,
    top,
    path: basePaths[index % basePaths.length],
    delay: (index % 8) * 0.42,
    duration: 9.4 + (index % 6) * 0.7,
    size: index % 7 === 0 ? 'lg' : index % 3 === 0 ? 'sm' : 'md',
  };
});

const sizeMap = {
  sm: { width: 52, height: 72 },
  md: { width: 64, height: 90 },
  lg: { width: 74, height: 104 },
};

const ScatterTile = ({ type, color, left, top, path, delay, duration, size = 'md' }: ScatterFile) => {
  const reduceMotion = useReducedMotion();
  const dimensions = sizeMap[size];
  const xPath = path.map((point) => point.x);
  const yPath = path.map((point) => point.y);
  const rotatePath = path.map((point) => point.rotate);

  return (
    <motion.div
      aria-hidden="true"
      className="absolute flex flex-col items-center justify-center rounded-md border bg-white/95 shadow-sm"
      style={{
        left,
        top,
        width: dimensions.width,
        height: dimensions.height,
        borderColor: `${color}CC`,
        boxShadow: `0 14px 36px rgba(24, 32, 38, 0.08), 0 0 22px ${color}1F`,
      }}
      initial={{ x: xPath[0], y: yPath[0], rotate: rotatePath[0], opacity: 0.88 }}
      animate={
        reduceMotion
          ? { x: 0, y: 0, rotate: 0, opacity: 0.9 }
          : {
              x: [...xPath, xPath[0]],
              y: [...yPath, yPath[0]],
              rotate: [...rotatePath, rotatePath[0]],
              opacity: [0.72, 0.98, 0.86, 0.96, 0.72],
            }
      }
      transition={{
        duration: reduceMotion ? 0 : duration,
        delay,
        repeat: reduceMotion ? 0 : Infinity,
        ease: 'easeInOut',
      }}
    >
      <div className="absolute right-0 top-0 h-3.5 w-3.5 rounded-bl border-b border-l border-[#D9E1E8] bg-[#F6F8FA]" />
      <span className="text-[12px] font-black tracking-[0.14em]" style={{ color }}>
        {type}
      </span>
      <span className="mt-3 h-px w-9" style={{ backgroundColor: color, opacity: 0.78 }} />
      <span className="mt-2 h-px w-7" style={{ backgroundColor: color, opacity: 0.52 }} />
      <span className="mt-2 h-px w-5" style={{ backgroundColor: color, opacity: 0.34 }} />
    </motion.div>
  );
};

const ScatterDesign = () => {
  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-white font-sans text-[#182026]"
      aria-label="Scattered files roaming animation"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        style={{
          backgroundImage: 'radial-gradient(rgba(94, 108, 122, 0.42) 1.15px, transparent 1.15px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(77,121,255,0.07),transparent_31%),linear-gradient(180deg,rgba(246,248,250,0.42),rgba(255,255,255,0.28)_45%,rgba(246,248,250,0.46))]" />

      <section className="relative z-10 min-h-screen w-full" aria-label="Roaming document field">
        {scatterFiles.map((file) => (
          <ScatterTile key={file.id} {...file} />
        ))}
      </section>
    </main>
  );
};

export default ScatterDesign;
