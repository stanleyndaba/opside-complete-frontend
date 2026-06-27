import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FinalPayoffSimulate = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans p-12 text-center">
      <div className="relative w-full max-w-4xl flex flex-col items-center justify-center">
        
        {/* The Insight */}
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
                Finding a discrepancy...
              </motion.h1>
            )}
            {step === 2 && (
              <motion.h1
                key="hardpart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-black text-gray-900 tracking-tighter"
              >
                <span className="text-[#007aff]">is only the beginning.</span>
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default FinalPayoffSimulate;
