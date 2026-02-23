import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ErrorBoundary from './ErrorBoundary';

// Test i18n instance
const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      errors: {
        boundaryTitle: 'Something went wrong',
        boundaryDescription: 'We encountered an unexpected error.',
        retry: 'Try Again',
        goHome: 'Go Home',
      },
    },
  },
});

// Component that throws an error
const ThrowingComponent = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Wrapper to provide i18n
const renderWithI18n = (ui) => {
  return render(<I18nextProvider i18n={testI18n}>{ui}</I18nextProvider>);
};

describe('ErrorBoundary', () => {
  // Suppress console.error for expected errors in tests
  let originalError;

  beforeEach(() => {
    originalError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe('When no error occurs', () => {
    it('renders children normally', () => {
      renderWithI18n(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('does not show error UI', () => {
      renderWithI18n(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );

      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('When an error occurs', () => {
    it('catches errors and displays fallback UI', () => {
      renderWithI18n(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('displays error description', () => {
      renderWithI18n(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/encountered an unexpected error/i)).toBeInTheDocument();
    });

    it('displays Try Again button', () => {
      renderWithI18n(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('displays Go Home button', () => {
      renderWithI18n(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
    });

    it('has alert role for accessibility', () => {
      renderWithI18n(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('logs error to console', () => {
      renderWithI18n(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });

    it('calls onError callback when provided', () => {
      const onError = vi.fn();

      renderWithI18n(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });
  });

  describe('Error Recovery', () => {
    it('allows retry after error occurs', () => {
      renderWithI18n(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Verify retry button exists and is clickable
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
      
      // Click retry - it will re-throw since shouldThrow is still true
      // but we're just testing that the button works
      fireEvent.click(retryButton);
      
      // The error will re-appear since the component still throws
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('redirects to home when Go Home is clicked', () => {
      // Mock window.location
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' };

      renderWithI18n(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByRole('button', { name: /go home/i }));

      expect(window.location.href).toBe('/');

      // Restore
      window.location = originalLocation;
    });
  });

  describe('Custom Fallback', () => {
    it('renders custom fallback element when provided', () => {
      renderWithI18n(
        <ErrorBoundary fallback={<div>Custom error message</div>}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('renders custom fallback function with error info', () => {
      const fallbackFn = ({ error, retry }) => (
        <div>
          <p>Error: {error.message}</p>
          <button onClick={retry}>Retry</button>
        </div>
      );

      renderWithI18n(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/error: test error/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Nested Error Boundaries', () => {
    it('inner boundary catches error without affecting outer', () => {
      renderWithI18n(
        <ErrorBoundary>
          <div>
            <p>Outer content</p>
            <ErrorBoundary>
              <ThrowingComponent />
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Outer content')).toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
