import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
                <div className="relative min-h-screen overflow-hidden bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
                    <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
                    <div
                        className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        }}
                    />
                    <div className="pointer-events-none fixed inset-0 z-0">
                        <div className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(46,125,91,0.1),transparent_28%)]" />
                    </div>

                    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10 lg:px-10">
                        <div className="w-full">
                            <div className="border-b border-[#D8E3E8] pb-8">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="rounded-[16px] border border-[#F1C8C8] bg-[#FFF5F5] p-2 text-[#B74A4A]">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">
                                        Something Went Wrong
                                    </p>
                                </div>
                                <h1 className="text-4xl font-semibold tracking-[-0.055em] text-[#182026] md:text-5xl">
                                    This page needs a quick refresh.
                                </h1>
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#66737F] md:text-base">
                                    We lost the current page state for a moment. Refresh the application to get back into your workspace.
                                </p>
                            </div>

                            <div className="grid gap-8 pt-8 lg:grid-cols-[1.2fr_0.8fr]">
                                <div className="space-y-6">
                                    <div className="rounded-[28px] border border-[#CFE0EA] bg-white px-5 py-5 shadow-[0_24px_80px_rgba(37,49,58,0.08)]">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#66737F]">
                                            Quick Fix
                                        </p>
                                        <p className="mt-3 text-base font-semibold tracking-[-0.02em] text-[#182026]">
                                            Refresh once to reload this page cleanly.
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-[#66737F]">
                                            Nothing has been changed here. This just reloads your current workspace view.
                                        </p>
                                    </div>

                                    {process.env.NODE_ENV === 'development' && this.state.error && (
                                        <div className="overflow-hidden rounded-[28px] border border-[#F1C8C8] bg-[#FFF8F8] px-5 py-5 text-left">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B74A4A]">
                                                Error Details
                                            </p>
                                            <pre className="mt-3 whitespace-pre-wrap break-all text-[11px] font-mono leading-relaxed text-[#7A5555]">
                                                {this.state.error.toString()}
                                            </pre>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-[#D8E3E8] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#66737F]">
                                        Try Again
                                    </p>
                                    <div className="mt-4">
                                        <Button
                                            onClick={this.handleReload}
                                            className="h-12 w-full justify-between rounded-full bg-[#0B74DE] px-5 text-white shadow-[0_18px_40px_rgba(11,116,222,0.2)] hover:bg-[#0869C9]"
                                        >
                                            <span className="font-semibold tracking-tight">Refresh Page</span>
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
