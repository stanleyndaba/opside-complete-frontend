import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LaunchCountdownSimulate = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000), // "Nobody built..."
      setTimeout(() => setStep(2), 3500), // "Live in 2 Days."
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans p-12 text-center">
      <div className="relative w-full max-w-4xl flex flex-col items-center justify-center">
        
        {/* Scene 1: The Indictment */}
        <div className="h-32 overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.h1
                key="nobody"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl md:text-5xl font-medium text-gray-400 tracking-tight"
              >
                Nobody built for the&nbsp;
                <span className="text-gray-900 font-black">evidence part.</span>
              </motion.h1>
            )}

            {/* Scene 2: The Countdown */}
            {step === 2 && (
              <motion.div
                key="countdown"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-6"
              >
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-[0.3em]">Launch Imminent</h2>
                  <h1 className="text-7xl font-black text-[#007aff] tracking-tighter">
                    Live in 2 Days.
                  </h1>
                </div>

                {/* Progress Bar Simulation */}
                <div className="w-64 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "90%" }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="h-full bg-[#007aff]"
                  />
                </div>

                <motion.div 
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-[10px] font-black text-gray-400 uppercase tracking-widest"
                >
                  Finalizing Recovery Infrastructure
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default LaunchCountdownSimulate;
