import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const ReadinessSimulate: React.FC = () => {
  const [score, setScore] = useState(38);
  const [isHardening, setIsHardening] = useState(false);

  useEffect(() => {
    let interval: number | undefined;
    const timer = window.setTimeout(() => {
      setIsHardening(true);
      let currentScore = 38;
      interval = window.setInterval(() => {
        if (currentScore < 92) {
          currentScore += 1;
          setScore(currentScore);
        } else {
          window.clearInterval(interval);
        }
      }, 40);
    }, 1500);

    return () => {
      clearTimeout(timer);
      if (interval !== undefined) {
        window.clearInterval(interval);
      }
    };
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
      <div className="w-full max-w-2xl">
        
        {/* Header: Institutional Authority */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-sm font-mono uppercase tracking-tight text-gray-500 mb-1">
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
            {score}<span className="text-xl ml-1">%</span>
          </motion.div>
        </div>

        {/* The Checklist: Operational Infrastructure */}
        <div className="grid grid-cols-2 gap-6">
          
          {/* Ready Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-tight text-gray-400 border-b border-gray-100 pb-1">
              Verified
            </h3>
            <div className="space-y-1.5">
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
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check className="h-3 w-3 stroke-[2.5]" />
                  </div>
                  <span className="text-sm font-medium text-black">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Still Weak Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-tight text-gray-400 border-b border-gray-100 pb-1">
              Weak
            </h3>
            <div className="space-y-1.5">
              {weakItems.map((item) => (
                <motion.div 
                  key={item}
                  className="flex items-start gap-2"
                >
                  <div className="mt-1.5 text-sm font-semibold leading-none text-gray-500">-</div>
                  <span className="text-sm font-medium text-gray-400">{item}</span>
                </motion.div>
              ))}
            </div>
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
