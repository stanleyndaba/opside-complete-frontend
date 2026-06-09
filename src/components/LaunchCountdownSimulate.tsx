import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LaunchCountdownSimulate = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),   // Show "Nobody built..."
      setTimeout(() => setStep(2), 1500),  // Show "Until now."
      setTimeout(() => setStep(3), 3500),  // Show Logo
      setTimeout(() => setStep(4), 5000),  // Show "Launching in 2 days."
      setTimeout(() => setStep(5), 8000),  // Fade out
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans p-12 text-center">
      <div className="relative w-full max-w-4xl flex flex-col items-center justify-center">
        
        <div className="h-40 overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            
            {/* Scene 1: The Indictment */}
            {step === 1 && (
              <motion.h1
                key="nobody"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl md:text-5xl font-medium text-gray-400 tracking-tight"
              >
                Nobody built for the&nbsp;
                <span className="text-gray-900 font-black">evidence part.</span>
              </motion.h1>
            )}

            {/* Scene 2: Until Now */}
            {step === 2 && (
              <motion.h1
                key="until-now"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter"
              >
                Until now.
              </motion.h1>
            )}

            {/* Scene 3: The Logo */}
            {step === 3 && (
              <motion.div
                key="logo"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-center"
              >
                <img 
                  src="/logoimagetwo.png" 
                  alt="Margin Logo" 
                  className="w-24 h-24 md:w-32 md:h-32 object-contain"
                />
              </motion.div>
            )}

            {/* Scene 4: The Countdown */}
            {step === 4 && (
              <motion.div
                key="countdown"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-6"
              >
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-[0.3em]">Launch Imminent</h2>
                  <h1 className="text-6xl md:text-7xl font-black text-[#007aff] tracking-tighter">
                    Launching in 2 days.
                  </h1>
                </div>

                {/* Progress Bar Simulation */}
                <div className="w-64 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
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
