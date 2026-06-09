import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, XCircle, AlertCircle, ChevronRight } from 'lucide-react';

const RejectionScreenSimulate = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),  // Notification 1: Claim Rejected
      setTimeout(() => setStep(2), 1500), // Notification 2: Case Resolved
      setTimeout(() => setStep(3), 3000), // The Main Card Reveal
      setTimeout(() => setStep(4), 4500), // The "GONE" moment
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 font-sans p-6 pt-12 overflow-hidden">
      
      {/* System Notification Stack */}
      <div className="w-full max-w-sm space-y-3 mb-12">
        <AnimatePresence>
          {step >= 1 && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-200 flex items-start gap-3"
            >
              <div className="bg-orange-500 p-2 rounded-lg text-white">
                <Bell size={18} />
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
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-200 flex items-start gap-3"
            >
              <div className="bg-gray-800 p-2 rounded-lg text-white">
                <AlertCircle size={18} />
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

      {/* The Main Rejection Card */}
      <AnimatePresence>
        {step >= 3 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
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
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Loss Amount</div>
                <motion.div 
                  className="text-6xl font-black text-red-600 tracking-tighter relative inline-block"
                >
                  $1,247
                  {step >= 4 && (
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "110%" }}
                      className="absolute top-1/2 left-[-5%] h-2 bg-red-600 rounded-full"
                    />
                  )}
                </motion.div>
                
                <AnimatePresence>
                  {step >= 4 && (
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
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Reason</div>
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

export default RejectionScreenSimulate;
