import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
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

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in CarCare Pro:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleClearAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0B3A6E] text-white p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Application Error Recovered</h1>
                <p className="text-xs text-slate-300">CarCare Pro Qatar Workshop Management</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed">
                An unexpected interface error occurred. You can attempt to refresh the view or reset local cache data to restore normal operation without any loss of critical system configurations.
              </div>

              {this.state.error && (
                <div className="text-xs text-slate-600 bg-slate-100 p-3 rounded-xl font-mono break-words border border-slate-200">
                  {this.state.error.message || 'Unknown runtime error'}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0B3A6E] hover:bg-[#082b52] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                <button
                  type="button"
                  onClick={this.handleClearAndReload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Cache & Reload
                </button>
              </div>

              {/* Collapsible Tech details */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="flex items-center justify-between w-full text-[11px] font-bold text-slate-500 hover:text-slate-800"
                >
                  <span>Diagnostic Details</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {this.state.showDetails && (
                  <pre className="mt-2 text-[10px] text-slate-600 bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto max-h-48 font-mono">
                    {this.state.error?.stack || 'No stack trace available'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
