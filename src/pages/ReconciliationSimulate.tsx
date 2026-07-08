import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ReconciliationSimulate: React.FC = () => {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(2), 2000), // Show Approval
      setTimeout(() => setStep(3), 4000), // Show Actual Payout
      setTimeout(() => setStep(4), 6000), // Show Variance & Alert
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans relative">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
      `}} />

      <div className="w-full max-w-2xl bg-white rounded-[4px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative z-10">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 tracking-tight">Payout Reconciliation</h2>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-tight mt-0.5">Real-Time Revenue Tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tight">Audit Mode</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          
          {/* Step 1 & 2: Expected vs Approved */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col p-4 bg-gray-50/50 rounded-[4px] border border-gray-100/50"
            >
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-tight mb-2">Expected Recovery</p>
              <h3 className="text-2xl font-serif text-gray-900 tracking-tight">$1,847</h3>
            </motion.div>

            <AnimatePresence>
              {step >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col p-4 bg-emerald-50/30 rounded-[4px] border border-emerald-100/50"
                >
                  <p className="text-[10px] font-medium text-emerald-600/70 uppercase tracking-tight mb-2">Amazon Approved</p>
                  <h3 className="text-2xl font-serif text-emerald-600 tracking-tight">$1,847</h3>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent w-full opacity-50" />

          {/* Step 3: Actual Payout Received */}
          <AnimatePresence>
            {step >= 3 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col p-5 bg-white border border-gray-100 shadow-sm rounded-[4px]"
              >
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight mb-2">Actual Payout Received</p>
                    <h3 className="text-4xl font-serif text-gray-900 tracking-tight">$1,412</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight mb-1">Settlement ID</p>
                    <p className="text-[10px] font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded-[2px] border border-gray-100">SET-9928-XJ</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 4: Variance & Alert */}
          <AnimatePresence>
            {step >= 4 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="border-l-2 border-red-500 bg-gradient-to-r from-red-50/50 to-transparent p-5 rounded-r-[4px]">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-red-900 uppercase tracking-tight mb-1">Variance Detected</h4>
                      <p className="text-[11px] text-red-600/80 font-medium">Underpaid — follow-up required</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-serif text-red-600 tracking-tight">-$435</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                          className="w-1.5 h-1.5 bg-red-500 rounded-full"
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-red-800/70">Agent 11 is appealing the variance...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default ReconciliationSimulate;
