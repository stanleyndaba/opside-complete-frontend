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
      setTimeout(() => setStep(5), 8000), // Neural Terminal Start
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Playfair+Display:wght@400;600;700&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}} />

      <div className="w-full max-w-2xl bg-white border border-black rounded-[2px] shadow-sm flex flex-col max-h-[520px] overflow-hidden">
        
        {/* Ledger Header */}
        <div className="px-6 py-4 border-b border-black flex justify-between items-end bg-white shrink-0">
           <h2 className="text-xs font-bold uppercase tracking-widest text-black">Financial Audit Ledger</h2>
           <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">SYS.ID: REC-009928</span>
        </div>
        
        {/* Ledger Body */}
        <div className="px-6 pb-2 pt-2 flex-1 overflow-y-auto bg-white">
          
          {/* Row 1: Expected */}
          <div className="flex justify-between items-end py-5 border-b border-gray-100">
             <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Expected Recovery</span>
             <span className="font-serif text-2xl text-black">$1,847.00</span>
          </div>

          {/* Row 2: Approved */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex justify-between items-end border-b border-gray-100 overflow-hidden"
              >
                 <div className="flex items-center gap-3 py-5">
                   <span className="text-xs font-semibold text-gray-900 uppercase tracking-widest">Amazon Approved</span>
                   <span className="text-[9px] font-mono text-emerald-600 border border-emerald-600/30 bg-emerald-50 px-1.5 py-0.5 uppercase tracking-widest">Verified</span>
                 </div>
                 <div className="relative py-5">
                   <span className={`font-serif text-2xl ${step >= 4 ? 'text-gray-400' : 'text-gray-900'}`}>$1,847.00</span>
                   {step >= 4 && (
                     <motion.div 
                       initial={{ width: 0 }} 
                       animate={{ width: '100%' }} 
                       transition={{ duration: 0.4, ease: "easeOut" }}
                       className="absolute top-1/2 left-0 h-[2px] bg-red-600 -mt-px" 
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
                className="flex justify-between items-end border-b border-gray-100 overflow-hidden"
              >
                 <div className="py-5">
                   <span className="text-xs font-semibold text-gray-900 uppercase tracking-widest block">Actual Settlement Received</span>
                 </div>
                 <div className="py-5">
                   <span className="font-serif text-3xl text-black">$1,412.00</span>
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
                className="py-5 px-4 -mx-4 border-b border-red-100 overflow-hidden"
              >
                 <div className="flex justify-between items-end">
                   <span className="text-xs font-bold text-red-700 uppercase tracking-widest">Variance Detected</span>
                   <span className="font-serif text-3xl text-red-600">
                     {ticker === 0 ? '-$0.00' : `-$${Math.abs(ticker)}.00`}
                   </span>
                 </div>
                 <div className="mt-2 text-[10px] font-mono text-red-500/80 uppercase tracking-wider">
                   [ERROR_CODE: VAR_9928] // [STATUS: UNDERPAID_RECOVERY]
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Neural Terminal (Agent 11) */}
        <AnimatePresence>
          {step >= 5 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-[#0a0a0a] p-5 shrink-0 border-t border-black"
            >
              <div className="font-mono text-[11px] text-emerald-400/90 space-y-1.5 uppercase tracking-widest">
                 <TerminalLine text="> Detecting variance..." delay={0} />
                 <TerminalLine text="> Cross-referencing Settlement_ID: SET-9928-XJ..." delay={0.8} />
                 <TerminalLine text="> Underpayment confirmed: $435.00" delay={1.8} />
                 <TerminalLine text="> Initiating Appeal Protocol..." delay={2.6} />
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 3.2 }}
                    className="w-1.5 h-3 bg-emerald-400 mt-1"
                 />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
      </div>
    </div>
  );
};

const TerminalLine = ({ text, delay }: { text: string, delay: number }) => {
  const [visibleText, setVisibleText] = useState('');
  
  useEffect(() => {
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
  }, [text, delay]);

  return <div>{visibleText}</div>;
};

export default ReconciliationSimulate;
