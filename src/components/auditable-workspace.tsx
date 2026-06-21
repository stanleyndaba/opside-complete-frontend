'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Archive, Clock, FileText, Fingerprint, ShieldCheck } from 'lucide-react';

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
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-white p-6 font-sans">
      <div className="flex w-full max-w-lg flex-col items-center">

        {/* Workspace Frame */}
        <motion.div
          animate={{ borderColor: isVerified ? '#D1D5DB' : '#F3F4F6' }}
          transition={{ duration: 0.6 }}
          className="relative flex min-h-[350px] w-full flex-col rounded-2xl border bg-gray-50/50 p-6"
        >

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
              <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
              <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-[10px] font-medium uppercase tracking-tight text-gray-400">Real-time Archive</span>
            </div>
          </div>

          {/* Audit Trail Line */}
          <div className="absolute bottom-8 left-[43px] top-[92px] z-0 w-px bg-gray-200" />

          {/* Cards Stack */}
          <div className="relative z-10 space-y-3">
            <AnimatePresence>
              {auditCards.slice(0, visibleCards).map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                    {card.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[13px] font-semibold text-gray-900">{card.title}</h4>
                    <p className="text-[10px] font-medium text-gray-400">{card.subtitle}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <div className="flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1">
                      <Fingerprint className="h-3 w-3 text-gray-400" />
                      <span className="text-[9px] font-mono text-gray-400">{card.hash}</span>
                    </div>
                    <span className="text-[9px] font-semibold uppercase tracking-tight text-gray-300">{card.id}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
