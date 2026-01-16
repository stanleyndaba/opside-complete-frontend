import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCw, CheckCircle2, AlertCircle, Fingerprint, Search, ShieldCheck, ArrowRight, Mail, FileText, Loader2, Database, Briefcase, FileCheck, DollarSign, Bell, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data for the simulation
const SIMULATED_LOGS = [
    { id: 1, type: 'scan', msg: 'Initiating FBA Audit Protocol v4.2...', delay: 100 },
    { id: 2, type: 'info', msg: 'Connecting to Seller Central (US-EAST)...', delay: 800 },
    { id: 3, type: 'success', msg: 'Connection established. Fetching 18mo history.', delay: 1500 },
    { id: 4, type: 'scan', msg: 'Analyzing 14,205 inventory events...', delay: 2400 },
    { id: 5, type: 'alert', msg: 'DISCREPANCY FOUND: SKU-9982 (Lost in Transit)', value: 125.50, delay: 3200 },
    { id: 6, type: 'alert', msg: 'DISCREPANCY FOUND: Order #114-332 (Unpaid Refund)', value: 45.20, delay: 3600 },
    { id: 7, type: 'scan', msg: 'Cross-referencing inbound shipments...', delay: 4500 },
    { id: 8, type: 'alert', msg: 'DISCREPANCY FOUND: Shipment FBA15X (Shortage)', value: 850.00, delay: 5100 },
    { id: 9, type: 'info', msg: 'Verifying claim eligibility against policy...', delay: 6000 },
    { id: 10, type: 'success', msg: 'Audit Complete. 14 actionable cases identified.', delay: 7200 },
];

const NOTIFICATIONS_DATA = [
    { id: 1, message: "Margin identified discrepancies Amazon likely owes you for. Reviewing and validating evidence now.", time: "6 days ago", type: 'alert' },
    { id: 2, message: "Funds have been cleared and deposited to your account.", time: "6 days ago", type: 'success' },
    { id: 3, message: "Funds have been cleared and deposited to your account.", time: "6 days ago", type: 'success' },
    { id: 4, message: "Funds have been cleared and deposited to your account.", time: "6 days ago", type: 'success' },
    { id: 5, message: "Margin identified discrepancies Amazon likely owes you for. Reviewing and validating evidence now.", time: "7 days ago", type: 'alert' },
    { id: 6, message: "Funds have been cleared and deposited to your account.", time: "7 days ago", type: 'success' },
    { id: 7, message: "Funds have been cleared and deposited to your account.", time: "7 days ago", type: 'success' },
    { id: 8, message: "Funds have been cleared and deposited to your account.", time: "7 days ago", type: 'success' },
    { id: 9, message: "Margin identified discrepancies Amazon likely owes you for. Reviewing and validating evidence now.", time: "7 days ago", type: 'alert' },
    { id: 10, message: "Funds have been cleared and deposited to your account.", time: "7 days ago", type: 'success' },
    { id: 11, message: "Funds have been cleared and deposited to your account.", time: "7 days ago", type: 'success' },
    { id: 12, message: "Funds have been cleared and deposited to your account.", time: "7 days ago", type: 'success' },
    { id: 13, message: "Margin identified discrepancies Amazon likely owes you for. Reviewing and validating evidence now.", time: "7 days ago", type: 'alert' },
    { id: 14, message: "Funds have been cleared and deposited to your account.", time: "7 days ago", type: 'success' },
    { id: 15, message: "Funds have been cleared and deposited to your account.", time: "7 days ago", type: 'success' },
    { id: 16, message: "Funds have been cleared and deposited to your account.", time: "7 days ago", type: 'success' },
];

