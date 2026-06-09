import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mail, HardDrive, MessageSquare, FileQuestion, XCircle } from 'lucide-react';

const EvidenceChaseSimulate = () => {
  const [stage, setStage] = useState(0); // 0: Start, 1: The Chase, 2: The Failure

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 1000), // Start the frantic search
      setTimeout(() => setStage(2), 4000), // The "None of them the right one" moment
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const platforms = [
    { icon: <img src="/gmailicon.png" alt="Email" className="w-5 h-5 object-contain" />, name: "Email", query: 'Searching "invoice"...' },
    { icon: <img src="/gd.png" alt="Google Drive" className="w-5 h-5 object-contain" />, name: "Google Drive", query: "Scanning PDF/2023..." },
    { icon: <img src="/whatsappicon.webp" alt="WhatsApp" className="w-5 h-5 object-contain" />, name: "WhatsApp", query: "Checking Supplier Chat..." },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 font-sans p-8 overflow-hidden">
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 relative">
        
        {/* Header removed as requested */}
        <div className="mb-4"></div>

        {/* The Frantic Search Animation */}
        <div className="relative h-48 flex items-center justify-center">
          <AnimatePresence>
            {stage === 1 && (
              <div className="space-y-4 w-full">
                {platforms.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.5 }}
                    className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100"
                  >
                    <div className="text-gray-400">{p.icon}</div>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">{p.name}</div>
                      <div className="text-sm font-medium text-gray-900">{p.query}</div>
                    </div>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Search size={14} className="text-blue-500" />
                    </motion.div>
                  </motion.div>
                ))}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                  className="text-center text-xs font-black text-gray-400 uppercase pt-2"
                >
                  847 results found...
                </motion.div>
              </div>
            )}

            {stage === 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <FileQuestion size={64} className="text-gray-300" />
                </motion.div>
                <h3 className="text-xl font-black text-gray-900 tracking-tighter">
                  None of them{' '}
                  <span className="text-red-500 underline decoration-2 underline-offset-4">the right one.</span>
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                  <XCircle size={14} /> Claim Window: 6 Days Remaining
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer: The Feeling */}
        <div className="mt-8 pt-6 border-t border-gray-50 text-center">
          <p className="text-sm text-gray-400 font-medium italic">
            "The money wasn't lost when Amazon made the error."
          </p>
        </div>
      </div>

    </div>
  );
};

export default EvidenceChaseSimulate;
