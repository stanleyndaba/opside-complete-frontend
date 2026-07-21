import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RejectCard = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),  // The Main Card Reveal (from bottom to middle)
      setTimeout(() => setStep(2), 2000), // The "GONE" moment
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans p-6 overflow-hidden">
      <AnimatePresence>
        {step >= 1 && (
          <motion.div
            initial={{ y: "100vh", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 70, damping: 15 }}
            className="w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="p-8 text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-red-600 font-black text-3xl tracking-tighter uppercase">Claim Denied</h2>
                <p className="text-gray-500 font-medium text-sm">
                  We cannot reimburse you for this shipment.
                </p>
              </div>

              <div className="py-8 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-tight mb-2">Loss Amount</div>
                <motion.div 
                  className="text-6xl font-black text-red-600 tracking-tighter relative inline-block"
                >
                  $1,247
                  {step >= 2 && (
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "110%" }}
                      className="absolute top-1/2 left-[-5%] h-2 bg-red-600 rounded-full"
                    />
                  )}
                </motion.div>
                
                <AnimatePresence>
                  {step >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 2 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 text-4xl font-black text-gray-900 tracking-tighter uppercase italic"
                    >
                      GONE.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-left p-4 border border-dashed border-gray-200 rounded-xl">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Reason</div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  The documentation provided does not meet the policy requirements for inbound reconciliation.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RejectCard;
