import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#070707] text-white relative font-montserrat">
                    <div
                        className="fixed inset-0 pointer-events-none opacity-[0.03]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        }}
                    />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

                    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10 lg:px-10">
                        <div className="w-full">
                            <div className="border-b border-white/8 pb-8">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="rounded-xl border border-white/10 bg-[#111111] p-2">
                                        <AlertTriangle className="h-5 w-5 text-white/70" />
                                    </div>
                                    <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">
                                        Something Went Wrong
                                    </p>
                                </div>
                                <h1 className="text-3xl font-sans font-light tracking-tight text-white">
                                    This page needs a quick refresh.
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/40">
                                    We lost the current page state for a moment. Refresh the application to get back into your workspace.
                                </p>
                            </div>

                            <div className="grid gap-8 pt-8 lg:grid-cols-[1.2fr_0.8fr]">
                                <div className="space-y-6">
                                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] px-5 py-5">
                                        <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">
                                            Quick Fix
                                        </p>
                                        <p className="mt-3 text-base font-medium tracking-tight text-white">
                                            Refresh once to reload this page cleanly.
                                        </p>
                                        <p className="mt-2 text-sm leading-relaxed text-white/40">
                                            Nothing has been changed here. This just reloads your current workspace view.
                                        </p>
                                    </div>

                                    {process.env.NODE_ENV === 'development' && this.state.error && (
                                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] px-5 py-5 text-left overflow-hidden">
                                            <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-red-300/80">
                                                Error Details
                                            </p>
                                            <pre className="mt-3 whitespace-pre-wrap break-all text-[11px] font-mono leading-relaxed text-white/45">
                                                {this.state.error.toString()}
                                            </pre>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-white/8 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                                    <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">
                                        Try Again
                                    </p>
                                    <div className="mt-4">
                                        <Button
                                            onClick={this.handleReload}
                                            className="h-11 w-full justify-between border border-white/10 bg-[#141414] px-4 text-white shadow-lg shadow-[0_0_20px_rgba(0,0,0,0.25)] hover:bg-[#1b1b1b]"
                                        >
                                            <span className="font-sans font-medium tracking-tight">Refresh Page</span>
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
