import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ReadinessSimulate: React.FC = () => {
  const [score, setScore] = useState(38);
  const [isHardening, setIsHardening] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHardening(true);
      let currentScore = 38;
      const interval = setInterval(() => {
        if (currentScore < 92) {
          currentScore += 1;
          setScore(currentScore);
        } else {
          clearInterval(interval);
        }
      }, 40);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const readyItems = [
    "Invoice matched",
    "Shipment record matched",
    "BOL matched",
    "POD matched",
    "ASIN/FNSKU matched",
    "Cost basis confirmed"
  ];

  const weakItems = [
    "Quantity variance explanation needed",
    "Case narrative needs seller approval"
  ];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-serif">
      <div className="w-full max-w-3xl">
        
        {/* Header: Institutional Authority */}
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-sm font-mono uppercase tracking-tight text-gray-500 mb-1">
              Protocol: Evidence Hardening
            </h1>
            <h2 className="text-2xl font-normal text-black">
              Evidence Readiness
            </h2>
          </div>
        </div>

        {/* The Score: Massive & Authoritative */}
        <div className="flex items-center gap-6 mb-8">
          <motion.div 
            className="text-[4rem] font-bold leading-none tracking-tighter text-black"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
          >
            {score}<span className="text-2xl ml-1">%</span>
          </motion.div>
          
          <div className="flex-1 space-y-2">
            <div className="h-[2px] w-full bg-gray-100 overflow-hidden">
              <motion.div 
                className="h-full bg-black"
                initial={{ width: '38%' }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 2, ease: "circOut" }}
              />
            </div>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-tight">
              {score < 92 ? "Hardening Evidence Rails..." : "Audit Ready"}
            </p>
          </div>
        </div>

        {/* The Checklist: Operational Infrastructure */}
        <div className="grid grid-cols-2 gap-8">
          
          {/* Ready Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-tight text-gray-400 border-b border-gray-100 pb-1">
              Ready / Verified
            </h3>
            <div className="space-y-2">
              {readyItems.map((item, index) => (
                <motion.div 
                  key={item}
                  initial={{ opacity: 0.3, x: -5 }}
                  animate={{ 
                    opacity: isHardening ? 1 : 0.3,
                    x: isHardening ? 0 : -5
                  }}
                  transition={{ delay: index * 0.1 + 1.5 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 bg-[#10B981] rounded-[2px]" />
                  <span className="text-base font-medium text-black">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Still Weak Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-tight text-gray-400 border-b border-gray-100 pb-1">
              Pending / Weak
            </h3>
            <div className="space-y-2">
              {weakItems.map((item) => (
                <motion.div 
                  key={item}
                  className="flex items-start gap-2"
                >
                  <div className="w-1.5 h-1.5 bg-[#F59E0B] rounded-[2px] mt-1.5" />
                  <span className="text-base font-medium text-gray-400">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer: Audit Ready Pulse */}
        <div className="mt-12 pt-4 border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-[#10B981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            />
            <span className="text-xs font-mono uppercase tracking-tight text-gray-400">
              System Status: Audit Ready
            </span>
          </div>
          <div className="text-xs font-mono text-gray-300 uppercase tracking-tight">
            Margin Infrastructure v1.0.4
          </div>
        </div>

      </div>

      {/* Global Styles for Serif/Mono feel */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Playfair+Display:wght@700;900&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}} />
    </div>
  );
};

export default ReadinessSimulate;
