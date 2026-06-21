'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

const discrepancies = [
    {
        type: 'Duplicate Charge — Identified',
        desc: 'A charge or adjustment appears more than once against the same seller event, without a clean offset in the record trail. · Settlement SETTLE-ACME-004',
        ref: 'Ref ACM-LI-2604-0017',
        found: 'Jan 26, 2026',
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
        found: 'Jan 21, 2026',
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
        found: 'Jan 12, 2026',
        status: 'Review only',
        timeLeft: '24 days left',
        value: '$995.65',
        movement: 'Blocked',
        movementDesc: 'Margin found a possible duplicate or previously handled recovery path, holding before another submission.',
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
        <div className="min-h-screen bg-white flex items-center justify-center px-4 py-6 font-sans overflow-hidden">
            <div className="w-full max-w-3xl flex flex-col items-center">
                <div className="w-full space-y-2 relative">
                    <AnimatePresence>
                        {discrepancies.slice(0, visibleCount).map((item, idx) => (
                            <motion.div
                                key={idx}
                                layout
                                initial={{ opacity: 0, y: 50, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                transition={{ type: "spring", damping: 22, stiffness: 120 }}
                                className="w-full bg-[#f8f8f9] border border-[#e4e4e7] rounded-lg px-5 py-3"
                            >
                                {/* Top row: title + value */}
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <h3 className="text-[13px] font-semibold text-[#1f2937] truncate">
                                            {item.type}
                                        </h3>
                                        {item.movement === 'Blocked' && (
                                            <motion.span
                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-medium tracking-tight shrink-0"
                                                title="Preventing Duplicate Claim"
                                            >
                                                Intelligence Hold
                                            </motion.span>
                                        )}
                                    </div>
                                    <span className="text-base font-normal text-[#1f2937] shrink-0 ml-4">{item.value}</span>
                                </div>

                                {/* Ref line */}
                                <p className="text-[10px] text-[#9ca3af] mb-1.5">{item.ref} · {item.found}</p>

                                {/* Description - single line truncated */}
                                <p className="text-[11px] text-[#6b7280] leading-snug mb-2 line-clamp-1">
                                    {item.desc}
                                </p>

                                {/* Meta row */}
                                <div className="flex items-center gap-4 text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.dotColor}`} />
                                        <span className="text-[#4b5563] font-medium">{item.status}</span>
                                    </div>
                                    <div className="w-px h-3 bg-[#e4e4e7]" />
                                    <div className={`flex items-center gap-1 font-medium ${item.color}`}>
                                        {item.icon}
                                        {item.movement}
                                    </div>
                                    <div className="w-px h-3 bg-[#e4e4e7]" />
                                    <span className="text-[#6b7280]">{item.timeLeft}</span>
                                    <div className="w-px h-3 bg-[#e4e4e7]" />
                                    <span className="text-[#9ca3af] italic truncate">{item.movementDesc}</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}