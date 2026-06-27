import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const AmazonAsks = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 4000),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-12 text-center font-sans">
      <div className="relative flex w-full max-w-4xl flex-col items-center justify-center">
        <div className="flex h-40 flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.h1
                key="what-happened"
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                className="text-5xl font-black tracking-tighter text-gray-900"
              >
                Amazon does not just ask what happened.
              </motion.h1>
            )}
            {step === 2 && (
              <motion.h1
                key="prove-it"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                className="text-5xl font-black tracking-tighter text-gray-900"
              >
                <span className="text-[#007aff]">It asks you to prove it.</span>
              </motion.h1>
            )}
            {step === 3 && (
              <motion.h1
                key="proof-pack"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl text-5xl font-black tracking-tighter text-gray-900"
              >
                Margin turns the evidence chase into a claim-ready proof pack.
              </motion.h1>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AmazonAsks;
