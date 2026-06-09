import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import rIcon from '@/assets/R.png';

const RejectionScreenSimulate = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),  // Notification 1: Claim Rejected
      setTimeout(() => setStep(2), 1500), // Notification 2: Case Resolved
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans p-6 overflow-hidden">
      
      {/* System Notification Stack */}
      <div className="w-full max-w-sm space-y-3">
        <AnimatePresence>
          {step >= 1 && (
            <motion.div
              initial={{ x: "100vw", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
              className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-200 flex items-start gap-3"
            >
              <div className="bg-orange-500 p-2 rounded-lg text-white flex items-center justify-center">
                <img src={rIcon} alt="Amazon Logo" className="w-[18px] h-[18px] object-contain" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amazon Support</span>
                  <span className="text-[10px] text-gray-400">Now</span>
                </div>
                <div className="text-sm font-bold text-gray-900">Claim Rejected</div>
                <div className="text-xs text-gray-500">Inbound shipment reconciliation denied.</div>
              </div>
            </motion.div>
          )}
          {step >= 2 && (
            <motion.div
              initial={{ x: "100vw", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
              className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-200 flex items-start gap-3"
            >
              <div className="bg-gray-800 p-2 rounded-lg text-white flex items-center justify-center">
                <img src={rIcon} alt="Amazon Logo" className="w-[18px] h-[18px] object-contain" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System</span>
                  <span className="text-[10px] text-gray-400">1m ago</span>
                </div>
                <div className="text-sm font-bold text-gray-900">Case #50013020607: Resolved</div>
                <div className="text-xs text-gray-500">This case is now closed.</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default RejectionScreenSimulate;
