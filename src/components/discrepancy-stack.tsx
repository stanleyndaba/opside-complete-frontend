'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle2, ShieldAlert, ArrowUpRight } from 'lucide-react';

const discrepancies = [
    {
        type: 'Duplicate Charge — Identified',
        desc: 'A charge or adjustment appears more than once against the same seller event, without a clean offset in the record trail. · Settlement SETTLE-ACME-004',
        ref: 'Ref ACM-LI-2604-0017',
        found: 'Jan 26, 2026, 12:06 PM',
        status: 'Claim candidate',
        timeLeft: '30 days left',
        value: '$853.60',
        movement: 'Preparing case',
        movementDesc: 'Identifiers and evidence are being reconciled before this moves into Amazon filing.',
        color: 'text-blue-600',
        icon: <Clock className="w-4 h-4" />
    },
    {
        type: 'Fee Charge Review — Logged',
        desc: 'A storage-related charge appears to have been applied more than the seller record supports. · $1484.80 charged vs $742.40 expected',
        ref: 'Ref ACM-FD-2604-0018',
        found: 'Jan 21, 2026, 06:37 PM',
        status: 'Claim candidate',
        timeLeft: '28 days left',
        value: '$900.95',
        movement: 'Ready to file',
        movementDesc: 'Evidence and policy checks are aligned for seller review.',
        color: 'text-emerald-600',
        icon: <CheckCircle2 className="w-4 h-4" />
    },
    {
        type: 'Inbound Shipment Shortage — Logged',
        desc: 'Amazon received fewer units than the inbound shipment record shows were shipped. · 60 shipped, 46 received · 14-unit gap at ONT8',
        ref: 'Ref ACM-IR-2604-0020',
        found: 'Jan 12, 2026, 04:16 PM',
        status: 'Review only',
        timeLeft: '24 days left',
        value: '$995.65',
        movement: 'Blocked',
        movementDesc: 'Blocked: Margin found a possible duplicate or previously handled recovery path, so it is holding this before another Amazon submission is created.',
        color: 'text-amber-600',
        icon: <ShieldAlert className="w-4 h-4" />
    }
];

export default function DiscrepancyStack() {
    const [visibleCount, setVisibleCount] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setVisibleCount((prev) => (prev < 3 ? prev + 1 : prev));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-8 font-sans overflow-hidden">
            <div className="w-full max-w-2xl flex flex-col items-center">

                <div className="w-full space-y-8 relative">
                    <AnimatePresence>
                        {discrepancies.slice(0, visibleCount).map((item, idx) => (
                            <motion.div
                                key={idx}
                                layout
                                initial={{ opacity: 0, y: 100, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                                className="w-full py-8 border-b border-gray-50 last:border-0 group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                                            {item.type}
                                            {item.movement === 'Blocked' && (
                                                <motion.span
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-widest"
                                                >
                                                    Intelligence Hold
                                                </motion.span>
                                            )}
                                        </h3>
                                        <p className="text-xs text-gray-400 font-medium">{item.ref} · {item.found}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-[#111827]">{item.value}</p>
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Estimated Value</p>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-xl">
                                    {item.desc}
                                </p>

                                <div className="grid grid-cols-3 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Status</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Review only' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                                            <span className="text-xs font-bold text-gray-700">{item.status}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Filing Movement</p>
                                        <div className={`flex items-center gap-2 text-xs font-bold ${item.color}`}>
                                            {item.icon}
                                            {item.movement}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Time Remaining</p>
                                        <span className="text-xs font-bold text-gray-700">{item.timeLeft}</span>
                                    </div>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-6 p-4 bg-gray-50/50 rounded-xl border border-gray-100/50"
                                >
                                    <p className="text-[11px] text-gray-500 italic leading-snug">
                                        {item.movementDesc}
                                    </p>
                                </motion.div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Global Footer Text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: visibleCount === 3 ? 1 : 0 }}
                    className="mt-16 text-center"
                >
                    <div className="flex items-center gap-2 justify-center mb-4">
                        <div className="h-px w-8 bg-gray-100" />
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">Total Identified Recovery</span>
                        <div className="h-px w-8 bg-gray-100" />
                    </div>
                    <h2 className="text-4xl font-black text-[#111827] tracking-tighter">$2,750.20</h2>
                    <button className="mt-8 px-8 py-4 bg-[#111827] text-white rounded-full font-bold text-sm flex items-center gap-2 hover:bg-black transition-all group">
                        Begin Bulk Filing
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </motion.div>

            </div>
        </div>
    );
}