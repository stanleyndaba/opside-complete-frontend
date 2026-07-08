import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, CheckCircle2, ShieldAlert } from 'lucide-react';

const ReconciliationSimulate: React.FC = () => {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(2), 2000),
      setTimeout(() => setStep(3), 4000),
      setTimeout(() => setStep(4), 6000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl max-h-[520px] flex flex-col bg-white rounded-[4px] shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-3 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Payout Reconciliation</h2>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-tight mt-0.5">Real-Time Revenue Tracking</p>
          </div>
          <div className="bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">Audit Mode</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-3 flex-1 overflow-y-auto space-y-3">
          
          {/* Step 1 & 2: Expected vs Approved */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-gray-50 p-4 rounded-[4px] border border-gray-100"
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Expected Recovery</p>
              <h3 className="text-2xl font-black text-gray-900">$1,847</h3>
            </motion.div>

            <AnimatePresence>
              {step >= 2 && (
                <motion.div 
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-green-50 p-4 rounded-[4px] border border-green-100 relative overflow-hidden"
                >
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-tight mb-1">Amazon Approved</p>
                  <h3 className="text-2xl font-black text-green-700">$1,847</h3>
                  <CheckCircle2 className="absolute -bottom-1 -right-1 w-12 h-12 text-green-200 opacity-50" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 3: Actual Payout Received */}
          <AnimatePresence>
            {step >= 3 && (
              <motion.div 
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-gray-50 p-4 rounded-[4px] border border-gray-100 flex items-center justify-between"
              >
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Actual Payout Received</p>
                  <h3 className="text-3xl font-black text-gray-900">$1,412</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Settlement ID</p>
                  <p className="text-xs font-mono text-gray-500">SET-9928-XJ</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 4: Variance & Alert */}
          <AnimatePresence>
            {step >= 4 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 p-4 rounded-[4px]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-[4px] flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-red-900">Variance Detected</h4>
                      <p className="text-xs text-red-700">Underpaid — follow-up required</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-red-600">-$435</p>
                  </div>
                </div>

                <div className="bg-white/50 rounded-[4px] p-3 border border-red-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-medium text-red-900">Agent 11 is appealing the variance...</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <motion.div 
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 bg-red-500 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-gray-100 text-center shrink-0">
          <p className="text-xs text-gray-500 font-medium">
            "Amazon approval is not the same as money received. Margin tracks the case until the recovery is actually reconciled."
          </p>
        </div>

      </div>
    </div>
  );
};

export default ReconciliationSimulate;
