import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const TimelineSimulation = () => {
  // The 10-Step Recovery Story
  const steps = [
    "Supplier invoice issued",
    "Shipment created",
    "Units handed to carrier",
    "BOL generated",
    "POD signed",
    "Amazon received partial quantity",
    "Discrepancy detected",
    "Claim window opened",
    "Evidence pack prepared",
    "Seller approval required"
  ];

  const [currentStep, setCurrentStep] = useState(-1);

  // Simulation Logic: Progresses every 1.5 seconds
  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, steps.length]);

  return (
    <section className="bg-white py-24 px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Institutional Header */}
        <div className="mb-16">
          <h3 className="text-3xl font-serif font-bold text-gray-900 mb-4 tracking-tight">
            Reconstructing the shipment timeline
          </h3>
          <p className="text-gray-500 text-lg leading-relaxed max-w-xl">
            Margin does not just store documents. It reconstructs the recovery story Amazon needs to understand.
          </p>
        </div>

        {/* The Timeline Canvas */}
        <div className="relative pl-12 py-4">
          
          {/* 1. The Vertical Rail (Background) */}
          <div className="absolute left-[15px] top-0 bottom-0 w-[1px] bg-gray-100" />
          
          {/* 2. The Progress Rail (Active Blue) */}
          <motion.div 
            className="absolute left-[15px] top-0 w-[1px] bg-blue-600 origin-top"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: (currentStep + 1) / steps.length }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />

          {/* 3. The Steps */}
          <div className="space-y-10">
            {steps.map((step, index) => {
              const isActive = index <= currentStep;
              const isCurrent = index === currentStep;

              return (
                <div key={index} className="relative flex items-start group">
                  
                  {/* Step Node (The Indicator) */}
                  <motion.div 
                    className={`absolute -left-[45px] w-[30px] h-[30px] rounded-full border flex items-center justify-center bg-white z-10 transition-colors duration-500 ${
                      isActive ? 'border-blue-600' : 'border-gray-200'
                    }`}
                    initial={false}
                    animate={{ 
                      scale: isCurrent ? 1.1 : 1,
                      boxShadow: isCurrent ? "0 0 20px rgba(37, 99, 235, 0.2)" : "none"
                    }}
                  >
                    {isActive ? (
                      <motion.svg 
                        className="w-4 h-4 text-blue-600" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                    )}
                  </motion.div>

                  {/* Step Content */}
                  <motion.div
                    className="flex flex-col"
                    initial={{ opacity: 0.2, x: -10 }}
                    animate={{ 
                      opacity: isActive ? 1 : 0.2,
                      x: 0,
                    }}
                    transition={{ duration: 0.6 }}
                  >
                    <span className={`text-base tracking-tight ${
                      isActive ? 'text-gray-900 font-medium' : 'text-gray-400'
                    }`}>
                      {step}
                    </span>
                    
                    {isCurrent && (
                      <motion.span 
                        className="mt-1 text-[10px] font-mono font-bold text-blue-600 uppercase tracking-tight flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        Analyzing Data Stream...
                      </motion.span>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Institutional Footer */}
        <div className="mt-20 pt-10 border-t border-gray-50 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tight mb-1">
              Reconstruction Protocol
            </span>
            <span className="text-xs font-bold text-gray-900">
              STORY_ENGINE_V4.2
            </span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-tight">
              Active Intelligence
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimelineSimulation;
