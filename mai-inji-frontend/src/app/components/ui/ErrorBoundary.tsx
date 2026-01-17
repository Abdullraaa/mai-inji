'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './Button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // You can also log the error to an error reporting service
        console.error('Uncaught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full text-center space-y-6 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
                            <p className="text-gray-600">
                                An unexpected error occurred. We've been notified and are working on it.
                            </p>
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs font-mono overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                </div>
                            )}
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={this.handleReset}
                                className="w-full"
                            >
                                Return to Home
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
