import React, { useState, useEffect } from 'react';

const IntroPainSimulate = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Sharp cuts, no easing, no fades.
    const timers = [
      setTimeout(() => setStep(1), 0),       // 0s: "Amazon denied the claim."
      setTimeout(() => setStep(2), 1500),     // 1.5s: "$1,247."
      setTimeout(() => setStep(3), 2500),     // 2.5s: "Gone."
      setTimeout(() => setStep(4), 4500),     // 4.5s: "Not because you were wrong."
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans p-12 text-center">
      <div className="max-w-3xl space-y-8">
        
        {/* Line 1: The Denial — bumped 55% from text-4xl (36px) → ~56px */}
        {step >= 1 && (
          <h1 className="font-black text-gray-900 tracking-tighter" style={{ fontSize: '56px', lineHeight: 1.05 }}>
            Amazon denied the claim.
          </h1>
        )}

        {/* Line 2: The Amount — bumped another 45% → ~81px */}
        {step >= 2 && (
          <h1 className="font-black text-gray-900 tracking-tighter" style={{ fontSize: '81px', lineHeight: 1.05 }}>
            $1,247.
          </h1>
        )}

        {/* Line 3: Gone — blue with underline */}
        {step >= 3 && (
          <h1 className="font-black tracking-tighter underline decoration-2 underline-offset-8" style={{ fontSize: '56px', lineHeight: 1.05, color: '#007aff' }}>
            Gone.
          </h1>
        )}

        {/* Line 4: The Gut Punch — bumped 30% → ~47px, "wrong" is blue + underlined */}
        {step >= 4 && (
          <h1 className="font-black text-gray-900 tracking-tighter" style={{ fontSize: '47px', lineHeight: 1.1 }}>
            Not because you were{' '}
            <span className="underline decoration-2 underline-offset-8" style={{ color: '#007aff' }}>
              wrong
            </span>.
          </h1>
        )}

      </div>
    </div>
  );
};

export default IntroPainSimulate;
