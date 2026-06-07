import React from 'react';
import { motion } from 'framer-motion';
import { User, Monitor, XCircle } from 'lucide-react';

const StareSimulate = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 font-sans p-8">
      <div className="relative flex flex-col items-center gap-16">
        
        {/* The Scene */}
        <div className="relative flex items-end justify-center gap-12">
          
          {/* The Seller (Silhouette) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <User size={120} className="text-gray-300" strokeWidth={1} />
              {/* Worried Eye/Expression Accent */}
              <motion.div 
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute top-1/3 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-400 rounded-full blur-sm"
              />
            </div>
          </motion.div>

          {/* The Screen */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="relative"
          >
            <Monitor size={160} className="text-gray-900" strokeWidth={1.5} />
            
            {/* The Rejection Content on Screen */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pt-2">
              <div className="w-20 h-24 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2">
                <XCircle size={24} className="text-red-500" />
                <div className="w-12 h-1 bg-gray-100 rounded-full" />
                <div className="w-8 h-1 bg-gray-100 rounded-full" />
              </div>
            </div>

            {/* Screen Glow */}
            <motion.div 
              animate={{ opacity: [0.1, 0.2, 0.1] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute inset-0 bg-red-500/10 blur-2xl rounded-full"
            />
          </motion.div>
        </div>

        {/* The Narrative Text */}
        <div className="text-center space-y-6 max-w-lg">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="text-3xl font-black text-gray-900 tracking-tighter leading-tight"
          >
            You stare at that screen...
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4, duration: 1 }}
            className="text-xl font-bold text-gray-400 italic"
          >
            and don't know what to do next.
          </motion.div>
        </div>

        {/* Branding Accent */}
        <div className="absolute -bottom-24 opacity-10 grayscale">
          <span className="font-black tracking-tighter text-4xl uppercase">Margin</span>
        </div>
      </div>
    </div>
  );
};

export default StareSimulate;
