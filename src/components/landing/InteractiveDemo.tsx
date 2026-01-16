import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCw, CheckCircle2, AlertCircle, Fingerprint, Search, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

export const InteractiveDemo = () => {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'complete'>('idle');
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

        let startTime = Date.now();
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
                    // Animate money addition smoothly could be done here, but simple add is fine for now
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
            setStatus('complete');
            clearInterval(interval);
        }, 7500);
        timeouts.push(completeTimeout);

        return () => {
            timeouts.forEach(clearTimeout);
            clearInterval(interval);
        };
    }, [status]);

    const handleStart = () => {
        setStatus('scanning');
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto">
            {/* Window Frame */}
            <div className="rounded-xl overflow-hidden bg-white shadow-2xl border border-gray-200/50 backdrop-blur-sm">
                {/* Title Bar */}
                <div className="bg-gray-50/80 border-b border-gray-100 px-4 py-3 flex items-center gap-4">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400/80" />
                        <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                        <div className="w-3 h-3 rounded-full bg-green-400/80" />
                    </div>
                    <div className="px-3 py-1 bg-white border border-gray-200 rounded-md text-[10px] font-mono text-gray-500 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        SECURE_AUDIT_PROTOCOL_V4.EXE
                    </div>
                </div>

                {/* Main Interface */}
                <div className="p-6 bg-white min-h-[400px] flex flex-col md:flex-row gap-6">

                    {/* Left Panel: Metrics & Controls */}
                    <div className="flex-1 flex flex-col gap-6">

                        {/* Action Area */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl relative overflow-hidden">
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
                                        Start Live Audit
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

                                {status === 'complete' && (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-emerald-100">Audit Successful</p>
                                                <p className="text-xs text-emerald-200/70 mt-1">We found verified discrepancies in your past 18 months.</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleStart}
                                            variant="outline"
                                            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                                            <RotateCw className="w-4 h-4 mr-2" />
                                            Run Simulation Again
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Minor Metrics */}
                        <div className="grid grid-cols-2 gap-4">
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
                    <div className="flex-1 relative group bg-[#0D0D0D] rounded-lg border border-neutral-900 shadow-sm h-[350px] md:h-auto overflow-hidden">

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
            </div>

            {/* Decorative Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-3xl -z-10 rounded-full opacity-50 pointer-events-none" />
        </div>
    );
};
