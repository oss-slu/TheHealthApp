import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, userEvent, renderWithProviders, createAuthenticatedContext } from '../../test/test-utils';
import HeartRisk from './HeartRisk';
import axios from 'axios';
import { showErrorToast } from '../../lib/toast';

vi.mock('axios');
vi.mock('../../lib/toast', () => ({
  showErrorToast: vi.fn(),
}));

describe('HeartRisk', () => {
  const originalEnv = import.meta.env.VITE_ML_API_URL;

  beforeEach(() => {
    import.meta.env.VITE_ML_API_URL = 'http://localhost:9999/predict';
    vi.mocked(axios.post).mockReset();
    vi.mocked(showErrorToast).mockReset();
  });

  afterEach(() => {
    import.meta.env.VITE_ML_API_URL = originalEnv;
  });

  const fillRequired = async (user) => {
    await user.type(screen.getByPlaceholderText(/Enter your age/i), '45');
    await user.selectOptions(screen.getByRole('combobox'), 'male');
  };

  it('shows a clear message when the ML API returns an empty object', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();
    renderWithProviders(<HeartRisk />, { authContext: createAuthenticatedContext() });

    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: /Complete Assessment/i }));

    expect(await screen.findByText(/screening service returned no usable result/i)).toBeInTheDocument();
  });

  it('renders results when the ML API returns a valid payload', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        risk_level: 'Medium risk',
        advice: 'Consult a doctor.',
        probability: 0.4,
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<HeartRisk />, { authContext: createAuthenticatedContext() });

    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: /Complete Assessment/i }));

    expect(await screen.findByText('Medium risk')).toBeInTheDocument();
    expect(screen.getByText('Consult a doctor.')).toBeInTheDocument();
  });
});
