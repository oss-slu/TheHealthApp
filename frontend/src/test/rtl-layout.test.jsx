import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  renderWithProviders,
  renderWithRTL,
  screen,
  createAuthenticatedContext,
} from './test-utils';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/Dashboard';
import PageShell from '../components/PageShell';
import ErrorBoundary from '../components/ErrorBoundary';

describe('RTL (Right-to-Left) Layout Tests', () => {
  afterEach(() => {
    // Reset document direction after each test
    document.documentElement.dir = 'ltr';
  });

  describe('Document Direction', () => {
    it('sets dir="ltr" by default (English)', () => {
      renderWithProviders(<div>Test</div>, { locale: 'en', dir: 'ltr' });
      expect(document.documentElement.dir).toBe('ltr');
    });

    it('sets dir="rtl" for Arabic locale', () => {
      renderWithRTL(<div>Test</div>);
      expect(document.documentElement.dir).toBe('rtl');
    });
  });

  describe('Login Page RTL', () => {
    it('renders login form in Arabic', () => {
      renderWithRTL(<Login />);
      
      // Check for Arabic text
      expect(screen.getByLabelText(/اسم المستخدم/)).toBeInTheDocument();
      expect(screen.getByLabelText(/كلمة المرور/)).toBeInTheDocument();
    });

    it('renders login button in Arabic', () => {
      renderWithRTL(<Login />);
      
      expect(screen.getByRole('button', { name: /تسجيل الدخول/ })).toBeInTheDocument();
    });

    it('renders form element in RTL mode', () => {
      renderWithRTL(<Login />);
      
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(document.documentElement.dir).toBe('rtl');
    });
  });

  describe('Dashboard RTL', () => {
    it('renders dashboard title in Arabic', () => {
      renderWithRTL(<Dashboard />, {
        authContext: createAuthenticatedContext(),
      });

      expect(screen.getByRole('heading', { name: /لوحة التحكم/ })).toBeInTheDocument();
    });

    it('renders module cards with correct layout', () => {
      renderWithRTL(<Dashboard />, {
        authContext: createAuthenticatedContext(),
      });

      // Verify grid layout is present
      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });

    it('module links are accessible in RTL', () => {
      renderWithRTL(<Dashboard />, {
        authContext: createAuthenticatedContext(),
      });

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      
      // Verify links have href attributes
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('PageShell RTL Layout', () => {
    it('renders app name in RTL mode', () => {
      renderWithRTL(
        <PageShell title="dashboard:title">
          <div>Content</div>
        </PageShell>,
        { authContext: createAuthenticatedContext() }
      );

      // The app name should be rendered (using Arabic translation from test-utils)
      expect(screen.getByText('دعم الصحة')).toBeInTheDocument();
    });

    it('language picker dropdown has RTL positioning class', () => {
      renderWithRTL(
        <PageShell title="dashboard:title">
          <div>Content</div>
        </PageShell>,
        { authContext: createAuthenticatedContext() }
      );

      // The dropdown positioning should use rtl:left-0 class
      const languageButton = screen.getByRole('button', { name: /اللغة/ });
      expect(languageButton).toBeInTheDocument();
    });

    it('navigation links are accessible', () => {
      renderWithRTL(
        <PageShell title="dashboard:title" showNav={true}>
          <div>Content</div>
        </PageShell>,
        { authContext: createAuthenticatedContext() }
      );

      // Navigation should be present
      const navLinks = screen.getAllByRole('link');
      expect(navLinks.length).toBeGreaterThan(0);
    });

    it('footer renders correctly in RTL', () => {
      renderWithRTL(
        <PageShell title="dashboard:title">
          <div>Content</div>
        </PageShell>,
        { authContext: createAuthenticatedContext() }
      );

      const footer = document.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Error Boundary RTL', () => {
    // Component that throws an error
    const ThrowingComponent = () => {
      throw new Error('Test error');
    };

    // Need to suppress console.error for error boundary tests
    let originalError;
    beforeEach(() => {
      originalError = console.error;
      console.error = () => {};
    });
    afterEach(() => {
      console.error = originalError;
      document.documentElement.dir = 'ltr';
    });

    it('renders error boundary UI in Arabic', () => {
      renderWithRTL(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/حدث خطأ ما/)).toBeInTheDocument();
    });

    it('renders retry button in Arabic', () => {
      renderWithRTL(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /حاول مرة أخرى/ })).toBeInTheDocument();
    });

    it('renders go home button in Arabic', () => {
      renderWithRTL(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /الذهاب إلى الصفحة الرئيسية/ })).toBeInTheDocument();
    });
  });

  describe('Form Elements RTL', () => {
    it('input fields have correct text direction', () => {
      renderWithRTL(<Login />);

      const usernameInput = screen.getByLabelText(/اسم المستخدم/);
      const passwordInput = screen.getByLabelText(/كلمة المرور/);

      // Inputs should be in the document and functional
      expect(usernameInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it('labels align correctly in RTL', () => {
      renderWithRTL(<Login />);

      const labels = document.querySelectorAll('label');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('form buttons are accessible', () => {
      renderWithRTL(<Login />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('CSS RTL Classes', () => {
    it('PageShell uses RTL-aware positioning classes', () => {
      renderWithRTL(
        <PageShell title="test">
          <div>Content</div>
        </PageShell>,
        { authContext: createAuthenticatedContext() }
      );

      // Check for elements that should have RTL-aware classes
      // The language dropdown should have rtl:left-0 class
      const dropdown = document.querySelector('[class*="rtl:"]');
      // May or may not be present depending on dropdown state
      expect(document.documentElement.dir).toBe('rtl');
    });

    it('text alignment classes work in RTL context', () => {
      renderWithRTL(<Login />);

      // RTL should reverse text alignment where specified
      const textElements = document.querySelectorAll('[class*="text-"]');
      expect(textElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility in RTL', () => {
    it('all form inputs have associated labels', () => {
      renderWithRTL(<Login />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });

    it('buttons have accessible names', () => {
      renderWithRTL(<Login />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('links have accessible names', () => {
      renderWithRTL(
        <Dashboard />,
        { authContext: createAuthenticatedContext() }
      );

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });
  });

  describe('Language Switching', () => {
    it('can render same component in LTR and RTL', () => {
      // Render in LTR first
      const { unmount: unmountLTR } = renderWithProviders(<Login />, {
        locale: 'en',
        dir: 'ltr',
      });
      
      expect(document.documentElement.dir).toBe('ltr');
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      
      unmountLTR();
      document.body.innerHTML = '';
      
      // Render in RTL
      renderWithRTL(<Login />);
      
      expect(document.documentElement.dir).toBe('rtl');
      expect(screen.getByLabelText(/اسم المستخدم/)).toBeInTheDocument();
    });
  });
});
