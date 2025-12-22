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
    const [syncId, setSyncId] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'syncing' | 'completed' | 'failed'>('idle');
    const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());
    const [detectionCount, setDetectionCount] = useState<number>(0);
    const [totalValue, setTotalValue] = useState<number>(0);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const hasStartedRef = useRef(false);

    // Add log entry
    const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
        const newEntry: LogEntry = {
            ...entry,
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
        };
        setLogs(prev => [...prev, newEntry]);
    }, []);

    // Start sync when modal opens
    useEffect(() => {
        if (!isOpen || hasStartedRef.current) return;
        hasStartedRef.current = true;

        const startSync = async () => {
            setStatus('syncing');
            addLog({ type: 'info', message: 'Initializing sync...', category: 'system' });

            try {
                const { startSync } = await import('@/lib/inventoryApi');
                const result = await startSync();

                if (result?.syncId) {
                    setSyncId(result.syncId);
                    addLog({ type: 'success', message: 'Sync started successfully', category: 'system' });
                } else {
                    throw new Error('No sync ID returned');
                }
            } catch (error: any) {
                setStatus('failed');
                addLog({ type: 'error', message: error?.message || 'Failed to start sync', category: 'system' });
            }
        };

        startSync();
    }, [isOpen, addLog]);

    // Subscribe to SSE when we have a syncId
    useEffect(() => {
        if (!syncId) return;

        const handleEvent = (event: any) => {
            // Handle log events
            if (event.log) {
                addLog({
                    type: event.log.type || 'info',
                    message: event.log.message || '',
                    category: event.log.category || 'system',
                    context: event.log.context,
                });
            }

            // Handle status updates
            if (event.status === 'completed' || event.status === 'done') {
                setStatus('completed');
                if (event.detectionCount) setDetectionCount(event.detectionCount);
                if (event.totalValue) setTotalValue(event.totalValue);
            } else if (event.status === 'failed' || event.status === 'error') {
                setStatus('failed');
            }

            // Handle detection results
            if (event.type === 'detection_complete' || event.type === 'detection') {
                if (event.detectionCount) setDetectionCount(event.detectionCount);
                if (event.totalValue || event.estimatedValue) {
                    setTotalValue(event.totalValue || event.estimatedValue || 0);
                }
            }
        };

        // subscribeSyncProgress returns a cleanup function
        const unsubscribe = subscribeSyncProgress(syncId, handleEvent);

        return () => {
            unsubscribe();
        };
    }, [syncId, addLog]);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    // Group logs into stories
    const logStories = useMemo<LogStory[]>(() => {
        const stories: Record<string, LogStory> = {};

        for (const log of logs) {
            const cat = log.category || 'system';
            const storyKey = `story_${cat}`;

            if (!stories[storyKey]) {
                const config = storyCategories[cat] || { label: cat, order: 99 };
                stories[storyKey] = {
                    id: storyKey,
                    label: config.label,
                    category: cat,
                    logs: [],
                    isComplete: false,
                    potentialValue: 0,
                };
            }

            stories[storyKey].logs.push(log);

            // Mark complete if we have a success log
            if (log.type === 'success') {
                stories[storyKey].isComplete = true;
            }
        }

        // Sort by order
        return Object.values(stories).sort((a, b) => {
            const orderA = storyCategories[a.category]?.order || 99;
            const orderB = storyCategories[b.category]?.order || 99;
            return orderA - orderB;
        });
    }, [logs]);

    // Toggle story expansion
    const toggleStory = (storyId: string) => {
        setExpandedStories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(storyId)) {
                newSet.delete(storyId);
            } else {
                newSet.add(storyId);
            }
            return newSet;
        });
    };

    // Format timestamp
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get log icon color
    const getLogColor = (type: string) => {
        switch (type) {
            case 'success': return 'text-emerald-500';
            case 'error': return 'text-red-500';
            case 'warning': return 'text-amber-500';
            case 'thinking': return 'text-blue-400';
            default: return 'text-gray-400';
        }
    };

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            // Reset after animation
            const timer = setTimeout(() => {
                setLogs([]);
                setSyncId(null);
                setStatus('idle');
                setExpandedStories(new Set());
                setDetectionCount(0);
                setTotalValue(0);
                hasStartedRef.current = false;
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-semibold text-gray-900">Sync Logs</h2>
                        {status === 'syncing' && (
                            <div className="flex items-center gap-1.5 text-xs text-blue-500">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Scanning...</span>
                            </div>
                        )}
                        {status === 'completed' && (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Complete</span>
                            </div>
                        )}
                        {status === 'failed' && (
                            <div className="flex items-center gap-1.5 text-xs text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>Failed</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-4 w-4 text-gray-500" />
                    </button>
                </div>

                {/* Log content - Single flat log stream */}
                <div
                    ref={logContainerRef}
                    className="flex-1 overflow-y-auto px-5 py-3 bg-white"
                >
                    {logs.length > 0 ? (
                        <div className="space-y-1.5">
                            {logs.map(log => (
                                <div key={log.id} className="flex items-start gap-3 text-xs">
                                    <span className="text-gray-400 font-mono w-14 flex-shrink-0">
                                        {formatTime(log.timestamp)}
                                    </span>
                                    <span className={`flex-1 ${log.type === 'success' ? 'text-emerald-600' :
                                        log.type === 'error' ? 'text-red-600' :
                                            log.type === 'warning' ? 'text-amber-600' :
                                                log.type === 'thinking' ? 'text-gray-400 italic' :
                                                    'text-gray-700'
                                        }`}>
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                            {/* Show context details inline */}
                            {logs.filter(l => l.context?.details?.length).map(log =>
                                log.context?.details?.map((detail, i) => (
                                    <div key={`${log.id}-detail-${i}`} className="flex items-start gap-3 text-xs pl-[68px]">
                                        <span className="text-gray-500">{detail}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-gray-500 text-xs">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Starting sync...
                        </div>
                    )}
                </div>

                {/* Footer with CTA */}
                {status === 'completed' && detectionCount > 0 && (
                    <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-700">
                                Found <span className="text-gray-900 font-semibold">{detectionCount}</span> issues worth{' '}
                                <span className="text-emerald-600 font-semibold">
                                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <Button
                                onClick={() => {
                                    onClose();
                                    navigate('/recoveries');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                            >
                                View potential claims
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">Next: review and approve for filing</p>
                    </div>
                )}

                {status === 'completed' && detectionCount === 0 && (
                    <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-700">
                                Scan complete. No new issues detected.
                            </div>
                            <Button onClick={onClose} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 text-xs h-8">
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
