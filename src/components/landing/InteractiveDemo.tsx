import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCw, CheckCircle2, AlertCircle, Search, ShieldCheck, ArrowRight, Mail, FileText, Loader2, Database, Briefcase, FileCheck, DollarSign, Bell, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// --- MOCK DATA ---
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
    { id: 11, type: 'info', msg: 'Generating recovery roadmap...', delay: 7500 },
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
    { id: 11, message: "New discrepancy detected in SKU-1002.", time: "8 days ago", type: 'alert' },
    { id: 12, message: "Recovery payment received for Case #FBA-882.", time: "8 days ago", type: 'success' },
];

export const InteractiveDemo = ({ className }: { className?: string }) => {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'results' | 'connecting_source' | 'searching_docs' | 'matched' | 'filing' | 'disputes' | 'notifications'>('idle');
    const [logs, setLogs] = useState<any[]>([]);
    const [fundsFound, setFundsFound] = useState(0);
    const [itemsScanned, setItemsScanned] = useState(0);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    useEffect(() => {
        if (status !== 'scanning') return;
        let timeouts: NodeJS.Timeout[] = [];
        setLogs([]);
        setFundsFound(0);
        setItemsScanned(0);

        SIMULATED_LOGS.forEach(log => {
            const t = setTimeout(() => {
                setLogs(prev => [...prev, log]);
                if (log.value) setFundsFound(prev => prev + log.value);
            }, log.delay);
            timeouts.push(t);
        });

        const interval = setInterval(() => {
            setItemsScanned(prev => (prev > 14000 ? prev : prev + Math.floor(Math.random() * 350)));
        }, 100);

        const completeTimeout = setTimeout(() => {
            setStatus('results');
            clearInterval(interval);
        }, 7800);
        timeouts.push(completeTimeout);

        return () => {
            timeouts.forEach(clearTimeout);
            clearInterval(interval);
        };
    }, [status]);

    useEffect(() => {
        if (status === 'connecting_source') {
            const t = setTimeout(() => setStatus('searching_docs'), 2000);
            return () => clearTimeout(t);
        }
        if (status === 'searching_docs') {
            const t = setTimeout(() => setStatus('matched'), 3000);
            return () => clearTimeout(t);
        }
        if (status === 'filing') {
            const t = setTimeout(() => setStatus('disputes'), 2500);
            return () => clearTimeout(t);
        }
    }, [status]);

    const handleStart = () => setStatus('scanning');
    const handleReset = () => {
        setStatus('idle');
        setLogs([]);
        setFundsFound(0);
        setItemsScanned(0);
    };

    return (
        <div className={cn("relative w-full max-w-4xl mx-auto", className)}>
            <div className="rounded-2xl overflow-hidden bg-white shadow-2xl border border-gray-200 flex flex-col relative h-[620px] md:h-[580px]">

                {/* WINDOW HEADER */}
                <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                        <div className="h-4 w-px bg-gray-200 mx-2" />
                        <div className="px-3 py-1 bg-white border border-gray-200 rounded-md text-[10px] font-mono text-gray-500 flex items-center gap-2 shadow-sm">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            Scenario: High-Volume Seller ($1M+/yr)
                        </div>
                    </div>
                </div>

                {/* MAIN BODY */}
                <div className="flex-1 p-8 flex flex-col md:flex-row gap-8 overflow-hidden bg-white">

                    {/* LEFT PANEL */}
                    <div className="w-72 shrink-0 flex flex-col justify-center gap-10 py-4 px-2">
                        <div>
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Database className="w-3 h-3" /> Recoverable Revenue
                            </h3>
                            <div className="text-5xl font-mono font-bold text-emerald-500 tracking-tighter">
                                ${fundsFound.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                        </div>

                        {status === 'idle' && (
                            <Button onClick={handleStart} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-7 text-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">
                                <Play className="w-6 h-6 mr-3 fill-current" />
                                Run Audit
                            </Button>
                        )}

                        {status === 'scanning' && (
                            <div className="space-y-4">
                                <div className="flex justify-between text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                                    </span>
                                    <span>{itemsScanned.toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-emerald-500 animate-pulse transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${Math.min((itemsScanned / 14205) * 100, 100)}%` }} />
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium italic">Scanning 18 months of inventory history...</p>
                            </div>
                        )}

                        {status === 'results' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-700">
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3 mb-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                                    <p className="text-xs text-emerald-800 font-medium leading-relaxed">Audit complete. 14 claims ready for evidence matching.</p>
                                </div>
                                <Button onClick={() => setStatus('connecting_source')} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-7 text-xl shadow-xl shadow-emerald-500/30">
                                    Verify Evidence <ArrowRight className="w-6 h-6 ml-3" />
                                </Button>
                                <Button onClick={() => window.location.href = '/auth/signup'} variant="outline" className="w-full text-xs text-gray-400 border-gray-100 font-bold uppercase tracking-widest">
                                    Go Live
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANEL (TERMINAL) */}
                    <div className="flex-1 bg-[#0a0a0a] rounded-xl border border-neutral-900 h-full overflow-hidden hidden md:block relative shadow-2xl">
                        <div className="absolute top-0 left-0 right-0 h-12 bg-neutral-950/80 border-b border-neutral-900 flex items-center px-6 z-10 backdrop-blur-md">
                            <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Kernel Activity Log
                            </span>
                        </div>
                        <div className="pt-16 pb-8 px-8 text-[13px] h-full overflow-y-auto text-neutral-400 leading-7 font-mono">
                            {logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-neutral-800 space-y-4 opacity-50">
                                    <div className="p-4 bg-neutral-900/50 rounded-full border border-neutral-800">
                                        <Search className="w-10 h-10" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase font-bold tracking-[0.3em] font-sans">Awaiting Command</p>
                                        <p className="text-[9px] mt-2 opacity-50">SYSTEM_READY :: VERSION_4.2.0</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {logs.map((log) => {
                                        return (
                                            <div key={log.id} className="flex items-start gap-4 py-1.5 border-b border-white/[0.02] animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <span className="text-neutral-700 select-none">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                                <div className={cn("mt-2.5 w-1 h-1 rounded-full shrink-0",
                                                    log.type === 'alert' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
                                                        log.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                                                            'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]')} />
                                                <span className="flex-1 transition-colors hover:text-white">{log.msg}</span>
                                                {log.value && <span className="text-emerald-400 font-bold bg-emerald-500/5 px-2 rounded tracking-tighter">+$ {log.value.toFixed(2)}</span>}
                                            </div>
                                        );
                                    })}
                                    <div ref={logsEndRef} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center shrink-0">
                    <Button onClick={handleReset} variant="ghost" size="sm" className="text-gray-400 hover:bg-white hover:text-gray-900 transition-all font-bold uppercase tracking-tighter text-[10px]">
                        <RotateCw className="w-4 h-4 mr-2" /> Reset Session
                    </Button>
                    <div className="flex gap-3">
                        {status === 'results' && (
                            <Button onClick={() => setStatus('connecting_source')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 font-bold h-10 px-6">
                                Auto-Match Evidence <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                        {status === 'matched' && (
                            <Button onClick={() => setStatus('filing')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 font-bold h-10 px-6">
                                <FileCheck className="w-4 h-4 mr-2" /> Submit 14 Claims
                            </Button>
                        )}
                        {status === 'disputes' && (
                            <Button onClick={() => setStatus('notifications')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 font-bold h-10 px-6">
                                View Account Logs <Bell className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                        {status === 'notifications' && (
                            <Button onClick={() => window.location.href = '/auth/signup'} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-600/40 font-bold h-10 px-8">
                                Start Live Audit <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* OVERLAY LAYERS */}
                <div className={cn(
                    "absolute inset-0 bg-white z-20 transition-all duration-700 flex flex-col",
                    (status === 'results' || status === 'connecting_source' || status === 'searching_docs' || status === 'matched' || status === 'filing' || status === 'disputes' || status === 'notifications')
                        ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
                )}>
                    {/* A. LOADING / TERMINAL OVERLAY */}
                    {(status === 'connecting_source' || status === 'searching_docs' || status === 'filing') && (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-12 animate-in fade-in zoom-in-95 duration-500">
                            <div className="relative">
                                <div className="w-24 h-24 bg-blue-50/50 rounded-full flex items-center justify-center animate-pulse relative shadow-inner border border-blue-100">
                                    {status === 'connecting_source' && <Mail className="w-12 h-12 text-blue-500" />}
                                    {status === 'searching_docs' && <Search className="w-12 h-12 text-blue-500" />}
                                    {status === 'filing' && <Briefcase className="w-12 h-12 text-blue-500" />}
                                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2.5 shadow-2xl border border-gray-100">
                                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                    </div>
                                </div>
                            </div>
                            <div className="text-center space-y-4">
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    {status === 'connecting_source' ? 'Connecting to Source...' :
                                        status === 'searching_docs' ? 'Analyzing Documents...' :
                                            'Submitting Case Files...'}
                                </h3>
                                <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto leading-relaxed">
                                    {status === 'connecting_source' && 'Authenticating with Google OAuth 2.0 to access evidence documents.'}
                                    {status === 'searching_docs' && 'Performing OCR and metadata extraction on found invoice PDFs.'}
                                    {status === 'filing' && 'Transmitting encrypted evidence packets to Amazon SP-API endpoints.'}
                                </p>
                            </div>
                            <div className="w-full max-w-sm bg-neutral-950 rounded-2xl p-8 font-mono text-[12px] text-neutral-400 space-y-3 border border-neutral-900 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                                <div className="text-neutral-700 flex justify-between border-b border-neutral-900 pb-3 mb-4 text-[10px] tracking-widest uppercase">
                                    <span>V-CORE_v4.2</span>
                                    <span>AUTH_OK</span>
                                </div>
                                {status === 'filing' ? (
                                    <>
                                        <div className="text-emerald-500">&gt; push(CasePacket_114-552): OK</div>
                                        <div>&gt; payload: AES_256_ENCRYPTED</div>
                                        <div className="animate-pulse text-blue-500">&gt; waiting_for_case_id...</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-emerald-500">&gt; bridge: channel_established</div>
                                        <div>&gt; query: "Amazon Invoice", "Shipment"</div>
                                        {status === 'searching_docs' && (
                                            <>
                                                <div className="text-emerald-500">&gt; matched: Invoice-FBA15X.pdf</div>
                                                <div className="text-emerald-500">&gt; matched: SKU-9982-PL.pdf</div>
                                                <div className="text-neutral-600 mt-3">&gt; analyzing_fields()...</div>
                                            </>
                                        )}
                                    </>
                                )}
                                <div className="h-4 w-2 bg-neutral-700 animate-pulse inline-block" />
                            </div>
                        </div>
                    )}

                    {/* B. DETECTED CLAIMS / EVIDENCE MATCHED TABLE */}
                    {(status === 'results' || status === 'matched') && (
                        <div className="flex-1 flex flex-col bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <div className="p-10 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between shadow-sm relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className={cn(
                                        "p-4 rounded-2xl shadow-inner border transition-colors duration-500",
                                        status === 'results' ? "bg-amber-100/50 border-amber-200/30" : "bg-emerald-100/50 border-emerald-200/30"
                                    )}>
                                        {status === 'results' ? <Search className="w-8 h-8 text-amber-600" /> : <CheckCircle2 className="w-8 h-8 text-emerald-600" />}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                                            {status === 'results' ? '14 Potential Claims Detected' : 'Evidence Verified'}
                                        </h3>
                                        <p className="text-[11px] text-gray-400 uppercase tracking-[0.3em] font-bold mt-1">
                                            {status === 'results' ? 'Awaiting Evidence Matching' : '14 Claims Matched with Documentation'}
                                        </p>
                                    </div>
                                </div>
                                {status === 'results' && (
                                    <Button onClick={() => setStatus('connecting_source')} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 font-bold h-10 px-6">
                                        Auto-Match Evidence <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                            <div className="flex-1 overflow-auto bg-white px-4">
                                <table className="w-full text-left text-[14px]">
                                    <thead className="bg-white sticky top-0 z-10 border-b border-gray-100">
                                        <tr className="text-gray-400 uppercase tracking-[0.25em] font-bold text-[10px]">
                                            <th className="px-10 py-6">Audit Category</th>
                                            <th className="px-10 py-6">Reference ID</th>
                                            <th className="px-10 py-6">Status</th>
                                            <th className="px-10 py-6 text-right">Potential Recovery</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {[
                                            { type: 'Lost in Transit', ref: 'FBA15XJ-22', val: 850.00 },
                                            { type: 'Warehouse Damage', ref: 'SKU-9982-DMG', val: 125.50 },
                                            { type: 'Unpaid Customer Refund', ref: 'ORD-33291-RR', val: 45.20 },
                                            { type: 'Weight & Dimension Fee', ref: 'FEE-7721-ERR', val: 18.40 },
                                            { type: 'Missing in Shipment', ref: 'SHP-FBA-992', val: 312.00 },
                                            { type: 'Incorrect Disposal', ref: 'DSP-8821-X', val: 55.00 },
                                            { type: 'Inbound Discrepancy', ref: 'INC-2291', val: 198.50 },
                                            { type: 'Late Return Policy', ref: 'RET-3310', val: 42.00 },
                                            { type: 'Removals Lost', ref: 'RMV-112', val: 95.75 },
                                            { type: 'Overage Fee Recovery', ref: 'OVG-998', val: 12.40 }
                                        ].map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-all group">
                                                <td className="px-10 py-6 font-bold text-gray-900">{row.type}</td>
                                                <td className="px-10 py-6 text-gray-500 font-mono tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity">{row.ref}</td>
                                                <td className="px-10 py-6">
                                                    {status === 'results' ? (
                                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 text-[10px] px-3 py-0.5 font-bold uppercase tracking-wider">Awaiting Signal</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] px-3 py-0.5 font-bold uppercase tracking-wider">High Strength</Badge>
                                                    )}
                                                </td>
                                                <td className="px-10 py-6 text-right font-mono font-bold text-gray-900 text-base">
                                                    ${row.val.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* C. DISPUTE CASES OVERLAY */}
                    {status === 'disputes' && (
                        <div className="flex-1 p-12 flex flex-col bg-gray-50/50 overflow-auto animate-in fade-in slide-in-from-bottom-10 duration-700">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-4 tracking-tight">
                                    <Briefcase className="w-7 h-7 text-emerald-600" /> Resolution Tracking
                                </h3>
                                <Badge variant="secondary" className="bg-white border-gray-200 px-4 py-1 text-xs font-bold shadow-sm">14 Live Cases</Badge>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xl">
                                <div className="p-10 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-gray-50/50 via-white to-gray-50/50">
                                    <div>
                                        <div className="flex items-center gap-4 mb-3">
                                            <span className="text-[11px] font-bold text-gray-500 font-mono tracking-widest uppercase bg-gray-100 px-3 py-1 rounded-lg">AMZ_CASE_114-552311</span>
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-xs font-black tracking-tight">SUBMITTED</Badge>
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900 tracking-tight">Lost Inbound Shipment - Transaction FBA15X</h4>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-mono font-bold text-gray-900 tracking-tighter">$850.00</div>
                                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-2">Recovery Estimate</p>
                                    </div>
                                </div>
                                <div className="p-16 bg-white relative">
                                    <div className="relative flex items-center justify-between max-w-4xl mx-auto">
                                        <div className="absolute left-0 top-4 w-full h-1 bg-gray-100 rounded-full" />
                                        <div className="absolute left-0 top-4 w-[66%] h-1 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all duration-1500 ease-out" />
                                        {['Detected', 'Prepared', 'Submitted', 'Paid', 'Finalized'].map((step, i) => (
                                            <div key={i} className="relative z-10 flex flex-col items-center gap-5 bg-white px-6">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-700",
                                                    i <= 2 ? "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20 scale-110" : "bg-white border-gray-200 text-gray-300"
                                                )}>
                                                    {i <= 2 ? <CheckCheck className="w-5 h-5" /> : (i === 3 ? <DollarSign className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />)}
                                                </div>
                                                <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", i <= 2 ? "text-emerald-700" : "text-gray-400")}>{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 grid grid-cols-2 gap-6">
                                <div className="bg-white border border-gray-100 p-6 rounded-2xl flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-5">
                                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                                        <div>
                                            <p className="text-[10px] font-mono text-gray-400 mb-0.5 tracking-tight">#CASE-SKU-9982</p>
                                            <span className="text-base font-bold text-gray-900 tracking-tight">Warehouse Damage</span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-gray-50 border-gray-200">Processing</Badge>
                                </div>
                                <div className="bg-white border border-gray-100 p-6 rounded-2xl flex items-center justify-between opacity-50">
                                    <div className="flex items-center gap-5">
                                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                                        <div>
                                            <p className="text-[10px] font-mono text-gray-400 mb-0.5 tracking-tight">#CASE-ORD-3329</p>
                                            <span className="text-base font-bold text-gray-900 tracking-tight">Unpaid Refund</span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-gray-50 border-gray-200">Processing</Badge>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* D. NOTIFICATION LOG OVERLAY */}
                    {status === 'notifications' && (
                        <div className="flex-1 p-12 flex flex-col bg-white overflow-hidden animate-in fade-in duration-700">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-4 tracking-tight">
                                    <Bell className="w-7 h-7 text-emerald-600" /> Account Activity History
                                </h3>
                                <Button variant="outline" size="sm" className="h-10 text-[10px] font-black uppercase tracking-[0.2em] bg-gray-50 border-gray-100 hover:bg-gray-100 shadow-sm">
                                    <CheckCheck className="w-4 h-4 mr-3" /> Mark All Read
                                </Button>
                            </div>
                            <div className="flex-1 overflow-auto pr-6 space-y-5 custom-scrollbar">
                                {NOTIFICATIONS_DATA.map((n, i) => {
                                    return (
                                        <div key={i} className="p-7 border border-gray-50 rounded-[2.5rem] bg-gray-50/40 flex gap-7 items-start hover:bg-white hover:border-gray-200 hover:shadow-2xl transition-all duration-400 group">
                                            <div className="mt-1 shrink-0 transition-all duration-400 group-hover:scale-110 group-hover:rotate-6">
                                                {n.type === 'alert' ? (
                                                    <div className="w-14 h-14 rounded-3xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-inner">
                                                        <Search className="w-7 h-7 text-amber-500" />
                                                    </div>
                                                ) : (
                                                    <div className="w-14 h-14 rounded-3xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-inner">
                                                        <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <span className="text-[10px] font-black font-mono uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{n.type === 'alert' ? 'Audit Alert' : 'Fund Deposit'}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold font-mono uppercase tracking-tight opacity-50">{n.time}</span>
                                                </div>
                                                <p className="text-[15px] text-gray-800 font-medium leading-[1.6] group-hover:text-gray-900 transition-colors">{n.message}</p>
                                                <div className="mt-4 flex gap-2">
                                                    <div className="h-1 w-8 bg-gray-200 rounded-full" />
                                                    <div className="h-1 w-4 bg-gray-100 rounded-full" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* BACKDROP DECORATION */}
            <div className="absolute -inset-20 bg-gradient-to-tr from-emerald-500/5 via-transparent to-blue-500/5 blur-[120px] -z-30 opacity-40 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent -z-20 opacity-50 pointer-events-none" />
        </div>
    );
};
