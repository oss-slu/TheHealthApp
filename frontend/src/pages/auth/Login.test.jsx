import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from '../../test/test-utils';
import Login from './Login';

describe('Login', () => {
  let mockLogin;
  let mockOnAuthSuccess;

  beforeEach(() => {
    mockLogin = vi.fn();
    mockOnAuthSuccess = vi.fn();
  });

  const renderLogin = (options = {}) => {
    return renderWithProviders(
      <Login onAuthSuccess={mockOnAuthSuccess} />,
      {
        authContext: { login: mockLogin },
        ...options,
      }
    );
  };

  describe('Rendering', () => {
    it('renders login form with username and password fields', () => {
      renderLogin();

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      renderLogin();

      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it('has submit button disabled initially', () => {
      renderLogin();

      const submitButton = screen.getByRole('button', { name: /login/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Username Validation', () => {
    it('shows error for username starting with underscore', async () => {
      const user = userEvent.setup();
      renderLogin();

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, '_invalid');
      await user.tab(); // Trigger blur

      expect(screen.getByText(/invalid username/i)).toBeInTheDocument();
    });

    it('shows error for username that is too short', async () => {
      const user = userEvent.setup();
      renderLogin();

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'ab');
      await user.tab();

      expect(screen.getByText(/invalid username/i)).toBeInTheDocument();
    });

    it('accepts valid username', async () => {
      const user = userEvent.setup();
      renderLogin();

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'john_doe');
      await user.tab();

      expect(screen.queryByText(/invalid username/i)).not.toBeInTheDocument();
    });
  });

  describe('Password Validation', () => {
    it('shows error for password without uppercase', async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');
      await user.tab();

      expect(screen.getByText(/invalid password/i)).toBeInTheDocument();
    });

    it('shows error for password that is too short', async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'Pass1');
      await user.tab();

      expect(screen.getByText(/invalid password/i)).toBeInTheDocument();
    });

    it('accepts valid password', async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'Password123');
      await user.tab();

      expect(screen.queryByText(/invalid password/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('enables submit button when form is valid', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.type(screen.getByLabelText(/username/i), 'john_doe');
      await user.type(screen.getByLabelText(/password/i), 'Password123');

      const submitButton = screen.getByRole('button', { name: /login/i });
      expect(submitButton).toBeEnabled();
    });

    it('calls login with normalized username on submit', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce({ username: 'john_doe' });
      renderLogin();

      await user.type(screen.getByLabelText(/username/i), '  john_doe  ');
      await user.type(screen.getByLabelText(/password/i), 'Password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username: 'john_doe',
          password: 'Password123',
        });
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      renderLogin();

      await user.type(screen.getByLabelText(/username/i), 'john_doe');
      await user.type(screen.getByLabelText(/password/i), 'Password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      expect(screen.getByText(/please wait/i)).toBeInTheDocument();
    });

    it('shows error message on login failure', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce({
        messageKey: 'errors.generic',
        message: 'Invalid credentials',
        status: 401,
      });
      renderLogin();

      await user.type(screen.getByLabelText(/username/i), 'john_doe');
      await user.type(screen.getByLabelText(/password/i), 'Password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        // Error box appears with red styling
        const errorBox = document.querySelector('.bg-red-50');
        expect(errorBox).toBeInTheDocument();
      });
    });

    it('calls onAuthSuccess after successful login', async () => {
      const user = userEvent.setup();
      const mockUser = { username: 'john_doe' };
      mockLogin.mockResolvedValueOnce(mockUser);
      renderLogin();

      await user.type(screen.getByLabelText(/username/i), 'john_doe');
      await user.type(screen.getByLabelText(/password/i), 'Password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockOnAuthSuccess).toHaveBeenCalledWith(mockUser);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderLogin();

      expect(screen.getByLabelText(/username/i)).toHaveAttribute('name', 'username');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('name', 'password');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
    });

    it('has autocomplete attributes for password managers', () => {
      renderLogin();

      expect(screen.getByLabelText(/username/i)).toHaveAttribute(
        'autocomplete',
        'username'
      );
      expect(screen.getByLabelText(/password/i)).toHaveAttribute(
        'autocomplete',
        'current-password'
      );
    });
  });
});
