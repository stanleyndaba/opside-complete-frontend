'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, ShieldAlert, ArrowUpRight } from 'lucide-react';

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
        color: 'text-sky-600',
        dotColor: 'bg-sky-400',
        icon: <Clock className="w-3.5 h-3.5" />
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
        dotColor: 'bg-emerald-400',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />
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
        movementDesc: 'Margin found a possible duplicate or previously handled recovery path, so it is holding this before another Amazon submission is created.',
        color: 'text-amber-600',
        dotColor: 'bg-amber-400',
        icon: <ShieldAlert className="w-3.5 h-3.5" />
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
        <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans overflow-hidden">
            <div className="w-full max-w-xl flex flex-col items-center">

                <div className="w-full space-y-2.5 relative">
                    <AnimatePresence>
                        {discrepancies.slice(0, visibleCount).map((item, idx) => (
                            <motion.div
                                key={idx}
                                layout
                                initial={{ opacity: 0, y: 60, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                transition={{ type: "spring", damping: 22, stiffness: 120 }}
                                className="w-full bg-[#f8f8f9] border border-[#e4e4e7] rounded-xl px-5 py-4"
                            >
                                {/* Header row */}
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-[#1f2937] leading-snug flex items-center gap-2">
                                            {item.type}
                                            {item.movement === 'Blocked' && (
                                                <motion.span
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-medium tracking-tight"
                                                    title="Preventing Duplicate Claim"
                                                >
                                                    Intelligence Hold
                                                </motion.span>
                                            )}
                                        </h3>
                                        <p className="text-[11px] text-[#9ca3af] font-normal mt-0.5">{item.ref} · {item.found}</p>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <p className="text-lg font-normal text-[#1f2937]">{item.value}</p>
                                        <p className="text-[9px] text-[#9ca3af] font-normal tracking-tight">Estimated Value</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-[12px] text-[#6b7280] leading-relaxed mb-3">
                                    {item.desc}
                                </p>

                                {/* Meta row */}
                                <div className="flex items-center gap-5 text-[11px]">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[#9ca3af] font-normal tracking-tight">Status</span>
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.dotColor}`} />
                                        <span className="text-[#4b5563] font-medium">{item.status}</span>
                                    </div>
                                    <div className="w-px h-3 bg-[#e4e4e7]" />
                                    <div className={`flex items-center gap-1.5 font-medium ${item.color}`}>
                                        {item.icon}
                                        {item.movement}
                                    </div>
                                    <div className="w-px h-3 bg-[#e4e4e7]" />
                                    <span className="text-[#6b7280] font-normal">{item.timeLeft}</span>
                                </div>

                                {/* Movement note */}
                                <div className="mt-3 px-3 py-2 bg-white rounded-lg border border-[#ebebef]">
                                    <p className="text-[11px] text-[#9ca3af] leading-snug">
                                        {item.movementDesc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Global Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: visibleCount === 3 ? 1 : 0 }}
                    className="mt-10 text-center flex flex-col items-center"
                >
                    <div className="flex items-center gap-2 justify-center mb-3">
                        <div className="h-px w-6 bg-[#e4e4e7]" />
                        <span className="text-[9px] text-[#9ca3af] font-normal tracking-tight">Total Identified Recovery</span>
                        <div className="h-px w-6 bg-[#e4e4e7]" />
                    </div>
                    <h2 className="text-3xl font-normal text-[#1f2937] tracking-tight">$2,750.20</h2>
                    <button className="mt-6 px-6 py-3 bg-[#1f2937] text-white rounded-full font-medium text-sm flex items-center gap-2 hover:bg-[#111827] transition-all group">
                        Begin Bulk Filing
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </motion.div>

            </div>
        </div>
    );
}