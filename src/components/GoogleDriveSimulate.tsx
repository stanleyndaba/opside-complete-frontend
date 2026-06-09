import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FileText, Search, Grid, List } from 'lucide-react';

const GoogleDriveSimulate = () => {
  const [activeFolder, setActiveFolder] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const folders = ["Invoices", "Suppliers", "Amazon Docs", "Archive"];

  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      if (count < 12) { // Rapidly cycle through folders
        setActiveFolder(Math.floor(Math.random() * folders.length));
        count++;
      } else {
        clearInterval(interval);
        setIsDone(true);
      }
    }, 300); // 300ms per "open/close" action

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F1F3F4] font-sans p-8 overflow-hidden">
      
      {/* Drive Window */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[480px]"
      >
        {/* Drive Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="bg-gray-100 h-10 rounded-lg flex-1 max-w-md flex items-center px-4 gap-3 text-gray-400">
              <Search size={18} />
              <span className="text-sm">Search in Drive</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-400 ml-4">
            <Grid size={20} />
            <List size={20} />
          </div>
        </div>

        {/* Folder Grid */}
        <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6 relative flex-1">
          {folders.map((name, i) => (
            <motion.div
              key={name}
              animate={{
                scale: activeFolder === i ? 1.05 : 1,
                backgroundColor: activeFolder === i ? "#E8F0FE" : "#FFFFFF",
                borderColor: activeFolder === i ? "#1A73E8" : "#E5E7EB"
              }}
              className="p-4 rounded-xl border flex flex-col items-center gap-3 transition-colors"
            >
              <motion.div
                animate={activeFolder === i ? { rotate: [0, -10, 10, 0] } : {}}
              >
                <Folder size={48} className={activeFolder === i ? "text-blue-500" : "text-gray-300"} />
              </motion.div>
              <span className="text-[11px] font-bold text-gray-600 uppercase tracking-tighter text-center">
                {name}
              </span>
            </motion.div>
          ))}

          {/* The "Opening" Simulation Overlay */}
          <AnimatePresence>
            {!isDone && (
              <motion.div 
                key={activeFolder}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.1, scale: 1.5 }}
                exit={{ opacity: 0, scale: 2 }}
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
              >
                <div className="w-64 h-64 bg-blue-500 rounded-full blur-[80px]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Text Reveal removed as requested */}
      </motion.div>
    </div>
  );
};

export default GoogleDriveSimulate;
