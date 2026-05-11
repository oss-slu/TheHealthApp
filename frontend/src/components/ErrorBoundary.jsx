import React from 'react';
import { withTranslation } from 'react-i18next';

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child
 * component tree and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundaryBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { t, fallback, children } = this.props;
    const { hasError, error } = this.state;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback({ error, retry: this.handleRetry })
          : fallback;
      }

      // Default error UI
      return (
        <div
          className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {t('errors:boundaryTitle', 'Something went wrong')}
            </h1>
            <p className="text-gray-600 mb-6">
              {t(
                'errors:boundaryDescription',
                'We encountered an unexpected error. Please try again.'
              )}
            </p>

            {/* Show error details in development */}
            {import.meta.env.DEV && error && (
              <details className="text-left bg-gray-100 p-4 rounded mb-6 text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Error Details
                </summary>
                <pre className="overflow-auto text-red-600 whitespace-pre-wrap">
                  {error.toString()}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {t('errors:retry', 'Try Again')}
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                {t('errors:goHome', 'Go Home')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Wrap with withTranslation for i18n support in class component
const ErrorBoundary = withTranslation(['errors', 'common'])(ErrorBoundaryBase);

/** Shown when RouteErrorBoundary catches a render error (avoids blank screen when no custom fallback). */
class RouteErrorFallbackViewBase extends React.Component {
  render() {
    const { t, onRetry } = this.props;
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        role="alert"
        aria-live="assertive"
      >
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {t('errors:boundaryTitle', 'Something went wrong')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('errors:boundaryDescription', 'We encountered an unexpected error. Please try again.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={onRetry}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {t('errors:retry', 'Try Again')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const RouteErrorFallbackView = withTranslation(['errors', 'common'])(RouteErrorFallbackViewBase);

/**
 * Route-level error boundary with automatic reset on navigation
 */
class RouteErrorBoundaryBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    // Reset error state when route changes
    if (this.state.hasError && prevProps.location !== this.props.location) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <RouteErrorFallbackView onRetry={() => this.setState({ hasError: false })} />
      );
    }
    return this.props.children;
  }
}

export const RouteErrorBoundary = RouteErrorBoundaryBase;
export default ErrorBoundary;
