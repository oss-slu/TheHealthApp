import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from '../../test/test-utils';
import ForgotPassword from './ForgotPassword';

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    forgotPassword: vi.fn(),
  },
}));

import { authService } from '../../services/authService';

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForgotPassword = (options = {}) => {
    return renderWithProviders(<ForgotPassword />, options);
  };

  describe('Rendering', () => {
    it('renders forgot password form', () => {
      renderForgotPassword();

      // The label contains "Phone / Email"
      expect(screen.getByPlaceholderText(/phone/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('has submit button disabled initially', () => {
      renderForgotPassword();

      const submitButton = screen.getByRole('button', { name: /save/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Validation', () => {
    it('enables submit button when contact is entered', async () => {
      const user = userEvent.setup();
      renderForgotPassword();

      const contactInput = screen.getByPlaceholderText(/phone.*email/i);
      await user.type(contactInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /save/i });
      expect(submitButton).toBeEnabled();
    });

    it('disables submit button when contact is empty', async () => {
      const user = userEvent.setup();
      renderForgotPassword();

      const contactInput = screen.getByPlaceholderText(/phone.*email/i);
      await user.type(contactInput, 'test@example.com');
      await user.clear(contactInput);

      const submitButton = screen.getByRole('button', { name: /save/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('calls forgotPassword service on submit', async () => {
      const user = userEvent.setup();
      authService.forgotPassword.mockResolvedValueOnce({});
      renderForgotPassword();

      await user.type(screen.getByPlaceholderText(/phone.*email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(authService.forgotPassword).toHaveBeenCalledWith({
          phoneOrEmail: 'test@example.com',
        });
      });
    });

    it('shows success message after submission', async () => {
      const user = userEvent.setup();
      authService.forgotPassword.mockResolvedValueOnce({});
      renderForgotPassword();

      await user.type(screen.getByPlaceholderText(/phone.*email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        // The success message uses a translation key, check for the green success box
        const successBox = document.querySelector('.bg-green-50');
        expect(successBox).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      authService.forgotPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      renderForgotPassword();

      await user.type(screen.getByPlaceholderText(/phone.*email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(screen.getByText(/please wait/i)).toBeInTheDocument();
    });

    it('disables input during submission', async () => {
      const user = userEvent.setup();
      authService.forgotPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      renderForgotPassword();

      const contactInput = screen.getByPlaceholderText(/phone.*email/i);
      await user.type(contactInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(contactInput).toBeDisabled();
    });

    it('shows error message on failure', async () => {
      const user = userEvent.setup();
      authService.forgotPassword.mockRejectedValueOnce({
        messageKey: 'errors.generic',
        message: 'User not found',
        status: 404,
      });
      renderForgotPassword();

      await user.type(screen.getByPlaceholderText(/phone/i), 'unknown@example.com');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        // Error box appears with red styling
        const errorBox = document.querySelector('.bg-red-50');
        expect(errorBox).toBeInTheDocument();
      });
    });

    it('clears error when user types in input', async () => {
      const user = userEvent.setup();
      authService.forgotPassword.mockRejectedValueOnce({
        messageKey: 'errors.generic',
        status: 404,
      });
      renderForgotPassword();

      const contactInput = screen.getByPlaceholderText(/phone/i);
      await user.type(contactInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        // Error box appears with red styling
        const errorBox = document.querySelector('.bg-red-50');
        expect(errorBox).toBeInTheDocument();
      });

      await user.type(contactInput, 'more');

      // Error box should be gone
      const errorBoxAfter = document.querySelector('.bg-red-50');
      expect(errorBoxAfter).not.toBeInTheDocument();
    });

    it('trims whitespace from contact', async () => {
      const user = userEvent.setup();
      authService.forgotPassword.mockResolvedValueOnce({});
      renderForgotPassword();

      await user.type(screen.getByPlaceholderText(/phone.*email/i), '  test@example.com  ');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(authService.forgotPassword).toHaveBeenCalledWith({
          phoneOrEmail: 'test@example.com',
        });
      });
    });
  });
});
