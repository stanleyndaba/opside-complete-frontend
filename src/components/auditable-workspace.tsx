'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Hash, ShieldCheck, Archive, Clock, Fingerprint } from 'lucide-react';

const auditCards = [
  {
    title: 'Primary Evidence Pack',
    subtitle: 'Dimensional Data & Weights',
    id: 'EVID-99283',
    hash: 'sha256:7a1b...c9d4',
    icon: <FileText className="w-5 h-5 text-gray-900" />,
  },
  {
    title: 'Amazon Case Log',
    subtitle: 'Submission ID: 148827391',
    id: 'CASE-44210',
    hash: 'sha256:3e5f...a2b1',
    icon: <Archive className="w-5 h-5 text-gray-900" />,
  },
  {
    title: 'Reimbursement Receipt',
    subtitle: 'Settlement: APR-2026-04',
    id: 'RCPT-11029',
    hash: 'sha256:9d8c...f7e6',
    icon: <ShieldCheck className="w-5 h-5 text-gray-900" />,
  },
];

export default function AuditableWorkspace() {
  const [visibleCards, setVisibleCards] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCards((prev) => {
        if (prev < auditCards.length) return prev + 1;
        setIsVerified(true);
        clearInterval(interval);
        return prev;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans overflow-hidden">
      <div className="w-full max-w-xl flex flex-col items-center">

        {/* Workspace Frame */}
        <div className="w-full bg-gray-50/50 rounded-[40px] p-10 border border-gray-100 relative min-h-[450px] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <div className="w-3 h-3 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-gray-300" />
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Real-time Archive</span>
            </div>
          </div>

          {/* Audit Trail Line */}
          <div className="absolute left-[63px] top-[140px] bottom-[100px] w-px bg-gray-100 z-0" />

          {/* Cards Stack */}
          <div className="space-y-4 relative z-10">
            <AnimatePresence>
              {auditCards.slice(0, visibleCards).map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-5"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900">{card.title}</h4>
                    <p className="text-[11px] text-gray-400 font-medium">{card.subtitle}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md">
                      <Fingerprint className="w-3 h-3 text-gray-400" />
                      <span className="text-[9px] font-mono text-gray-400">{card.hash}</span>
                    </div>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">{card.id}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Verification Seal */}
          <AnimatePresence>
            {isVerified && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-10 flex items-center justify-center gap-3 py-4 bg-[#111827] rounded-2xl"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-[0.2em]">
                  Immutable Audit Trail Verified
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* The Core Text */}
        <div className="mt-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-medium text-[#111827] max-w-md leading-tight"
          >
            And produces fully auditable <br />
            <span className="font-bold italic">outputs, all in your workspace</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-4 text-[10px] text-gray-300 uppercase tracking-widest font-medium"
          >
            Compliance Standard: FBA-REIMB-2026-v2
          </motion.p>
        </div>

      </div>
    </div>
  );
}
