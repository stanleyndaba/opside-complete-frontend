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
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-[4px] shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 tracking-tight">Payout Reconciliation</h2>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-tight mt-1">Real-Time Revenue Tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">Audit Mode</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 space-y-4">
          
          {/* Step 1 & 2: Expected vs Approved */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col"
            >
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight mb-2">Expected Recovery</p>
              <h3 className="text-xl font-medium text-gray-900 tracking-tight">$1,847</h3>
            </motion.div>

            <AnimatePresence>
              {step >= 2 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col"
                >
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight mb-2">Amazon Approved</p>
                  <h3 className="text-xl font-medium text-emerald-600 tracking-tight">$1,847</h3>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-px bg-gray-50 w-full" />

          {/* Step 3: Actual Payout Received */}
          <AnimatePresence>
            {step >= 3 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col"
              >
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight mb-2">Actual Payout Received</p>
                    <h3 className="text-2xl font-medium text-gray-900 tracking-tight">$1,412</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight mb-1">Settlement ID</p>
                    <p className="text-[10px] font-mono text-gray-400">SET-9928-XJ</p>
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
                transition={{ duration: 0.5 }}
                className="pt-4"
              >
                <div className="border border-red-100/50 bg-red-50/30 rounded-[4px] p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xs font-semibold text-red-900 uppercase tracking-tight mb-1">Variance Detected</h4>
                      <p className="text-[11px] text-red-600/80">Underpaid — follow-up required</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-medium text-red-600 tracking-tight">-$435</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-red-100/50">
                    <span className="text-[11px] font-medium text-gray-500">Agent 11 is appealing the variance...</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          className="w-1.5 h-1.5 bg-red-400 rounded-full"
                        />
                      ))}
                    </div>
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
