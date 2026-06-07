import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const StatementSimulate = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white font-sans p-12">
      <div className="max-w-3xl text-center">
        <motion.h1
          initial={{ 
            opacity: 0, 
            filter: "blur(20px)", 
            letterSpacing: "0.2em",
            scale: 0.95 
          }}
          animate={show ? { 
            opacity: 1, 
            filter: "blur(0px)", 
            letterSpacing: "-0.02em",
            scale: 1 
          } : {}}
          transition={{ 
            duration: 1.2, 
            ease: [0.16, 1, 0.3, 1] // Premium Apple-style ease-out
          }}
          className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight"
        >
          Not because the money   
 
          <span className="text-gray-300"> wasn't real.</span>
        </motion.h1>

        {/* The "Pause" Indicator (Subtle) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={show ? { opacity: 0.2 } : {}}
          transition={{ delay: 2, duration: 1 }}
          className="mt-12 flex justify-center gap-1"
        >
          <div className="w-1 h-1 bg-gray-900 rounded-full animate-bounce" />
          <div className="w-1 h-1 bg-gray-900 rounded-full animate-bounce [animation-delay:0.2s]" />
          <div className="w-1 h-1 bg-gray-900 rounded-full animate-bounce [animation-delay:0.4s]" />
        </motion.div>
      </div>
    </div>
  );
};

export default StatementSimulate;
