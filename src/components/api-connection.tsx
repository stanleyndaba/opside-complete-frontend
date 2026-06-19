'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, CheckCircle2 } from 'lucide-react';

function ConnectionCheck({ complete }: { complete: boolean }) {
  return (
    <div className="relative h-16 w-16">
      <motion.div
        animate={{ rotate: complete ? 360 : 720 }}
        transition={{ duration: complete ? 0.4 : 1.2, repeat: complete ? 0 : Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-full border-[3px] border-emerald-100 border-t-[#3aaa78]"
      />
      <AnimatePresence>
        {complete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 460, damping: 18 }}
            className="absolute inset-0 flex items-center justify-center rounded-full border-[3px] border-[#3aaa78] bg-emerald-50 text-[#3aaa78]"
          >
            <Check className="h-7 w-7" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ApiConnection() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status !== 'connecting') return;

    const interval = window.setInterval(() => {
      setProgress((previous) => Math.min(previous + 2, 100));
    }, 50);

    return () => window.clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status !== 'connecting' || progress < 100) return;

    const timeout = window.setTimeout(() => setStatus('success'), 650);
    return () => window.clearTimeout(timeout);
  }, [progress, status]);

  const handleConnect = () => {
    setStatus('connecting');
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
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white p-7 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
      >
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white">
                  <img src="/amazon-logo-transparent-circle.png" alt="Amazon" className="h-10 w-10 object-cover" />
                </div>
                <div className="flex-1 px-5">
                  <div className="relative h-px w-full bg-gray-200">
                    <motion.div
                      initial={{ left: 0 }}
                      animate={{ left: '100%' }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-[3px] h-1.5 w-1.5 -translate-x-full rounded-full bg-gray-400"
                    />
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                  <img src="/logoimagetwo.png" alt="Margin" className="h-4 w-auto object-contain" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">Connect Amazon Store</h2>
                <p className="mx-auto max-w-xs text-sm text-gray-500">Authorize Margin to access your SP-API data for automated recovery.</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: '#0062CC' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConnect}
                className="mx-auto flex h-10 w-fit items-center justify-center rounded-xl bg-[#007AFF] px-6 text-sm font-medium text-white shadow-md shadow-blue-100 transition-colors"
              >
                Authorize Seller Central
              </motion.button>
            </motion.div>
          )}

          {status === 'connecting' && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center space-y-5 py-8"
            >
              <ConnectionCheck complete={progress >= 100} />
              <div className="space-y-1.5 text-center">
                <h3 className="text-lg font-medium text-gray-900">Syncing Permissions</h3>
                <p className="text-xs text-gray-400">Establishing secure bridge · {progress}%</p>
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 shadow-md shadow-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-emerald-900">Store Connected</h3>
                  <p className="text-xs text-emerald-700 opacity-80">Store ID: A3N1V7R2X82L</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="mb-2 text-sm font-medium text-gray-700">Active API permissions</p>
                {permissions.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group flex items-center justify-between rounded-lg border border-transparent bg-gray-50 p-3 transition-all hover:border-gray-100 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      <div>
                        <p className="text-[13px] font-medium text-gray-900">{p.name}</p>
                        <p className="text-[10px] leading-4 text-gray-500">{p.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#007AFF] transition-colors" />
                  </motion.div>
                ))}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
