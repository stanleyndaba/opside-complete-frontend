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
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900">Sync Logs</h2>
                        {status === 'syncing' && (
                            <div className="flex items-center gap-2 text-sm text-blue-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Scanning...</span>
                            </div>
                        )}
                        {status === 'completed' && (
                            <div className="flex items-center gap-2 text-sm text-emerald-400">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Complete</span>
                            </div>
                        )}
                        {status === 'failed' && (
                            <div className="flex items-center gap-2 text-sm text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                <span>Failed</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Log content */}
                <div
                    ref={logContainerRef}
                    className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
                >
                    {logStories.map(story => {
                        const isExpanded = expandedStories.has(story.id);
                        return (
                            <div key={story.id} className="rounded-lg border border-gray-200 overflow-hidden">
                                {/* Story header */}
                                <button
                                    onClick={() => toggleStory(story.id)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4 text-gray-500" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-gray-500" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900">{story.label}</span>
                                        <span className="text-xs text-gray-500">— {story.logs.length} events</span>
                                    </div>
                                    {story.isComplete && (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    )}
                                </button>

                                {/* Story logs */}
                                {isExpanded && (
                                    <div className="px-4 py-3 space-y-2 bg-[#2D2D2D]">
                                        {story.logs.map(log => (
                                            <div key={log.id} className="flex items-start gap-3 text-sm">
                                                <span className="text-gray-500 text-xs font-mono w-12 flex-shrink-0">
                                                    {formatTime(log.timestamp)}
                                                </span>
                                                <span className={`${getLogColor(log.type)} flex-1`}>
                                                    {log.message}
                                                </span>
                                            </div>
                                        ))}
                                        {/* Show context details if present */}
                                        {story.logs.some(l => l.context?.details?.length) && (
                                            <div className="mt-3 space-y-1">
                                                {story.logs.flatMap(l => l.context?.details || []).map((detail, i) => (
                                                    <div key={i} className="text-xs text-gray-400 pl-14">
                                                        {detail}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {logs.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-gray-500">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Starting sync...
                        </div>
                    )}
                </div>

                {/* Footer with CTA */}
                {status === 'completed' && detectionCount > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
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
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                View potential claims
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Next: review and approve for filing</p>
                    </div>
                )}

                {status === 'completed' && detectionCount === 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Scan complete. No new issues detected.
                            </div>
                            <Button onClick={onClose} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
