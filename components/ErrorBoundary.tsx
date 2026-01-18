import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
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
                <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-gray-900 border border-red-900/50 rounded-lg p-8 text-center shadow-2xl">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-red-900/20 rounded-full animate-pulse-slow">
                                <AlertTriangle className="w-12 h-12 text-red-500" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4">
                            System Anomaly Detected
                        </h1>

                        <p className="text-gray-400 mb-8 leading-relaxed">
                            We've encountered an unexpected issue. Our team has been notified.
                            Please try refreshing the mission control.
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={this.handleReload}
                                className="w-full py-3 px-6 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg shadow-red-900/20"
                            >
                                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                Reinitialize System
                            </button>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="mt-8 text-left p-4 bg-black/50 rounded border border-gray-800 overflow-auto max-h-48">
                                    <p className="font-mono text-xs text-red-400 break-all">
                                        {this.state.error.toString()}
                                    </p>
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

export default ErrorBoundary;
