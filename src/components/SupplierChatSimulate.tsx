import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCheck, User, Send } from 'lucide-react';

const SupplierChatSimulate = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),  // Message appears
      setTimeout(() => setStep(2), 2000), // "Read" (Double Blue Check)
      setTimeout(() => setStep(3), 4500), // "No reply" text
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans p-6">
      
      {/* Phone Frame */}
      <div className="w-full max-w-[320px] bg-white rounded-[40px] shadow-2xl border-[8px] border-gray-900 h-[560px] overflow-hidden flex flex-col relative">
        
        {/* Chat Header */}
        <div className="bg-gray-50 p-4 pt-10 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User size={20} className="text-gray-400" />
          </div>
          <div>
            <div className="text-sm font-black text-gray-900">Factory Supplier</div>
            <div className="text-[10px] font-bold text-green-500 uppercase tracking-tight">Online</div>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 p-4 space-y-4 bg-[#f0f2f5]">
          <AnimatePresence>
            {step >= 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="ml-auto bg-[#dcf8c6] p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[80%] relative"
              >
                <p className="text-sm text-gray-800 leading-snug">
                  Hi, do you still have that invoice from last year?
                </p>
                <div className="flex justify-end mt-1">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center"
                  >
                    <CheckCheck size={14} className={step >= 2 ? "text-blue-500" : "text-gray-400"} />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Typing Indicator (The Tension) */}
          <AnimatePresence>
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-xs text-gray-400 font-medium italic"
              >
                <span>Supplier is typing</span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >...</motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
          <div className="flex-1 bg-gray-100 h-10 rounded-full px-4" />
          <div className="w-10 h-10 bg-[#007aff] rounded-full flex items-center justify-center text-white">
            <Send size={18} />
          </div>
        </div>

        {/* "No Reply" Overlay */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
              className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center p-8 text-center"
            >
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-tight">
                No reply.
              </h1>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "60px" }}
                className="h-1.5 bg-red-500 mt-4 rounded-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voiceover Caption */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-gray-400 font-bold uppercase tracking-tight text-xs"
      >
        You messaged your supplier.
      </motion.p>
    </div>
  );
};

export default SupplierChatSimulate;
