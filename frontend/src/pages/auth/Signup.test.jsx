import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent } from '@testing-library/react';
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
      expect(screen.getByLabelText(/date of birth/i)).toHaveAttribute('type', 'date');
      expect(screen.queryByLabelText(/^age/i)).not.toBeInTheDocument();
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

      const genderSelect = document.querySelector('select[name="gender"]');
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

    it('requires a date of birth', async () => {
      const user = userEvent.setup();
      renderSignup();

      screen.getByLabelText(/date of birth/i).focus();
      await user.tab();

      expect(screen.getByText(/date of birth is required/i)).toBeInTheDocument();
    });

    it('rejects a date of birth for someone younger than 13', async () => {
      renderSignup();

      const today = new Date();
      const underageDate = `${today.getFullYear() - 12}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const dateInput = screen.getByLabelText(/date of birth/i);
      fireEvent.change(dateInput, { target: { value: underageDate } });
      fireEvent.blur(dateInput);

      expect(screen.getByText(/date of birth must correspond to an age between 13 and 120/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeDisabled();
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

      expect(screen.getByText(/enter a valid phone number for the selected country/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    const fillValidForm = async (user) => {
    await user.type(screen.getByLabelText(/username/i), 'john_doe');
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '2000-01-01' } });
    const genderSelect = document.querySelector('select[name="gender"]');
    await user.selectOptions(genderSelect, 'male');
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
          date_of_birth: '2000-01-01',
          gender: 'male',
          phone: '+11234567890',
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

  it('shows duplicate username conflict error message', async () => {
    const user = userEvent.setup();
    mockSignup.mockRejectedValueOnce({
      code: 'DUPLICATE_USERNAME',
      message: 'Username is already in use',
    });
    renderSignup();

    await user.type(screen.getByLabelText(/username/i), 'existing_user');
    await user.type(screen.getByPlaceholderText(/enter your full name/i), 'John Doe');
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '2000-01-01' } });
    const genderSelect = document.querySelector('select[name="gender"]');
    await user.selectOptions(genderSelect, 'male');
    await user.type(screen.getByPlaceholderText(/local phone number|phone number/i), '1234567890');
    await user.type(screen.getByPlaceholderText(/^enter password$/i), 'Password123!');
    await user.type(screen.getByPlaceholderText(/^confirm password$/i), 'Password123!');
    const submitButton = screen.getByRole('button', { name: /sign up|signup/i });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/username is already in use/i)).toBeInTheDocument();
    });
  });

    it('strips phone number of non-numeric characters', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValueOnce({ username: 'john_doe' });
      renderSignup();

    await user.type(screen.getByLabelText(/username/i), 'john_doe');
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '2000-01-01' } });
    const genderSelect = document.querySelector('select[name="gender"]');
    await user.selectOptions(genderSelect, 'male');
      
      // Try to type letters - they should be stripped
      const phoneInput = screen.getByPlaceholderText(/phone number/i);
      await user.type(phoneInput, '123abc4567890');
      
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+11234567890',
          })
        );
      });
    });
  });

  describe('International phone formatting & normalization', () => {
    const fillBaseForm = async (user) => {
      await user.type(screen.getByLabelText(/username/i), 'john_doe');
      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '2000-01-01' } });
      const genderSelect = document.querySelector('select[name="gender"]');
      await user.selectOptions(genderSelect, 'male');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
    };

    it('submits default +1 local input as canonical +11234567890', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValueOnce({ username: 'john_doe' });
      renderSignup();

      await fillBaseForm(user);
      const phoneInput = screen.getByPlaceholderText(/phone number/i);
      await user.type(phoneInput, '1234567890');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+11234567890',
          })
        );
      });
    });

    it('submits +34 with 9-digit local number as +34912345678', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValueOnce({ username: 'john_doe' });
      renderSignup();

      await fillBaseForm(user);
      const countrySelect = screen.getByRole('combobox', { name: /country code/i });
      await user.selectOptions(countrySelect, '+34');
      const phoneInput = screen.getByPlaceholderText(/phone number/i);
      await user.type(phoneInput, '912345678');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+34912345678',
          })
        );
      });
    });

    it('submits +971 with 9-digit local number as +971501234567', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValueOnce({ username: 'john_doe' });
      renderSignup();

      await fillBaseForm(user);
      const countrySelect = screen.getByRole('combobox', { name: /country code/i });
      await user.selectOptions(countrySelect, '+971');
      const phoneInput = screen.getByPlaceholderText(/phone number/i);
      await user.type(phoneInput, '501234567');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+971501234567',
          })
        );
      });
    });

    it('normalizes formatted local input correctly', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValueOnce({ username: 'john_doe' });
      renderSignup();

      await fillBaseForm(user);
      const phoneInput = screen.getByPlaceholderText(/phone number/i);
      await user.type(phoneInput, '(555) 123-4567');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+15551234567',
          })
        );
      });
    });

    it('submits pasted +15551234567 unchanged without duplicate +1', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValueOnce({ username: 'john_doe' });
      renderSignup();

      await fillBaseForm(user);
      const phoneInput = screen.getByPlaceholderText(/phone number/i);
      fireEvent.change(phoneInput, { target: { name: 'phone', value: '+15551234567' } });
      expect(screen.getByRole('button', { name: /sign up/i })).toBeEnabled();
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+15551234567',
          })
        );
      });
    });

    it('submits pasted +34912345678 unchanged without prepending dropdown country code', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValueOnce({ username: 'john_doe' });
      renderSignup();

      await fillBaseForm(user);
      const phoneInput = screen.getByPlaceholderText(/phone number/i);
      fireEvent.change(phoneInput, { target: { name: 'phone', value: '+34912345678' } });
      expect(screen.getByRole('button', { name: /sign up/i })).toBeEnabled();
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+34912345678',
          })
        );
      });
    });

    it('handles pasted E.164 values with surrounding whitespace correctly', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValueOnce({ username: 'john_doe' });
      renderSignup();

      await fillBaseForm(user);
      const phoneInput = screen.getByPlaceholderText(/phone number/i);
      fireEvent.change(phoneInput, { target: { name: 'phone', value: '  +34 912345678  ' } });
      expect(screen.getByRole('button', { name: /sign up/i })).toBeEnabled();
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+34912345678',
          })
        );
      });
    });

    it('rejects invalid local lengths per country', async () => {
      const user = userEvent.setup();
      renderSignup();

      const countrySelect = screen.getByRole('combobox', { name: /country code/i });
      const phoneInput = screen.getByPlaceholderText(/phone number/i);

      // Spain (+34) requires 9 digits; 8 digits should be rejected
      await user.selectOptions(countrySelect, '+34');
      await user.type(phoneInput, '91234567');
      await user.tab();
      expect(screen.getByText(/enter a valid phone number for the selected country/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeDisabled();

      // UAE (+971) requires 9 digits; 8 digits should be rejected
      await user.selectOptions(countrySelect, '+971');
      await user.clear(phoneInput);
      await user.type(phoneInput, '50123456');
      await user.tab();
      expect(screen.getByText(/enter a valid phone number for the selected country/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeDisabled();

      // US (+1) requires 10 digits; 9 digits should be rejected
      await user.selectOptions(countrySelect, '+1');
      await user.clear(phoneInput);
      await user.type(phoneInput, '555123456');
      await user.tab();
      expect(screen.getByText(/enter a valid phone number for the selected country/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeDisabled();
    });

    it('uses the active translation for Country Code accessible label in RTL/Arabic', () => {
      renderWithProviders(<Signup onAuthSuccess={mockOnAuthSuccess} />, {
        locale: 'ar',
        dir: 'rtl',
      });

      expect(screen.getByRole('combobox', { name: /رمز الدولة/i })).toBeInTheDocument();
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
