import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';

const ReadinessSimulateTwo: React.FC = () => {
  const [score, setScore] = useState(92);
  const [isAssessing, setIsAssessing] = useState(false);
  const [activeMissingIndex, setActiveMissingIndex] = useState(0);

  const confirmedItems = [
    'Quantity variance explanation captured',
    'Case narrative approved'
  ];

  const missingItems = [
    'Invoice missing',
    'Shipment missing',
    'BOL missing',
    'POD missing',
    'ASIN missing',
    'BASIN missing'
  ];

  useEffect(() => {
    let scoreInterval: number | undefined;
    let itemInterval: number | undefined;

    const timer = window.setTimeout(() => {
      setIsAssessing(true);
      let currentScore = 92;
      let currentMissing = 0;

      scoreInterval = window.setInterval(() => {
        if (currentScore > 32) {
          currentScore -= 1;
          setScore(currentScore);
        } else {
          window.clearInterval(scoreInterval);
          window.setTimeout(() => setIsAssessing(false), 900);
        }
      }, 44);

      itemInterval = window.setInterval(() => {
        if (currentMissing < missingItems.length - 1) {
          currentMissing += 1;
          setActiveMissingIndex(currentMissing);
        } else {
          window.clearInterval(itemInterval);
        }
      }, 430);
    }, 900);

    return () => {
      clearTimeout(timer);
      if (scoreInterval !== undefined) {
        window.clearInterval(scoreInterval);
      }
      if (itemInterval !== undefined) {
        window.clearInterval(itemInterval);
      }
    };
  }, [missingItems.length]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-4 font-serif">
      <AnimatePresence>
        {isAssessing ? (
          <motion.div
            key="assessment-modal"
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-8 z-20 w-[min(92vw,360px)] rounded-xl border border-gray-200 bg-white/95 px-5 py-4 shadow-xl shadow-gray-200/60 backdrop-blur"
          >
            <p className="mb-2 text-xs font-mono uppercase tracking-tight text-gray-400">
              Assessing evidence
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={missingItems[activeMissingIndex]}
                initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
                transition={{ duration: 0.24 }}
                className="text-lg font-semibold tracking-tight text-black"
              >
                {missingItems[activeMissingIndex]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="mb-1 text-sm font-mono uppercase tracking-tight text-gray-500">
              Dispute evidence maturity
            </h1>
            <h2 className="text-2xl font-normal text-black">
              Evidence maturity
            </h2>
          </div>
        </div>

        <div className="mb-6">
          <motion.div
            className="text-5xl font-bold leading-none tracking-tighter text-gray-700"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
          >
            {score}<span className="ml-1 text-xl">%</span>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="border-b border-gray-100 pb-1 text-xs font-mono uppercase tracking-tight text-gray-400">
              Confirmed
            </h3>
            <div className="space-y-1.5">
              {confirmedItems.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0.25, x: -5 }}
                  animate={{
                    opacity: isAssessing ? 1 : 0.45,
                    x: isAssessing ? 0 : -5
                  }}
                  transition={{ delay: index * 0.12 + 0.9 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check className="h-3 w-3 stroke-[2.5]" />
                  </div>
                  <span className="text-sm font-medium text-black">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="border-b border-gray-100 pb-1 text-xs font-mono uppercase tracking-tight text-gray-400">
              Missing
            </h3>
            <div className="space-y-1.5">
              {missingItems.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0.25, x: 5 }}
                  animate={{
                    opacity: index <= activeMissingIndex && isAssessing ? 1 : 0.4,
                    x: index <= activeMissingIndex && isAssessing ? 0 : 5
                  }}
                  transition={{ delay: index * 0.06 + 0.8 }}
                  className="flex items-start gap-2"
                >
                  <div className="mt-1.5 text-sm font-semibold leading-none text-gray-500">-</div>
                  <span className="text-sm font-medium text-gray-500">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Playfair+Display:wght@700;900&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}} />
    </div>
  );
};

export default ReadinessSimulateTwo;
