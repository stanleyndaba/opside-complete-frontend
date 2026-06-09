import React, { useState, useEffect } from 'react';

const ActionSimulate = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Scene 2 (0:03-0:05) & Scene 3 (0:05-0:07)
    const timers = [
      setTimeout(() => setStep(1), 0),    // 0s: Line 1 (Scene 2)
      setTimeout(() => setStep(2), 2000), // 2s: Line 2 (Scene 3)
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans p-12 text-center">
      <div className="max-w-2xl space-y-8">
        
        {/* Scene 2: The Request */}
        {step >= 1 && (
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
            They asked for the invoice.
          </h1>
        )}

        {/* Scene 3: The Response */}
        {step >= 2 && (
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
            So you opened your email.
          </h1>
        )}

      </div>
    </div>
  );
};

export default ActionSimulate;
