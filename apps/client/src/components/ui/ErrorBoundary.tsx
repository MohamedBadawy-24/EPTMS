import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-scb-offwhite">
          <Card className="max-w-lg w-full p-8 text-center space-y-5 border-rose-200 shadow-xl bg-white">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertOctagon className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-scb-dark tracking-tight">
                {this.props.fallbackTitle || 'Component Execution Error'}
              </h2>
              <p className="text-xs text-scb-dark-muted leading-relaxed">
                An unexpected interface exception occurred while rendering this view. Your session data remains safe.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={this.handleReset}
                className="gap-2 shadow-sm font-semibold"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Application</span>
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => (window.location.href = '/')}
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
            </div>

            {/* Diagnostic Details Toggle */}
            <div className="pt-3 border-t border-scb-warm/40 text-left">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="text-[11px] font-semibold text-scb-dark-muted hover:text-scb-dark transition-colors"
              >
                {this.state.showDetails ? 'Hide Diagnostics' : 'Show Diagnostics'}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 bg-scb-offwhite rounded-md border border-scb-warm text-[11px] font-mono text-rose-700 overflow-x-auto text-left max-h-48 overflow-y-auto">
                  <p className="font-bold">{this.state.error?.toString()}</p>
                  <pre className="text-[10px] text-scb-dark-muted mt-2">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
