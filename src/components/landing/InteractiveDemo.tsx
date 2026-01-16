import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCw, CheckCircle2, AlertCircle, Fingerprint, Search, ShieldCheck, ArrowRight, Mail, FileText, Loader2, Database } from 'lucide-react';
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

export const InteractiveDemo = () => {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'complete' | 'results' | 'connecting_source' | 'searching_docs' | 'matched'>('idle');
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
            setStatus('results');
            clearInterval(interval);
        }, 7500);
        timeouts.push(completeTimeout);

        return () => {
            timeouts.forEach(clearTimeout);
            clearInterval(interval);
        };
    }, [status]);

    // Evidence Matching Simulation
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
        <div className="relative w-full max-w-4xl mx-auto">
            {/* Window Frame */}
            <div className="rounded-xl overflow-hidden bg-white shadow-2xl border border-gray-200/50 backdrop-blur-sm flex flex-col relative h-[520px]">
                {/* Title Bar */}
                <div className="bg-gray-50/80 border-b border-gray-100 px-4 py-3 flex items-center gap-4 shrink-0">
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
                    <div className="flex-1 relative group bg-[#0D0D0D] rounded-lg border border-neutral-900 shadow-sm h-full overflow-hidden">

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

                {/* RESULTS VIEW OVERLAY */}
                <div className={cn(
                    "absolute inset-0 bg-white z-20 transition-all duration-700 flex flex-col",
                    (status === 'results' || status === 'connecting_source' || status === 'searching_docs' || status === 'matched')
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4 pointer-events-none"
                )}>
                    {/* Results Header */}
                    <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100/50 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">
                                    {status === 'matched' ? 'Recovery Ready' : 'Audit Complete'}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {status === 'matched'
                                        ? '14 claims matched with evidence'
                                        : '14 potential claims identified'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Recoverable</div>
                            <div className="text-xl font-bold text-emerald-600 tracking-tight">
                                ${fundsFound.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area - Switches based on sub-status */}
                    <div className="flex-1 overflow-auto bg-white flex flex-col">

                        {/* 1. Claims Table (Blurred or Active) */}
                        {(status === 'results' || status === 'matched') && (
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50/50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold text-gray-400 uppercase tracking-wider w-8">#</th>
                                        <th className="px-6 py-3 font-semibold text-gray-400 uppercase tracking-wider">Claim Type</th>
                                        <th className="px-6 py-3 font-semibold text-gray-400 uppercase tracking-wider">SKU / Order</th>
                                        <th className="px-6 py-3 font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 font-semibold text-gray-400 uppercase tracking-wider text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {[
                                        { id: 'C-7821', type: 'Lost in Transit', desc: 'Inbound Shipment FBA15X', val: 850.00 },
                                        { id: 'C-7822', type: 'Damaged Warehouse', desc: 'SKU-9982 (Main Inv)', val: 125.50 },
                                        { id: 'C-7823', type: 'Unpaid Refund', desc: 'Order #114-33291', val: 45.20 },
                                        { id: 'C-7824', type: 'Weight Fee Error', desc: 'SKU-7721 (Overcharge)', val: 18.40 },
                                        { id: 'C-7825', type: 'Lost in Warehouse', desc: 'Units missing from bin', val: 240.00 },
                                    ].map((row, i) => (
                                        <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-gray-300 font-mono">{i + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{row.type}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-mono text-[11px]">{row.desc}</td>
                                            <td className="px-6 py-4">
                                                {status === 'matched' ? (
                                                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wide bg-emerald-50 text-emerald-700 border-emerald-100">
                                                        <FileText className="w-3 h-3" /> Ready to File
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wide bg-amber-50 text-amber-700 border-amber-100">
                                                        <AlertCircle className="w-3 h-3" /> Missing Evidence
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                ${row.val.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* 2. Loading / Processing States */}
                        {(status === 'connecting_source' || status === 'searching_docs') && (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 animate-in fade-in duration-500">
                                <div className="relative">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                                        {status === 'connecting_source' ? (
                                            <Mail className="w-8 h-8 text-blue-500" />
                                        ) : (
                                            <Search className="w-8 h-8 text-blue-500" />
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {status === 'connecting_source' ? 'Connecting to Gmail...' : 'Scanning for Invoices...'}
                                    </h3>
                                    <div className="text-sm text-gray-500 font-mono">
                                        {status === 'connecting_source' ? 'Authenticating via OAuth 2.0' : 'Searching: "Amazon", "Shipment", "Invoice"'}
                                    </div>
                                </div>
                                {/* Mock Terminal Output */}
                                <div className="w-full max-w-sm bg-gray-900 rounded-lg p-4 font-mono text-[10px] text-gray-300 space-y-1 opacity-80 shadow-inner border border-gray-800">
                                    <div>&gt; Initiating secure connection... OK</div>
                                    <div>&gt; Accessing read-only scope... OK</div>
                                    {status === 'searching_docs' && (
                                        <>
                                            <div className="text-emerald-400">&gt; Found: Invoice-FBA15X.pdf</div>
                                            <div className="text-emerald-400">&gt; Found: SKU-9982-PackingList.pdf</div>
                                            <div>&gt; extracting_metadata()...</div>
                                            <div>&gt; matching_claims()...</div>
                                        </>
                                    )}
                                    <div className="animate-pulse">_</div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer CTA */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center shrink-0">
                        <Button
                            onClick={handleReset}
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-900">
                            <RotateCw className="w-3.5 h-3.5 mr-2" />
                            Reset
                        </Button>

                        {status === 'results' && (
                            <Button
                                onClick={() => setStatus('connecting_source')}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                                <Mail className="w-4 h-4 mr-2" />
                                Connect Evidence Source
                            </Button>
                        )}

                        {status === 'matched' && (
                            <Button
                                onClick={() => window.location.href = '/auth/signup'}
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 animate-in fade-in slide-in-from-right-4">
                                Sign Up to Recover Funds <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-3xl -z-10 rounded-full opacity-50 pointer-events-none" />
        </div>
    );
};
