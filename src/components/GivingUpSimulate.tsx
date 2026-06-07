import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, Mail, FileText, X } from 'lucide-react';

const GivingUpSimulate = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000), // "At some point you stopped."
      setTimeout(() => setStep(2), 2500), // The Cycle (Refiled, Followed up...)
      setTimeout(() => setStep(3), 5000), // The Math: "How many hours is $340 worth?"
      setTimeout(() => setStep(4), 7500), // "So you closed the tab."
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans p-12 text-center">
      
      <div className="max-w-2xl relative h-80 flex flex-col items-center justify-center">
        
        {/* Step 1: The Stop */}
        <AnimatePresence>
          {step === 1 && (
            <motion.h1
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20 }}
              className="text-4xl font-black text-gray-900 tracking-tighter"
            >
              At some point you stopped.
            </motion.h1>
          )}
        </AnimatePresence>

        {/* Step 2: The Cycle of Frustration */}
        <AnimatePresence>
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-3">
                {[
                  { icon: <FileText size={16} />, text: "Corrected the document twice." },
                  { icon: <RefreshCcw size={16} />, text: "Refiled manually." },
                  { icon: <Mail size={16} />, text: "Followed up three times." },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.6 }}
                    className="flex items-center gap-3 text-gray-400 font-medium"
                  >
                    {item.icon} <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 2 }}
                className="text-red-500 font-black uppercase tracking-widest text-xs"
              >
                Same templated response.
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: The Math (The Realization) */}
        <AnimatePresence>
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="space-y-2"
            >
              <h2 className="text-2xl font-bold text-gray-400">And the math stopped making sense.</h2>
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter">
                How many hours is&nbsp;
                <span className="text-[#007aff]">$340</span> worth?
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 4: The Exit */}
        <AnimatePresence>
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, filter: "blur(20px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                <X size={32} />
              </div>
              <h1 className="text-4xl font-black text-gray-300 tracking-tighter italic">
                So you closed the tab.
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default GivingUpSimulate;
