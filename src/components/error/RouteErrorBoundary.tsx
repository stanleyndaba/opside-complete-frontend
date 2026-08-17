import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reportRuntimeError, shouldAutoReloadForChunkError } from '@/lib/runtimeErrorRecovery';

interface BoundaryProps {
  children: ReactNode;
  resetKey: string;
}

interface BoundaryState {
  hasError: boolean;
  error: Error | null;
  isRecoveringChunk: boolean;
}

class RouteErrorBoundaryInner extends Component<BoundaryProps, BoundaryState> {
  public state: BoundaryState = {
    hasError: false,
    error: null,
    isRecoveringChunk: false,
  };

  public static getDerivedStateFromError(error: Error): BoundaryState {
    return { hasError: true, error, isRecoveringChunk: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportRuntimeError('route', error, errorInfo);

    if (shouldAutoReloadForChunkError('route', error)) {
      this.setState({ isRecoveringChunk: true });
      window.setTimeout(() => window.location.reload(), 120);
    }
  }

  public componentDidUpdate(prevProps: BoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null, isRecoveringChunk: false });
    }
  }

  private resetRoute = () => {
    this.setState({ hasError: false, error: null, isRecoveringChunk: false });
  };

  private reloadPage = () => {
    window.location.reload();
  };

  public render() {
    if (!this.state.hasError) return this.props.children;

    if (this.state.isRecoveringChunk) {
      return (
        <main className="flex min-h-[calc(100vh-96px)] items-center justify-center bg-[#FAFAF7] px-6 text-[#182026]" aria-label="Updating Margin">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 font-merriweather text-2xl font-bold tracking-tight">
              <img src="/logoimagetwo.png" alt="Margin" className="h-7 w-auto object-contain" />
              <span>Margin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border border-[#D8E3EA] border-t-[#0B74DE]" />
              <span className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Updating platform</span>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="relative min-h-[calc(100vh-96px)] overflow-hidden bg-[#FAFAF7] px-5 py-12 text-[#182026] md:px-8 md:py-16">
        <div className="pointer-events-none absolute inset-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="border-b border-[#D8E3E8] pb-7">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-[16px] border border-[#F1C8C8] bg-[#FFF5F5] p-2 text-[#B74A4A]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-tight text-[#0B74DE]">
                Page Recovery
              </p>
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.045em] text-[#182026] md:text-5xl">
              This view hit a temporary error.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#66737F] md:text-base">
              Your workspace is still available. Try reloading this view first; refresh the full page only if it keeps happening.
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={this.resetRoute}
              className="h-12 rounded-full bg-[#0B74DE] px-5 text-white shadow-[0_18px_40px_rgba(11,116,222,0.2)] hover:bg-[#0869C9]"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retry View
            </Button>
            <Button
              variant="outline"
              onClick={this.reloadPage}
              className="h-12 rounded-full border-[#CFE0EA] bg-white px-5 text-[#25313A] hover:bg-[#F8FAFC]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-6 max-h-56 overflow-auto rounded-[20px] border border-[#F1C8C8] bg-[#FFF8F8] p-4 text-[11px] leading-relaxed text-[#7A5555]">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      </main>
    );
  }
}

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  const resetKey = `${location.pathname}${location.search}`;

  return (
    <RouteErrorBoundaryInner resetKey={resetKey}>
      {children}
    </RouteErrorBoundaryInner>
  );
}

