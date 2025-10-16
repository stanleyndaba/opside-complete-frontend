import React from 'react';

interface ErrorBoundaryState { hasError: boolean; error?: any; }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI Error:', error, errorInfo);
    if ((window as any).SENTRY_DSN && (window as any).Sentry?.captureException) {
      (window as any).Sentry.captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mt-1">Try refreshing the page.</p>
        </div>
      );
    }
    return this.props.children as any;
  }
}

