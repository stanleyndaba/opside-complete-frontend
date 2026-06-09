import React, { useState, useEffect } from 'react';

const IntroPainSimulate = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Sharp cuts, no easing, no fades. 
    // Total duration: 3 seconds.
    const timers = [
      setTimeout(() => setStep(1), 0),    // 0s: Line 1
      setTimeout(() => setStep(2), 1000), // 1s: Line 2
      setTimeout(() => setStep(3), 2000), // 2s: Line 3
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans p-12 text-center">
      <div className="max-w-2xl space-y-6">
        
        {/* Line 1: The Moment */}
        {step >= 1 && (
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
            Amazon rejected your claim.
          </h1>
        )}

        {/* Line 2: The Fact */}
        {step >= 2 && (
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
            The proof existed.
          </h1>
        )}

        {/* Line 3: The Painful Reminder */}
        {step >= 3 && (
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
            It didn't matter.
          </h1>
        )}

      </div>
    </div>
  );
};

export default IntroPainSimulate;
