import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle, ArrowRight } from 'lucide-react';

const ClaimSimulate = () => {
  const [step, setStep] = useState(0);

  const documents = [
    { id: 1, name: 'Supplier_Invoice_847.pdf', color: 'text-blue-500' },
    { id: 2, name: 'Proof_of_Delivery_NY.pdf', color: 'text-green-500' },
    { id: 3, name: 'Auth_Letter_2026.pdf', color: 'text-purple-500' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev < 4 ? prev + 1 : 0));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 font-sans p-8">
      {/* The Claim Form Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gray-900 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <h2 className="text-white font-medium ml-4 tracking-tight">Amazon Case: #50013020607</h2>
          </div>
          <span className="text-gray-400 text-sm font-mono">Status: Drafting</span>
        </div>

        {/* Form Content */}
        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Discrepancy Type</label>
            <div className="text-xl font-semibold text-gray-800">Inbound Shipment Shortage (6 Units)</div>
          </div>

          {/* The Evidence Vault Area */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Evidence Vault</label>
              {step === 4 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 text-green-600 text-sm font-bold"
                >
                  <CheckCircle size={16} />
                  UNBREAKABLE TRUTH SECURED
                </motion.div>
              )}
            </div>
            
            <div className="h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center relative bg-gray-50/50">
              {step === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-400 text-sm italic"
                >
                  Awaiting supporting documentation...
                </motion.div>
              )}

              <div className="flex gap-4 px-4 w-full justify-center">
                <AnimatePresence>
                  {documents.map((doc, index) => (
                    step > index && (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 50, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-2 bg-white p-3 rounded-lg shadow-sm border border-gray-100 w-40"
                      >
                        <FileText className={doc.color} size={24} />
                        <span className="text-[10px] font-medium text-gray-600 truncate w-full text-center">
                          {doc.name}
                        </span>
                      </motion.div>
                    )
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <motion.button
            animate={{ 
              backgroundColor: step === 4 ? '#111827' : '#F3F4F6',
              color: step === 4 ? '#FFFFFF' : '#9CA3AF'
            }}
            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
          >
            {step === 4 ? 'SUBMIT SURGICAL CLAIM' : 'WAITING FOR EVIDENCE...'}
            {step === 4 && <ArrowRight size={18} />}
          </motion.button>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 text-gray-400 text-sm font-medium tracking-widest uppercase"
      >
        Margin // Agentic Finance Infrastructure
      </motion.div>
    </div>
  );
};

export default ClaimSimulate;
