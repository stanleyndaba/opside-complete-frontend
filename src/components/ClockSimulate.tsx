import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// No icons needed for this component

const ClockSimulate = () => {
  const [timePassed, setTimePassed] = useState('Day 1');
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    const sequence = [
      { label: 'Day 1', delay: 1000 },
      { label: 'Day 3', delay: 1000 },
      { label: '1 Week Later', delay: 1500 },
      { label: '2 Weeks Later', delay: 2000 },
    ];

    let current = 0;
    const timer = setInterval(() => {
      if (current < sequence.length - 1) {
        current++;
        setTimePassed(sequence[current].label);
      } else {
        setIsRotating(false);
        clearInterval(timer);
      }
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 font-sans p-8">
      <div className="relative flex flex-col items-center gap-12">
        
        {/* The Surgical Clock */}
        <div className="relative w-48 h-48 rounded-full border-4 border-gray-200 bg-white shadow-inner flex items-center justify-center">
          {/* Clock Center Dot */}
          <div className="absolute w-3 h-3 bg-gray-900 rounded-full z-20" />
          
          {/* Hour Hand */}
          <motion.div 
            animate={{ rotate: isRotating ? 360 * 5 : 0 }}
            transition={{ duration: 6, ease: "linear" }}
            className="absolute w-1 h-12 bg-gray-400 rounded-full origin-bottom z-10"
            style={{ bottom: '50%' }}
          />

          {/* Minute Hand */}
          <motion.div 
            animate={{ rotate: isRotating ? 360 * 20 : 0 }}
            transition={{ duration: 6, ease: "linear" }}
            className="absolute w-1.5 h-16 bg-gray-900 rounded-full origin-bottom z-10"
            style={{ bottom: '50%' }}
          />

          {/* Subtle Tick Marks */}
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-0.5 h-2 bg-gray-100"
              style={{ 
                transform: `rotate(${i * 30}deg) translateY(-84px)`,
                transformOrigin: 'center'
              }}
            />
          ))}
        </div>

        {/* The Narrative Text */}
        <div className="text-center space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={timePassed}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-3xl font-black text-gray-900 tracking-tighter uppercase"
            >
              {timePassed}
            </motion.div>
          </AnimatePresence>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="text-sm font-bold text-gray-500 tracking-[0.2em] uppercase"
          >
            {isRotating ? 'The Uncertainty Phase' : 'The Wait is Over'}
          </motion.div>
        </div>

        {/* Branding Accent */}
        <div className="absolute -bottom-24 opacity-10 grayscale">
          <span className="font-black tracking-tighter text-4xl">MARGIN</span>
        </div>
      </div>
    </div>
  );
};

export default ClockSimulate;
