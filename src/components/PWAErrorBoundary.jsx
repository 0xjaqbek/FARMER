// src/components/PWAErrorBoundary.jsx
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

class PWAErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('PWAErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log specific hook errors
    if (error.message && error.message.includes('Invalid hook call')) {
      console.error('React Hook Error detected:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isHookError = this.state.error?.message?.includes('Invalid hook call');
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">
                    {isHookError ? 'Component Loading Error' : 'Application Error'}
                  </h3>
                  <AlertDescription className="text-red-700">
                    {isHookError ? (
                      <>
                        There was an issue loading the PWA features. This sometimes happens during page refreshes.
                      </>
                    ) : (
                      <>
                        Something went wrong with the application. Please try refreshing the page.
                      </>
                    )}
                  </AlertDescription>
                </div>

                <div className="flex flex-col gap-2">
                  {this.state.retryCount < 3 && (
                    <Button 
                      onClick={this.handleRetry}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again {this.state.retryCount > 0 && `(${this.state.retryCount + 1}/3)`}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={this.handleReload}
                    size="sm"
                    variant="outline"
                  >
                    Reload Page
                  </Button>
                </div>

                {/* Development error details */}
                {import.meta.env.NODE_ENV === 'development' && (
                  <details className="text-xs text-red-600 mt-4">
                    <summary className="cursor-pointer font-medium">
                      Error Details (Development)
                    </summary>
                    <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                      {this.state.error && this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PWAErrorBoundary;