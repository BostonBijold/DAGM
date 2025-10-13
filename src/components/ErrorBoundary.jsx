import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} strokeWidth={2.5} className="text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#333333] mb-2">Something went wrong</h1>
              <p className="text-[#333333] opacity-70 mb-4">
                The app encountered an unexpected error. This might be due to a connection issue or corrupted data.
              </p>
              
              {/* Error details for debugging */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                  <h3 className="font-bold text-red-800 mb-2">Error Details (Development)</h3>
                  <p className="text-sm text-red-700 mb-2 font-mono">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-xs text-red-600">
                      <summary className="cursor-pointer">Stack Trace</summary>
                      <pre className="mt-2 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center gap-3 bg-[#333333] text-white py-4 rounded-lg hover:bg-black font-bold uppercase text-sm tracking-wider shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
              >
                <RefreshCw size={20} strokeWidth={2.5} />
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-3 bg-gray-100 text-[#333333] py-3 rounded-lg hover:bg-gray-200 font-medium text-sm transition-all"
              >
                Reload Page
              </button>
            </div>
            
            <p className="text-xs text-[#333333] opacity-50 mt-4">
              If the problem persists, try refreshing the page or check your internet connection.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
