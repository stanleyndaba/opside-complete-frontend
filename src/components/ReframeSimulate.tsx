import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ReframeSimulate = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000), // Line 1
      setTimeout(() => setStep(2), 2500), // Line 2
      setTimeout(() => setStep(3), 4500), // Line 3 (The Punchline)
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans p-12 text-center">
      <div className="max-w-2xl space-y-8">
        
        {/* Line 1: The Setup */}
        <AnimatePresence>
          {step >= 1 && (
            <motion.h2 
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              className="text-3xl font-medium text-gray-400 tracking-tight"
            >
              Because finding money...
            </motion.h2>
          )}
        </AnimatePresence>

        {/* Line 2: The Tension */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.h2 
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              className="text-3xl font-medium text-gray-400 tracking-tight"
            >
              and getting Amazon to pay it back...
            </motion.h2>
          )}
        </AnimatePresence>

        {/* Line 3: The Reframe (The Punchline) */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="pt-4"
            >
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-tight">
                are two <span className="text-[#007aff]">different</span> problems.
              </h1>
              
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="h-1.5 bg-[#007aff] mt-4 rounded-full mx-auto max-w-[120px]"
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default ReframeSimulate;
