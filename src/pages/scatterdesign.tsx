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
    path: basePaths[index % basePaths.length].map((point) => ({
      x: Math.round(point.x * 1.65),
      y: Math.round(point.y * 1.65),
      rotate: Math.round(point.rotate * 1.22),
    })),
    delay: (index % 8) * 0.42,
    duration: 9.8 + (index % 6) * 0.67,
    size: index % 7 === 0 ? 'lg' : index % 3 === 0 ? 'sm' : 'md',
  };
});

const sizeMap = {
  sm: { width: 60, height: 76, scale: 0.82 },
  md: { width: 72, height: 92, scale: 1 },
  lg: { width: 82, height: 106, scale: 1.14 },
};

const FileIcon = ({ type, color, scale }: { type: FileType; color: string; scale: number }) => {
  if (type === 'DOC') {
    return (
      <div className="relative h-[72px] w-[62px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute right-0 top-0 h-[58px] w-[48px] rounded-[8px] border border-[#c8d1dc] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
          <div className="absolute right-0 top-0 h-4 w-4 rounded-bl-[5px] border-b border-l border-[#c8d1dc] bg-[#eef3f8]" />
          <div className="absolute left-2 top-3 h-8 w-8 rounded-[7px] bg-gradient-to-br from-[#5de1ff] via-[#2563eb] to-[#7c3aed] opacity-95" />
          <div className="absolute left-4 top-5 h-8 w-8 rounded-[7px] bg-gradient-to-br from-[#38bdf8] via-[#3b82f6] to-[#2563eb] opacity-90" />
        </div>
        <div className="absolute bottom-0 left-0 flex h-9 w-9 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#2f7df6] to-[#183fb7] text-[22px] font-black text-white shadow-[0_8px_16px_rgba(37,99,235,0.32)]">
          W
        </div>
      </div>
    );
  }

  if (type === 'PDF') {
    return (
      <div className="relative h-[72px] w-[58px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute inset-x-1 top-0 h-[68px] rounded-[2px] border border-[#cfd6dd] bg-[#f8fafc] shadow-[0_8px_18px_rgba(15,23,42,0.11)]">
          <div className="absolute right-0 top-0 h-[18px] w-[18px] border-b border-l border-[#cfd6dd] bg-[#e9eef3]" />
          <div className="absolute left-2 top-2 h-px w-6 bg-[#cbd5df]" />
          <div className="absolute left-2 top-8 h-px w-8 bg-[#d7dde4]" />
          <div className="absolute left-2 top-12 h-px w-8 bg-[#d7dde4]" />
          <div className="absolute bottom-4 left-[-4px] right-[-4px] flex h-7 items-center justify-center bg-[#e30012] text-[19px] font-black tracking-[0.12em] text-white shadow-[0_5px_10px_rgba(227,0,18,0.24)]">
            PDF
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[72px] w-[58px]" style={{ transform: `scale(${scale})` }}>
      <div className="absolute inset-x-1 top-0 h-[68px] rounded-[7px] border border-[#cfd6dd] bg-[#f8fafc] shadow-[0_8px_18px_rgba(15,23,42,0.1)]">
        <div className="absolute right-0 top-0 h-4 w-4 rounded-bl-[5px] border-b border-l border-[#cfd6dd] bg-[#eef3f8]" />
        <div
          className="absolute left-[-2px] right-[-2px] top-7 rounded-[5px] py-1 text-center text-[14px] font-black tracking-[0.08em] text-white shadow-[0_5px_10px_rgba(15,23,42,0.13)]"
          style={{ backgroundColor: color }}
        >
          {type}
        </div>
        <div className="absolute left-3 top-4 h-px w-7" style={{ backgroundColor: `${color}66` }} />
        <div className="absolute bottom-3 left-3 h-px w-8" style={{ backgroundColor: `${color}55` }} />
      </div>
    </div>
  );
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
      className="absolute flex items-center justify-center"
      style={{
        left,
        top,
        width: dimensions.width,
        height: dimensions.height,
        filter: `drop-shadow(0 14px 24px rgba(24, 32, 38, 0.1)) drop-shadow(0 0 18px ${color}18)`,
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
      <FileIcon type={type} color={color} scale={dimensions.scale} />
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
