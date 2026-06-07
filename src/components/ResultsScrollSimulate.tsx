import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, XCircle, AlertCircle } from 'lucide-react';

const ResultsScrollSimulate = () => {
  const [stage, setStage] = useState(0); // 0: Scrolling, 1: Stop/Failure

  useEffect(() => {
    const timer = setTimeout(() => setStage(1), 2500); // 2.5 seconds of rapid scrolling
    return () => clearTimeout(timer);
  }, []);

  // Simulated "Noise" Data
  const results = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    name: `INV_SHP_#${Math.floor(Math.random() * 90000)}.pdf`,
    date: '7 months ago'
  }));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] font-sans p-8 overflow-hidden">
      
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden relative h-[450px]">
        
        {/* The Rapid Scroll Container */}
        <div className="absolute inset-0 p-6">
          <AnimatePresence>
            {stage === 0 && (
              <motion.div 
                initial={{ y: 0 }}
                animate={{ y: -1000 }}
                transition={{ duration: 2.5, ease: "linear" }}
                className="space-y-3"
              >
                {results.map((res) => (
                  <div key={res.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <FileText size={20} className="text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-800">{res.name}</div>
                      <div className="text-xs font-medium text-gray-400">{res.date}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* The Failure Reveal */}
          <AnimatePresence>
            {stage === 1 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
              >
                <motion.div
                  initial={{ rotate: -10, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className="mb-6"
                >
                  <XCircle size={80} className="text-gray-200" />
                </motion.div>

                <div className="space-y-4">
                  <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">
                    847 Results Scanned
                  </h2>
                  <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-tight">
                    None of them&nbsp;
                    <span className="text-red-500 underline decoration-4 underline-offset-8">the right one.</span>
                  </h1>
                </div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-8 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                >
                  <AlertCircle size={14} /> Claim Closing in 48h
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Top Gradient Overlay (Glass Effect) */}
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-white to-transparent z-10" />
        {/* Bottom Gradient Overlay */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-white to-transparent z-10" />
      </div>

    </div>
  );
};

export default ResultsScrollSimulate;
