import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ComparisonSimulate = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000), // Scene 11: "Find the money"
      setTimeout(() => setStep(2), 3500), // Scene 12: "Win it back"
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans p-12 text-center overflow-hidden">
      <div className="relative w-full max-w-4xl flex flex-col items-center justify-center h-64">
        
        {/* Scene 11: The Industry Standard */}
        <AnimatePresence>
          {step >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ 
                opacity: step === 1 ? 1 : 0.2, 
                y: step === 1 ? 0 : -80,
                scale: step === 1 ? 1 : 0.8,
                filter: step === 1 ? "blur(0px)" : "blur(4px)"
              }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute space-y-2"
            >
              <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-[0.2em]">Most tools were built</h2>
              <h1 className="text-5xl font-black text-gray-300 tracking-tighter italic">to find the money.</h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scene 12: The MARGIN Differentiator */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 1.1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                type: "spring", 
                damping: 15, 
                stiffness: 100,
                delay: 0.2 
              }}
              className="absolute space-y-2 z-10"
            >
              <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-[0.2em]">Very few were built</h2>
              <h1 className="text-6xl font-black text-[#007aff] tracking-tighter">
                to <span className="underline decoration-4 underline-offset-8">win it back.</span>
              </h1>
              
              {/* The "Victory" Glow */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.15, scale: 1.2 }}
                className="absolute -inset-10 bg-[#007aff] blur-[80px] -z-10 rounded-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default ComparisonSimulate;
