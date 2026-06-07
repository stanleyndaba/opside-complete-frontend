import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, CheckCircle2, FileText } from 'lucide-react';

const FileSimulate = () => {
  const [status, setStatus] = useState('idle'); // idle, filing, success

  const handleFile = () => {
    setStatus('filing');
    setTimeout(() => setStatus('success'), 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 font-sans p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 space-y-8 relative overflow-hidden"
      >
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#007aff]/10 rounded-2xl text-[#007aff]">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recovery Submission</h3>
            <p className="text-sm text-gray-500 font-medium">Optimized for Amazon Policy</p>
          </div>
        </div>

        {/* Case Details Card */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3">
          <div className="flex justify-between text-sm font-semibold text-gray-400">
            <span>Case Value</span>
            <span>Marketplace</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-black text-gray-900">$1,247.50</span>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Amazon US</span>
          </div>
        </div>

        {/* The Action Area */}
        <div className="relative h-24 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.button
                key="idle-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={handleFile}
                className="group w-full py-5 bg-[#007aff] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 relative overflow-hidden"
              >
                <motion.div 
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                />
                <span className="relative z-10 flex items-center gap-2">
                  <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  Submit Recovery Claim
                </span>
              </motion.button>
            )}

            {status === 'filing' && (
              <motion.div
                key="filing-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Loader2 size={32} className="text-blue-600" />
                </motion.div>
                <span className="text-sm font-bold text-gray-600 animate-pulse">
                  BINDING EVIDENCE & SUBMITTING...
                </span>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="success-state"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                  <CheckCircle2 size={32} />
                </div>
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-900">CLAIM FILED</span>
                  <span className="text-xs font-mono text-gray-400">AMZ-CASE: #50013020607</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Stats */}
        <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
          <div className="text-xs font-semibold text-gray-400">
            Founding Member Benefit
          </div>
          <div className="text-xs font-bold text-gray-400">MARGIN</div>
        </div>
      </motion.div>

      {/* Branding */}
      <div className="mt-12 flex items-center gap-2 opacity-30 grayscale">
        <div className="w-8 h-8 bg-gray-900 rounded-lg" />
        <span className="font-black tracking-tighter text-xl">MARGIN</span>
      </div>
    </div>
  );
};

export default FileSimulate;
