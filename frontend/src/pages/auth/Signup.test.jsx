import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from '../../test/test-utils';
import Signup from './Signup';

describe('Signup', () => {
  let mockSignup;
  let mockOnAuthSuccess;

  beforeEach(() => {
    mockSignup = vi.fn();
    mockOnAuthSuccess = vi.fn();
  });

  const renderSignup = (options = {}) => {
    return renderWithProviders(
      <Signup onAuthSuccess={mockOnAuthSuccess} />,
      {
        authContext: { signup: mockSignup },
        ...options,
      }
    );
  };

  describe('Rendering', () => {
    it('renders signup form with all required fields', () => {
      renderSignup();

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('has submit button disabled initially', () => {
      renderSignup();

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      expect(submitButton).toBeDisabled();
    });

    it('renders gender dropdown with options', () => {
      renderSignup();

      const genderSelect = screen.getByRole('combobox');
      expect(genderSelect).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error for invalid username', async () => {
      const user = userEvent.setup();
      renderSignup();

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, '_bad');
      await user.tab();

      expect(screen.getByText(/invalid username/i)).toBeInTheDocument();
    });

    it('shows error for name too short', async () => {
      const user = userEvent.setup();
      renderSignup();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'A');
      await user.tab();

      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    });

    it('shows error for invalid age', async () => {
      const user = userEvent.setup();
      renderSignup();

      const ageInput = screen.getByPlaceholderText(/age/i);
      await user.type(ageInput, '10');
      await user.tab();

      expect(screen.getByText(/age must be between 13 and 120/i)).toBeInTheDocument();
    });

    it('shows error for mismatched passwords', async () => {
      const user = userEvent.setup();
      renderSignup();

      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Different123');
      await user.tab();

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('shows error for invalid phone number', async () => {
      const user = userEvent.setup();
      renderSignup();

      const phoneInput = screen.getByPlaceholderText(/phone number/i);
      await user.type(phoneInput, '123');
      await user.tab();

      expect(screen.getByText(/enter a valid 10-15 digit phone number/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    const fillValidForm = async (user) => {
      await user.type(screen.getByLabelText(/username/i), 'john_doe');
      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByPlaceholderText(/age/i), '25');
      await user.selectOptions(screen.getByRole('combobox'), 'male');
      await user.type(screen.getByPlaceholderText(/phone number/i), '1234567890');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
    };

    it('enables submit button when form is valid', async () => {
      const user = userEvent.setup();
      renderSignup();

      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      expect(submitButton).toBeEnabled();
    });

    it('calls signup with form data on submit', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValueOnce({ username: 'john_doe' });
      renderSignup();

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith({
          username: 'john_doe',
          name: 'John Doe',
          age: 25,
          gender: 'male',
          phone: '1234567890',
          password: 'Password123',
        });
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      mockSignup.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      renderSignup();

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      expect(screen.getByText(/please wait/i)).toBeInTheDocument();
    });

    it('shows error message on signup failure', async () => {
      const user = userEvent.setup();
      mockSignup.mockRejectedValueOnce({
        messageKey: 'errors.generic',
        message: 'Username taken',
        status: 400,
      });
      renderSignup();

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        // Error box appears with red styling
        const errorBox = document.querySelector('.bg-red-50');
        expect(errorBox).toBeInTheDocument();
      });
    });

    it('strips phone number of non-numeric characters', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValueOnce({ username: 'john_doe' });
      renderSignup();

      await user.type(screen.getByLabelText(/username/i), 'john_doe');
      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByPlaceholderText(/age/i), '25');
      await user.selectOptions(screen.getByRole('combobox'), 'male');
      
      // Try to type letters - they should be stripped
      const phoneInput = screen.getByPlaceholderText(/phone number/i);
      await user.type(phoneInput, '123abc4567890');
      
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '1234567890',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper autocomplete attributes', () => {
      renderSignup();

      expect(screen.getByLabelText(/username/i)).toHaveAttribute(
        'autocomplete',
        'username'
      );
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
        'autocomplete',
        'new-password'
      );
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute(
        'autocomplete',
        'new-password'
      );
    });
  });
});
