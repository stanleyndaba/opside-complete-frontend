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
                <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-montserrat">
                    <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
                        {/* Background effects */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/20 via-emerald-500 to-emerald-500/20" />
                        <div className="absolute -top-[100px] -right-[100px] w-[200px] h-[200px] bg-emerald-500/10 blur-[80px]" />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>

                            <h1 className="text-2xl font-bold text-white mb-2">System Interruption</h1>
                            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                                The application encountered an unexpected state. Our monitoring system has been notified.
                            </p>

                            <div className="w-full space-y-3">
                                <Button
                                    onClick={this.handleReload}
                                    className="w-full bg-white text-black hover:bg-gray-200 font-semibold"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Reload Application
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => window.location.href = '/'}
                                    className="w-full text-gray-500 hover:text-white"
                                >
                                    Return to Home
                                </Button>
                            </div>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="mt-8 p-4 bg-black/50 rounded-lg border border-white/5 w-full text-left overflow-hidden">
                                    <p className="text-xs font-mono text-red-400 mb-2">Error Details (Dev Only):</p>
                                    <pre className="text-[10px] text-gray-500 font-mono whitespace-pre-wrap break-all">
                                        {this.state.error.toString()}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
