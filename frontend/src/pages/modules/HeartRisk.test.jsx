import { describe, expect, it, vi } from 'vitest';
import { createAuthenticatedContext, fireEvent, renderWithProviders, screen } from '../../test/test-utils';
import axios from 'axios';
import HeartRisk from './HeartRisk';

vi.mock('axios', () => ({
  default: { post: vi.fn() },
}));

describe('HeartRisk', () => {
  it('sends age derived from DOB on the birthday, not the cached account age', async () => {
    vi.stubEnv('VITE_ML_API_URL', '/predict');
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { risk_level: 'low' } });

    const today = new Date();
    const dateOfBirth = `${today.getFullYear() - 25}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const birthday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);

    vi.useFakeTimers();
    vi.setSystemTime(new Date(birthday.getTime() - 24 * 60 * 60 * 1000));
    try {
      renderWithProviders(<HeartRisk />, {
        authContext: createAuthenticatedContext({
          user: { date_of_birth: dateOfBirth, age: 24 },
        }),
      });

      vi.setSystemTime(birthday);
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'female' } });
      fireEvent.submit(document.querySelector('form'));

      expect(axios.post).toHaveBeenCalled();
      expect(axios.post.mock.calls[0][1].Age).toBe(25);
    } finally {
      vi.useRealTimers();
      vi.unstubAllEnvs();
    }
  });

  it('links legacy users without DOB to account settings', () => {
    renderWithProviders(<HeartRisk />, {
      authContext: createAuthenticatedContext({
        user: { username: 'legacyuser', name: 'Legacy User', age: 45 },
      }),
    });

    expect(screen.getByRole('link', { name: /add your date of birth in account settings to continue/i }))
      .toHaveAttribute('href', '/settings/account');
  });
});