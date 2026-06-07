import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FinalPayoffSimulate = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000), // "Finding it..."
      setTimeout(() => setStep(2), 2500), // "...was never the hard part."
      setTimeout(() => setStep(3), 6500), // "Monday." (After the 3s pause + 1s buffer)
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans p-12 text-center">
      <div className="relative w-full max-w-4xl flex flex-col items-center justify-center">
        
        {/* The Insight (Finding vs Hard Part) */}
        <div className="h-40 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.h1
                key="finding"
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(10px)" }}
                className="text-5xl font-black text-gray-900 tracking-tighter"
              >
                Finding it...
              </motion.h1>
            )}
            {step === 2 && (
              <motion.h1
                key="hardpart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-black text-gray-900 tracking-tighter"
              >
                <span className="text-[#007aff]">was never the hard part.</span>
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        {/* The Logo & The Date (Monday) */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 20 }}
              className="mt-20 flex flex-col items-center gap-8"
            >
              <div className="space-y-1">
                <h2 className="text-6xl font-black text-gray-900 tracking-[0.2em] uppercase">Live in 3 days.</h2>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="h-2 bg-gray-900 rounded-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default FinalPayoffSimulate;
