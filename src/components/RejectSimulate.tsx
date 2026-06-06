import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, AlertTriangle, FileX, ArrowCcw } from 'lucide-react';

const RejectSimulate = () => {
  const [status, setStatus] = useState('pending'); // pending, rejected

  useEffect(() => {
    const timer = setTimeout(() => setStatus('rejected'), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 font-sans p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative"
      >
        {/* Header */}
        <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileX size={20} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">Amazon Case #4925828</span>
          </div>
          <motion.span 
            animate={{ 
              color: status === 'rejected' ? '#EF4444' : '#6B7280',
              backgroundColor: status === 'rejected' ? '#FEE2E2' : '#F3F4F6'
            }}
            className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest"
          >
            {status === 'pending' ? 'Under Review' : 'Rejected'}
          </motion.span>
        </div>

        {/* Claim Content */}
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Claim Amount</label>
            <div className="text-5xl font-black text-gray-900 tracking-tighter">$574.02</div>
          </div>

          <div className="space-y-4">
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: status === 'rejected' ? "100%" : "60%" }}
                transition={{ duration: 2 }}
                className={`h-full ${status === 'rejected' ? 'bg-red-500' : 'bg-blue-500'}`}
              />
            </div>
            
            <div className="space-y-2">
              <div className="h-3 w-3/4 bg-gray-100 rounded-full" />
              <div className="h-3 w-1/2 bg-gray-100 rounded-full" />
            </div>
          </div>

          {/* Rejection Overlay */}
          <AnimatePresence>
            {status === 'rejected' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center space-y-4"
              >
                <motion.div
                  initial={{ rotate: -10, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                >
                  <XCircle size={80} className="text-red-500" />
                </motion.div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-red-600 tracking-tighter uppercase">Claim Rejected</h2>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">
                    "The documentation provided does not meet the policy requirements for inbound reconciliation."
                  </p>
                </div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="pt-4 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest"
                >
                  <ArrowCcw size={14} />
                  Awaiting Manual Fix...
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
          <div className="flex items-center gap-2 opacity-20 grayscale">
            <div className="w-4 h-4 bg-gray-900 rounded-sm" />
            <span className="font-black tracking-tighter text-xs uppercase">Margin</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RejectSimulate;
