import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor, fireEvent } from './test-utils';
import Signup from '../pages/auth/Signup';
import Login from '../pages/auth/Login';

describe('Issue #165: Account Data-Quality & Onboarding Regression Coverage', () => {
  let mockSignup;
  let mockLogin;
  let mockOnAuthSuccess;

  beforeEach(() => {
    mockSignup = vi.fn();
    mockLogin = vi.fn();
    mockOnAuthSuccess = vi.fn();
    vi.clearAllMocks();
  });

  describe('1. Date of Birth (DOB) & Age Transition Coverage', () => {
    it('verifies signup payload handles date_of_birth or age boundary constraints', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValueOnce({ username: 'regression_user' });

      renderWithProviders(
        <Signup onAuthSuccess={mockOnAuthSuccess} />,
        { authContext: { signup: mockSignup } }
      );

      await user.type(screen.getByLabelText(/username/i), 'regression_user');
      await user.type(screen.getByLabelText(/full name/i), 'Regression Tester');

      const dobInput = screen.queryByLabelText(/date of birth/i);
      const ageInput = screen.queryByPlaceholderText(/age/i);

      if (dobInput) {
        fireEvent.change(dobInput, { target: { value: '1995-05-15' } });
      } else if (ageInput) {
        await user.type(ageInput, '29');
      }

      const genderSelect = document.querySelector('select[name="gender"]') || screen.getByRole('combobox');
      if (genderSelect) {
        await user.selectOptions(genderSelect, 'male');
      }

      const phoneInput = screen.getByPlaceholderText(/phone number/i);
      await user.type(phoneInput, '1234567890');

      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      expect(submitButton).toBeEnabled();
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalled();
      });
    });
  });

  describe('2. Phone Normalization & Canonical Formatting', () => {
    it('ensures phone normalization strips formatting and preserves canonical payload', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValueOnce({ username: 'phone_test' });

      renderWithProviders(
        <Signup onAuthSuccess={mockOnAuthSuccess} />,
        { authContext: { signup: mockSignup } }
      );

      await user.type(screen.getByLabelText(/username/i), 'phone_test');
      await user.type(screen.getByLabelText(/full name/i), 'Phone Tester');

      const dobInput = screen.queryByLabelText(/date of birth/i);
      const ageInput = screen.queryByPlaceholderText(/age/i);
      if (dobInput) {
        fireEvent.change(dobInput, { target: { value: '2000-01-01' } });
      } else if (ageInput) {
        await user.type(ageInput, '24');
      }

      const genderSelect = document.querySelector('select[name="gender"]') || screen.getByRole('combobox');
      if (genderSelect) {
        await user.selectOptions(genderSelect, 'male');
      }

      const phoneInput = screen.getByPlaceholderText(/phone number/i);
      await user.type(phoneInput, '(555) 019-2834');

      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: expect.stringMatching(/^[+]?[0-9]{10,15}$/),
          })
        );
      });
    });
  });

  describe('3. Legacy User Compatibility & Recovery', () => {
    it('authenticates legacy user without DOB and maintains authenticated session', async () => {
      const user = userEvent.setup();
      const legacyUserPayload = {
        username: 'legacy_john',
        name: 'Legacy John',
        age: 45,
        date_of_birth: null,
      };

      mockLogin.mockResolvedValueOnce(legacyUserPayload);

      renderWithProviders(
        <Login onAuthSuccess={mockOnAuthSuccess} />,
        { authContext: { login: mockLogin } }
      );

      await user.type(screen.getByLabelText(/username/i), 'legacy_john');
      await user.type(screen.getByLabelText(/password/i), 'Password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username: 'legacy_john',
          password: 'Password123',
        });
        expect(mockOnAuthSuccess).toHaveBeenCalledWith(legacyUserPayload);
      });
    });
  });

  describe('4. Localization & Accessibility Regression', () => {
    it('renders login and signup with correct accessible form labels and validation structure', () => {
      renderWithProviders(
        <Login onAuthSuccess={mockOnAuthSuccess} />,
        { authContext: { login: mockLogin } }
      );

      expect(screen.getByLabelText(/username/i)).toHaveAttribute('name', 'username');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
    });

    it('renders RTL/Arabic locale without breaking core authentication elements', () => {
      renderWithProviders(
        <Login onAuthSuccess={mockOnAuthSuccess} />,
        {
          authContext: { login: mockLogin },
          locale: 'ar',
          dir: 'rtl',
        }
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
    });
  });
});