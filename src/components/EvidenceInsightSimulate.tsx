import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldCheck, Search } from 'lucide-react';

const EvidenceInsightSimulate = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),  // The Loss (Part 1)
      setTimeout(() => setStep(2), 2500), // The Loss (Part 2)
      setTimeout(() => setStep(3), 5000), // The Pivot (Detection)
      setTimeout(() => setStep(4), 7000), // The Victory (Evidence)
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans p-12 text-center overflow-hidden">
      
      <div className="max-w-3xl relative h-64 flex flex-col items-center justify-center">
        
        {/* Phase 1: The Loss (Fading out) */}
        <AnimatePresence>
          {step >= 1 && step < 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, filter: "blur(10px)", y: -20 }}
              className="space-y-4"
            >
              <h2 className="text-3xl font-medium text-gray-400 leading-tight tracking-tight">
                It was lost when you couldn't find a document
              </h2>
              {step >= 2 && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="text-4xl font-black text-gray-900 tracking-tighter italic">
                    from seven months ago
                  </span>
                  <span className="text-sm font-bold text-red-500 uppercase tracking-tight flex items-center gap-2">
                    <Clock size={14} /> fast enough to save the case.
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 2: The Insight (Detection vs Evidence) */}
        <div className="flex flex-col items-center gap-8">
          <AnimatePresence>
            {step >= 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-xs tracking-tight">
                  <Search size={16} /> Detection finds the discrepancy.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {step >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 1.1 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="relative"
              >
                <h1 className="text-6xl font-black text-gray-900 tracking-tighter">
                  Evidence <span className="text-[#007aff]">wins</span> the recovery.
                </h1>
                
                {/* The "Win" Indicator */}
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="h-2 bg-[#007aff] mt-4 rounded-full mx-auto max-w-[180px]"
                />
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  className="absolute -inset-8 bg-[#007aff] blur-3xl rounded-full -z-10"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default EvidenceInsightSimulate;
