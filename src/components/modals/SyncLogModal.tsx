/**
 * SyncLogModal - Real-time sync log display modal for Dashboard
 * 
 * Features:
 * - Triggers sync when opened
 * - Subscribes to SSE for real-time log updates
 * - Displays story-grouped logs (System, Shipment, Inventory, Fee, Detection)
 * - Shows progress and CTA when complete
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, ChevronDown, ChevronRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { subscribeSyncProgress } from '@/lib/inventoryApi';

interface LogEntry {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'thinking';
    message: string;
    category?: string;
    timestamp: Date;
    context?: {
        details?: string[];
    };
}

interface LogStory {
    id: string;
    label: string;
    category: string;
    logs: LogEntry[];
    summary?: string;
    isComplete: boolean;
    potentialValue: number;
}

interface SyncLogModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Story category mapping
const storyCategories: Record<string, { label: string; order: number }> = {
    system: { label: 'System', order: 1 },
    shipment: { label: 'Shipment Verification', order: 2 },
    inventory: { label: 'Inventory Scan', order: 3 },
    fee: { label: 'Fee Audit', order: 4 },
    detection: { label: 'Opportunity Detection', order: 5 },
    recovery: { label: 'Recoveries', order: 6 },
};

export function SyncLogModal({ isOpen, onClose }: SyncLogModalProps) {
    const navigate = useNavigate();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [displayedLogs, setDisplayedLogs] = useState<LogEntry[]>([]);
    const [syncId, setSyncId] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'syncing' | 'completed' | 'failed' | 'cancelled'>('idle');
    const [isCancelling, setIsCancelling] = useState(false);
    const [detectionCount, setDetectionCount] = useState<number>(0);
    const [totalValue, setTotalValue] = useState<number>(0);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const hasStartedRef = useRef(false);
    const displayQueueRef = useRef<LogEntry[]>([]);
    const isProcessingQueueRef = useRef(false);

    // Cancel sync handler
    const handleCancelSync = useCallback(async () => {
        if (!syncId || isCancelling) return;
        setIsCancelling(true);
        try {
            await api.post(`/sync/cancel/${syncId}`);
            setStatus('cancelled');
            const cancelLog: LogEntry = {
                id: `log_cancel_${Date.now()}`,
                type: 'warning',
                message: 'ABORT_PROTOCOL_INITIATED: Synchronization sequence terminated by user.',
                category: 'system',
                timestamp: new Date()
            };
            setLogs(prev => [...prev, cancelLog]);
            setDisplayedLogs(prev => [...prev, cancelLog]);
        } catch (error: any) {
            const errorLog: LogEntry = {
                id: `log_error_${Date.now()}`,
                type: 'error',
                message: `CRITICAL_FAILURE: Failed to terminate link: ${error.message}`,
                category: 'system',
                timestamp: new Date()
            };
            setLogs(prev => [...prev, errorLog]);
            setDisplayedLogs(prev => [...prev, errorLog]);
        } finally {
            setIsCancelling(false);
        }
    }, [syncId, isCancelling]);

    const processDisplayQueue = useCallback(async () => {
        if (isProcessingQueueRef.current) return;
        isProcessingQueueRef.current = true;
        while (displayQueueRef.current.length > 0) {
            const nextLog = displayQueueRef.current.shift();
            if (nextLog) {
                setDisplayedLogs(prev => [...prev, nextLog]);
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        }
        isProcessingQueueRef.current = false;
    }, []);

    const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
        const newEntry: LogEntry = {
            ...entry,
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
        };
        setLogs(prev => [...prev, newEntry]);
        displayQueueRef.current.push(newEntry);
        processDisplayQueue();
    }, [processDisplayQueue]);

    useEffect(() => {
        if (!isOpen || hasStartedRef.current) return;
        hasStartedRef.current = true;
        const startSync = async () => {
            setStatus('syncing');
            addLog({ type: 'thinking', message: 'ESTABLISHING_NETWORK_HANDSHAKE...', category: 'system' });
            try {
                const { startSync } = await import('@/lib/inventoryApi');
                const result = await startSync();
                if (result?.syncId) {
                    setSyncId(result.syncId);
                    addLog({ type: 'success', message: 'FBA_INGEST_PROTOCOL: Handshake verified. Parsing transaction logs...', category: 'system' });
                } else {
                    throw new Error('NULL_RESPONSE_ID');
                }
            } catch (error: any) {
                setStatus('failed');
                addLog({ type: 'error', message: error?.message || 'CRITICAL_AUTH_FAILURE', category: 'system' });
            }
        };
        startSync();
    }, [isOpen, addLog]);

    useEffect(() => {
        if (!syncId) return;
        const handleEvent = (event: any) => {
            if (event.log) {
                addLog({
                    type: event.log.type || 'info',
                    message: event.log.message.toUpperCase().replace(' ', '_'),
                    category: event.log.category || 'system',
                    context: event.log.context,
                });
            }
            if (event.status === 'completed' || event.status === 'done') {
                setStatus('completed');
                if (event.detectionCount) setDetectionCount(event.detectionCount);
                if (event.totalValue) setTotalValue(event.totalValue);
            } else if (event.status === 'failed' || event.status === 'error') {
                setStatus('failed');
            }
        };
        const unsubscribe = subscribeSyncProgress(syncId, handleEvent);
        return () => unsubscribe();
    }, [syncId, addLog]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [displayedLogs]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => {
                setLogs([]);
                setDisplayedLogs([]);
                displayQueueRef.current = [];
                isProcessingQueueRef.current = false;
                setSyncId(null);
                setStatus('idle');
                setIsCancelling(false);
                setDetectionCount(0);
                setTotalValue(0);
                hasStartedRef.current = false;
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#0c0c0c] border border-white/10 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl backdrop-blur-3xl flex flex-col max-h-[85vh]">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "h-1.5 w-1.5 rounded-full shadow-[0_0_8px]",
                            status === 'syncing' ? "bg-emerald-500 shadow-emerald-500/50 animate-pulse" :
                                status === 'completed' ? "bg-emerald-500 shadow-emerald-500/50" :
                                    "bg-red-500 shadow-red-500/50"
                        )} />
                        <div>
                            <h2 className="text-[11px] font-mono font-bold text-white uppercase tracking-[0.3em]">FORENSIC_INGEST_LOG</h2>
                            <p className="text-[9px] font-mono text-white/30 truncate mt-0.5">STATUS_CODE: {status.toUpperCase()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {status === 'syncing' && (
                            <button
                                onClick={handleCancelSync}
                                disabled={isCancelling}
                                className="px-4 py-1.5 text-[10px] font-mono font-bold text-white/30 border border-white/10 hover:border-red-500/30 hover:text-red-500 transition-all uppercase tracking-widest disabled:opacity-50">
                                {isCancelling ? 'TERMINATING...' : 'ABORT_LINK'}
                            </button>
                        )}
                        <button onClick={onClose} className="p-1 hover:text-white text-white/20 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div
                    ref={logContainerRef}
                    className="flex-1 overflow-y-auto p-8 font-mono space-y-3 scrollbar-hide bg-black/20"
                >
                    <style>{`
                        @keyframes typewriter {
                            from { opacity: 0; transform: translateX(-4px); }
                            to { opacity: 1; transform: translateX(0); }
                        }
                        .matrix-log {
                            animation: typewriter 0.15s ease-out forwards;
                        }
                    `}</style>
                    {displayedLogs.length > 0 ? (
                        <>
                            {displayedLogs.map(log => (
                                <div key={log.id} className="flex items-start gap-4 text-[10px] matrix-log group">
                                    <span className="text-white/10 w-20 flex-shrink-0 tabular-nums">
                                        [{formatTime(log.timestamp)}]
                                    </span>
                                    <span className={cn(
                                        "flex-1 leading-relaxed tracking-tight",
                                        log.type === 'success' ? "text-emerald-500 font-bold" :
                                            log.type === 'error' ? "text-red-400" :
                                                log.type === 'warning' ? "text-amber-400" :
                                                    log.type === 'thinking' ? "text-white/40 animate-pulse" :
                                                        "text-white/60"
                                    )}>
                                        <span className="mr-2 opacity-20 group-hover:opacity-100 transition-opacity">>></span>
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                            {status === 'syncing' && (
                                <div className="flex items-center gap-3 text-[10px] text-emerald-500/40 mt-6 animate-pulse">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span className="font-bold uppercase tracking-widest">INGESTION_ACTIVE_WAITING_FOR_DATA_NODES...</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 gap-4">
                            <RefreshCw className="h-5 w-5 text-emerald-500/20 animate-spin" />
                            <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em]">INITIATING_AUDIT_ENGINE</span>
                        </div>
                    )}
                </div>

                {status === 'completed' && (
                    <div className="px-8 py-8 border-t border-white/5 bg-emerald-500/[0.02]">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">RECONCILIATION_SUMMARY</div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xl font-mono font-bold text-white tracking-tighter">
                                        {detectionCount} <span className="text-[10px] font-bold text-emerald-500/60 uppercase">Anomalies_Indexed</span>
                                    </span>
                                    <span className="h-4 w-[1px] bg-white/5" />
                                    <span className="text-xl font-mono font-bold text-emerald-500 tracking-tighter">
                                        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] font-bold text-emerald-500/60 uppercase">Est_Yield</span>
                                    </span>
                                </div>
                            </div>
                            <Button
                                onClick={() => {
                                    onClose();
                                    navigate('/recoveries');
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-mono font-bold uppercase tracking-widest px-8 h-12 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all"
                            >
                                EXECUTE_CLAIMS
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
