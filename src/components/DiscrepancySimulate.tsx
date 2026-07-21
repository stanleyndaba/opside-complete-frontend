import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Box, AlertCircle, Clock, Database } from 'lucide-react';

const DiscrepancySimulate = () => {
  const [scene, setScene] = useState(0); // 0: Start, 1: First, 2: Pile-up, 3: Text

  useEffect(() => {
    const timers = [
      setTimeout(() => setScene(1), 1000), // First card pops
      setTimeout(() => setScene(2), 2500), // Second card piles up
      setTimeout(() => setScene(3), 4000), // "Clear as day" text
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] font-sans p-8 overflow-hidden">
      {/* Background Simulation Feed */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none font-mono text-[10px] p-4 overflow-hidden leading-relaxed">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i}>SCANNING_FBA_INBOUND_LOGS... {Math.random().toString(16)}... SUCCESS</div>
        ))}
      </div>

      <div className="relative w-full max-w-lg h-[500px] flex flex-col items-center justify-center">
        
        {/* The Discrepancy Stack */}
        <div className="relative w-full h-64 flex items-center justify-center">
          
          {/* Card 2: FBA Fee Overcharge (The Pile-up) */}
          <AnimatePresence>
            {scene >= 2 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 40, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, y: 20, rotate: 5 }}
                className="absolute w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-100 p-6 z-20"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Audit Found</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">Fee Mismatch</span>
                </div>
                <div className="text-4xl font-black text-gray-900 tracking-tighter mb-1">$842.15</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-tight">FBA Fee Overcharge</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card 1: Inbound Shipment Shortage */}
          <AnimatePresence>
            {scene >= 1 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: scene >= 2 ? 0.95 : 1, 
                  y: scene >= 2 ? -40 : 0,
                  rotate: scene >= 2 ? -2 : 0
                }}
                className="absolute w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-10"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Live Audit</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md uppercase">
                    <Clock size={10} /> 45 Days Left
                  </div>
                </div>
                
                <div className="space-y-1 mb-6">
                  <div className="text-5xl font-black text-gray-900 tracking-tighter">$1,247</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-tight">Inbound Shipment Shortage</div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                    <Database size={12} /> Fee Audit
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                    <Box size={12} /> Inbound Qty
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scene 2 Text Reveal */}
        <div className="h-20 mt-12 text-center">
          <AnimatePresence>
            {scene >= 3 && (
              <motion.div
                initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                className="space-y-2"
              >
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  Clear as day in your account.
                </h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs font-bold uppercase tracking-tight text-gray-900"
                >
                  [ Tap to continue ]
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DiscrepancySimulate;
