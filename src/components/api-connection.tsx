'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, RefreshCw, CheckCircle2, Lock, ArrowRight, Zap } from 'lucide-react';

export default function ApiConnection() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success'>('idle');
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (status === 'connecting') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStatus('success'), 500);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [status]);

  const handleConnect = () => {
    setStatus('connecting');
    setProgress(0);
  };

  const handleReset = () => {
    setStatus('idle');
    setProgress(0);
  };

  const permissions = [
    { name: 'Inventory Data', description: 'Real-time stock & movement tracking' },
    { name: 'Financial Records', description: 'Access to settlement & fee reports' },
    { name: 'Order Management', description: 'Shipment & fulfillment logs' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <motion.div
        layout
        className="w-full max-w-xl bg-white rounded-[32px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden"
      >
        {/* Background Decorative Element */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-50 overflow-hidden">
          {status === 'connecting' && (
            <motion.div
              className="h-full bg-[#007AFF]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          )}
        </div>

        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Zap className="w-7 h-7 text-[#007AFF]" />
                </div>
                <div className="flex-1 px-6">
                  <div className="h-px bg-dashed bg-gray-200 w-full relative">
                    <motion.div
                      animate={{ x: [0, 100, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute -top-1 w-2 h-2 bg-gray-300 rounded-full"
                    />
                  </div>
                </div>
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" className="w-8" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">Connect Amazon Store</h2>
                <p className="text-gray-500 max-w-xs mx-auto">Authorize Margin to access your SP-API data for automated recovery.</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: '#0062CC' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConnect}
                className="w-full bg-[#007AFF] text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-colors"
              >
                <ShieldCheck className="w-5 h-5" />
                Authorize via Seller Central
              </motion.button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 uppercase tracking-widest font-semibold">
                <Lock className="w-3 h-3" />
                AES-256 Encrypted Connection
              </div>
            </motion.div>
          )}

          {status === 'connecting' && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center space-y-8"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 border-4 border-blue-50 border-t-[#007AFF] rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-[#007AFF] animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-medium text-gray-900">Syncing Permissions</h3>
                <p className="text-sm text-gray-400 font-mono uppercase tracking-tighter">Establishing Secure Bridge... {progress}%</p>
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-900 text-lg">Store Connected</h3>
                  <p className="text-emerald-700 text-sm opacity-80">Store ID: A3N1V7R2X82L</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Active API Permissions</p>
                {permissions.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-[10px] text-gray-500">{p.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#007AFF] transition-colors" />
                  </motion.div>
                ))}
              </div>

              <button
                onClick={handleReset}
                className="w-full text-gray-400 text-xs hover:text-gray-600 transition-colors"
              >
                Disconnect & Reset Simulation
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
