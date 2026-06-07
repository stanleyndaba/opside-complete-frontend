import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, CheckCircle2 } from 'lucide-react';

const DiscoverySimulate = () => {
  const [phase, setPhase] = useState(0); // 0: Start, 1: Meeting, 2: Reveal, 3: Text

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),  // Document & Microscope move
      setTimeout(() => setPhase(2), 2000), // Collision & Discrepancy reveal
      setTimeout(() => setPhase(3), 3500), // "You found it" text
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] font-sans p-12 overflow-hidden">
      
      <div className="relative w-full max-w-3xl h-[400px] flex items-center justify-center">
        
        {/* Human Figure (Static/Subtle Pulse) */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-10 flex flex-col items-center gap-3 opacity-20"
        >
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <User size={32} className="text-gray-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Auditor</span>
        </motion.div>

        {/* The Document (Sliding from Left) */}
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: phase >= 1 ? -40 : -300, opacity: phase >= 1 ? 1 : 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="absolute z-10 w-48 h-64 bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex flex-col gap-3"
        >
          <div className="h-3 w-3/4 bg-gray-100 rounded-full" />
          <div className="h-3 w-1/2 bg-gray-100 rounded-full" />
          <div className="mt-auto h-8 w-full bg-gray-50 rounded-lg border border-dashed border-gray-200" />
          
          {/* The Revealed Discrepancy */}
          <AnimatePresence>
            {phase >= 2 && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 bg-white rounded-xl p-4 flex flex-col items-center justify-center border-2 border-[#007aff]"
              >
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <CheckCircle2 size={40} className="text-[#007aff] mb-2" />
                </motion.div>
                <span className="text-[10px] font-black text-[#007aff] uppercase tracking-tighter text-center">
                  Discrepancy Identified
                </span>
                <span className="text-xl font-black text-gray-900 mt-1">$1,247</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* The Microscope/Search (Sliding from Right) */}
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: phase >= 1 ? 80 : 300, opacity: phase >= 1 ? 1 : 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="absolute z-20 w-32 h-32 bg-[#007aff]/5 rounded-full border-4 border-[#007aff] flex items-center justify-center backdrop-blur-sm"
        >
          <Search size={48} className="text-[#007aff]" />
          
          {/* Scanning Beam Effect */}
          <motion.div 
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full bg-[#007aff]/10"
          />
        </motion.div>

      </div>

      {/* "You found it" Text Reveal */}
      <div className="h-24 mt-8">
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div
              initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              className="text-center space-y-2"
            >
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
                You found it.
              </h1>
              <div className="h-1 w-12 bg-[#007aff] mx-auto rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default DiscoverySimulate;
