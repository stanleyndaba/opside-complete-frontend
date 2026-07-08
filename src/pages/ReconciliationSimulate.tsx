import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ReconciliationSimulate: React.FC = () => {
  const [step, setStep] = useState(1);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(2), 2000), // Show Approval
      setTimeout(() => setStep(3), 4000), // Show Actual Settlement
      setTimeout(() => setStep(4), 6000), // Variance & Strike-through
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Variance Ticker Effect
  useEffect(() => {
    if (step === 4) {
      let current = 0;
      const target = -435;
      const interval = setInterval(() => {
        current -= 17;
        if (current <= target) {
          setTicker(target);
          clearInterval(interval);
        } else {
          setTicker(current);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl bg-white border border-gray-100 rounded-[4px] shadow-xl grid max-h-[360px] overflow-hidden lg:grid-cols-[minmax(0,1fr)_250px]">
        
        <div className="min-w-0 flex flex-col border-r border-gray-100">
          {/* Ledger Header (Memory Simulate Style) */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5 py-3">
             <div>
               <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">Financial Audit Ledger</h2>
               <p className="mt-0.5 font-mono text-[10px] uppercase tracking-tight text-gray-500">SYS.ID: REC-009928</p>
             </div>
             <div className="flex items-center rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5">
               <span className="text-[10px] font-bold uppercase tracking-tight text-gray-600">Audit trail</span>
             </div>
          </div>
          
          {/* Ledger Body */}
          <div className="flex-1 overflow-y-auto bg-white px-5 pb-1 pt-1">
          
          {/* Row 1: Expected */}
          <div className="flex items-end justify-between border-b border-gray-100 py-3">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Expected Recovery</span>
             <span className="font-bold text-[14px] text-gray-900 tracking-tight">$1,847.00</span>
          </div>

          {/* Row 2: Approved */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-end justify-between border-b border-gray-100 overflow-hidden"
              >
                 <div className="flex items-center gap-3 py-3">
                   <span className="text-xs font-bold text-gray-900 uppercase tracking-tight">Amazon Approved</span>
                   <span className="text-[9px] font-mono text-emerald-600 border border-emerald-100 bg-emerald-50 rounded-[4px] px-1.5 py-0.5 uppercase tracking-tight">Verified</span>
                 </div>
                 <div className="relative py-3">
                   <span className={`font-bold text-[14px] tracking-tight ${step >= 4 ? 'text-gray-400' : 'text-gray-900'}`}>$1,847.00</span>
                   {step >= 4 && (
                     <motion.div 
                       initial={{ width: 0 }} 
                       animate={{ width: '100%' }} 
                       transition={{ duration: 0.4, ease: "easeOut" }}
                       className="absolute top-1/2 left-0 h-[2px] bg-red-500 -mt-px rounded-full" 
                     />
                   )}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Row 3: Reality */}
          <AnimatePresence>
            {step >= 3 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-end justify-between border-b border-gray-100 overflow-hidden"
              >
                 <div className="py-3">
                   <span className="text-xs font-bold text-gray-900 uppercase tracking-tight block">Actual Settlement Received</span>
                 </div>
                 <div className="py-3">
                   <span className="font-bold text-[14px] text-gray-900 tracking-tight">$1,412.00</span>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Row 4: Variance */}
          <AnimatePresence>
            {step >= 4 && (
              <motion.div 
                initial={{ opacity: 0, backgroundColor: '#ffffff' }}
                animate={{ opacity: 1, backgroundColor: '#fef2f2' }}
                transition={{ duration: 0.5 }}
                className="overflow-hidden rounded-[4px] border-b border-red-100 px-4 py-3"
              >
                 <div className="flex justify-between items-end">
                   <span className="text-xs font-bold text-red-700 uppercase tracking-tight">Variance Detected</span>
                   <span className="font-bold text-[14px] text-red-600 tracking-tight">
                     {ticker === 0 ? '-$0.00' : `-$${Math.abs(ticker)}.00`}
                   </span>
                 </div>
                 <div className="mt-2 text-[10px] font-mono text-red-500/80 uppercase tracking-tight">
                   [ERROR_CODE: VAR_9928] // [STATUS: UNDERPAID_RECOVERY]
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>

        {/* Neural Terminal (Agent 11) */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.aside
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="border-t border-gray-100 bg-[#F8FAFC] px-4 py-4 lg:border-l lg:border-t-0"
            >
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-tight text-gray-600">
                Terminal
              </div>
              <div className="space-y-1.5 font-mono text-[10px] uppercase tracking-tight text-gray-600">
                 <TerminalLine text="> Detecting variance..." delay={0} visible={step >= 2} />
                 <TerminalLine text="> Cross-referencing Settlement_ID: SET-9928-XJ..." delay={0.8} visible={step >= 3} />
                 <TerminalLine text="> Underpayment confirmed: $435.00" delay={1.8} visible={step >= 4} />
                 <TerminalLine text="> Initiating Appeal Protocol..." delay={2.6} visible={step >= 4} />
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 3.2 }}
                    className="mt-1 h-3 w-1.5 bg-emerald-500"
                 />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        
      </div>
    </div>
  );
};

const TerminalLine = ({ text, delay, visible }: { text: string; delay: number; visible: boolean }) => {
  const [visibleText, setVisibleText] = useState('');
  
  useEffect(() => {
    if (!visible) {
      setVisibleText('');
      return;
    }

    let timeout: NodeJS.Timeout;
    const startTimeout = setTimeout(() => {
      let i = 0;
      timeout = setInterval(() => {
        setVisibleText(text.slice(0, i + 1));
        i++;
        if (i === text.length) clearInterval(timeout);
      }, 25);
    }, delay * 1000);
    
    return () => {
      clearTimeout(startTimeout);
      clearInterval(timeout);
    };
  }, [text, delay, visible]);

  return <div>{visibleText}</div>;
};

export default ReconciliationSimulate;