export const InteractiveDemo = ({ className }: { className?: string }) => {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'complete' | 'results' | 'connecting_source' | 'searching_docs' | 'matched' | 'filing' | 'disputes' | 'notifications'>('idle');
    const [logs, setLogs] = useState<any[]>([]);
    const [fundsFound, setFundsFound] = useState(0);
    const [itemsScanned, setItemsScanned] = useState(0);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Simulation Logic
    useEffect(() => {
        if (status !== 'scanning') return;

        let timeouts: NodeJS.Timeout[] = [];

        // Reset
        setLogs([]);
        setFundsFound(0);
        setItemsScanned(0);

        // 1. Log Sequence
        SIMULATED_LOGS.forEach(log => {
            const t = setTimeout(() => {
                setLogs(prev => [...prev, log]);
                if (log.value) {
                    setFundsFound(prev => prev + log.value);
                }
            }, log.delay);
            timeouts.push(t);
        });

        // 2. "Items Scanned" Counter
        const interval = setInterval(() => {
            setItemsScanned(prev => {
                if (prev > 14000) return prev;
                return prev + Math.floor(Math.random() * 350);
            });
        }, 100);

        // 3. Completion
        const completeTimeout = setTimeout(() => {
            setStatus('results');
            clearInterval(interval);
        }, 7500);
        timeouts.push(completeTimeout);

        return () => {
            timeouts.forEach(clearTimeout);
            clearInterval(interval);
        };
    }, [status]);

    // Evidence Matching & Filing Simulation (Simplified for Sync view but kept for backup logic)
    useEffect(() => {
        if (status === 'connecting_source') {
            const t = setTimeout(() => {
                setStatus('searching_docs');
            }, 2000);
            return () => clearTimeout(t);
        }
        if (status === 'searching_docs') {
            const t = setTimeout(() => {
                setStatus('matched');
            }, 3000);
            return () => clearTimeout(t);
        }
        if (status === 'filing') {
            const t = setTimeout(() => {
                setStatus('disputes');
            }, 2500);
            return () => clearTimeout(t);
        }
    }, [status]);

    const handleStart = () => {
        setStatus('scanning');
    };

    const handleReset = () => {
        setStatus('idle');
        setLogs([]);
        setFundsFound(0);
        setItemsScanned(0);
    };

    return (
        <div className={cn("relative w-full max-w-4xl mx-auto", className)}>
            {/* Window Frame */}
            <div className="rounded-xl overflow-hidden bg-white shadow-2xl border border-gray-200/50 backdrop-blur-sm flex flex-col relative h-[600px] md:h-[550px]">
                {/* Title Bar - No Traffic Lights */}
                <div className="bg-gray-50/80 border-b border-gray-100 px-4 py-3 flex items-center gap-4 shrink-0">
                    <div className="flex gap-2">
                        {/* Traffic lights removed */}
                    </div>
                    <div className="px-3 py-1 bg-white border border-gray-200 rounded-md text-[10px] font-mono text-gray-500 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        📄 Scenario: High-Volume Seller ($1M/yr)
                    </div>
                </div>

                {/* Main Interface Content */}
                <div className="flex-1 p-6 bg-white flex flex-col md:flex-row gap-6 overflow-hidden">

                    {/* Left Panel: Metrics & Controls */}
                    <div className="flex-1 flex flex-col gap-6">

                        {/* Action Area */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl relative overflow-hidden flex-1 flex flex-col justify-center">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Fingerprint className="w-32 h-32" />
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Recoverable Funds</h3>
                                <div className="text-4xl md:text-5xl font-mono font-bold text-emerald-400 mb-6 tracking-tight">
                                    ${fundsFound.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>

                                {status === 'idle' && (
                                    <Button
                                        onClick={handleStart}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-6 text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02]">
                                        <Play className="w-5 h-5 mr-2 fill-current" />
                                        Start recovery
                                    </Button>
                                )}

                                {status === 'scanning' && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs text-gray-400">
                                            <span>Scanning Inventory Events...</span>
                                            <span>{itemsScanned.toLocaleString()} / 14,205</span>
                                        </div>
                                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 animate-pulse transition-all duration-300 ease-out"
                                                style={{ width: `${Math.min((itemsScanned / 14205) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <div className="text-center text-xs text-emerald-400/80 font-mono animate-pulse">
                                            PROCESSING...
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Minor Metrics */}
                        <div className="grid grid-cols-2 gap-4 h-24 shrink-0">
                            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                <div className="text-xs text-gray-500 mb-1">Events Analyzed</div>
                                <div className="text-xl font-bold text-gray-800">{itemsScanned.toLocaleString()}</div>
                            </div>
                            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                <div className="text-xs text-gray-500 mb-1">Platform Confidence</div>
                                <div className="text-xl font-bold text-emerald-600">99.8%</div>
                            </div>
                        </div>

                    </div>

                    {/* Right Panel: Live Feed (Sync.tsx Style) */}
                    <div className="flex-1 relative group bg-[#0D0D0D] rounded-lg border border-neutral-900 shadow-sm h-full overflow-hidden hidden md:block">

                        {/* Header bar */}
                        <div className="absolute top-0 left-0 right-0 h-10 bg-[#0D0D0D] rounded-t-lg border-b border-neutral-900 flex items-center px-5 z-10">
                            <span className="text-[10px] font-normal text-neutral-600 uppercase tracking-[0.2em]">Activity Feed</span>
                        </div>

                        {/* Scrollable Container */}
                        <div className="pt-12 pb-6 px-5 font-normal text-[13px] h-full overflow-y-auto scroll-smooth relative leading-relaxed tracking-tight text-neutral-400">
                            {/* Simplified subtle gradient */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none sticky top-0"></div>

                            {logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-neutral-700 space-y-3 opacity-60">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                                        <Search className="w-8 h-8 relative z-10" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs tracking-widest uppercase opacity-80">Waiting for Signal...</p>
                                        <p className="text-[10px] text-neutral-600 mt-1 font-mono">SYSTEM_IDLE</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1 relative z-10">
                                    {logs.map((log) => (
                                        <div key={log.id} className="flex items-start gap-3 py-1.5 text-[13px] animate-in fade-in slide-in-from-bottom-1 duration-300">
                                            {/* Timestamp style dot for alignment */}
                                            <div className={cn(
                                                "mt-1.5 w-1.5 h-1.5 rounded-full shrink-0",
                                                log.type === 'scan' && "bg-blue-500/50",
                                                log.type === 'info' && "bg-neutral-700",
                                                log.type === 'alert' && "bg-amber-500",
                                                log.type === 'success' && "bg-emerald-500"
                                            )} />

                                            <span className="break-all flex-1">
                                                <span className={cn(
                                                    "transition-colors duration-300",
                                                    log.type === 'scan' && "text-neutral-500",
                                                    log.type === 'info' && "text-neutral-400",
                                                    log.type === 'alert' && "text-neutral-300",
                                                    log.type === 'success' && "text-neutral-200"
                                                )}>
                                                    {log.msg}
                                                </span>

                                                {/* Value Highlight */}
                                                {log.value && (
                                                    <span className="ml-2 inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-1.5 rounded text-emerald-400 font-medium text-[11px] tracking-wide">
                                                        +${log.value.toFixed(2)}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer CTA */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center shrink-0">
                    <div className="flex gap-2">
                        <Button
                            onClick={handleReset}
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-900">
                            <RotateCw className="w-3.5 h-3.5 mr-2" />
                            Reset
                        </Button>
                    </div>
                </div>
            </div>

            {/* RESULTS VIEW OVERLAY */}
            <div className={cn(
                "absolute inset-0 bg-white z-20 transition-all duration-700 flex flex-col",
                (status === 'results' || status === 'connecting_source' || status === 'searching_docs' || status === 'matched' || status === 'filing' || status === 'disputes' || status === 'notifications')
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4 pointer-events-none"
            )}>
                {/* Main Content Area - Simplified for Sync Workflow */}
                <div className="flex-1 flex flex-col items-center justify-center bg-[#0D0D0D] relative overflow-hidden text-center z-10 space-y-2">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Recoverable Funds</div>
                    <div className="text-6xl md:text-7xl font-mono font-bold text-emerald-400 tracking-tighter">
                        ${fundsFound.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>

                    <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                        <Fingerprint className="w-96 h-96 text-white" />
                    </div>

                    <div className="pt-8">
                        <Button
                            onClick={() => window.location.href = '/auth/signup'}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold h-12 px-8 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.05]">
                            Start Live Audit
                        </Button>
                    </div>
                </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-3xl -z-10 rounded-full opacity-50 pointer-events-none" />
        </div>
    );
};
