import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, userEvent, renderWithProviders, createAuthenticatedContext } from '../../test/test-utils';
import FraminghamRisk from './FraminghamRisk';
import { healthRiskService } from '../../services/healthRiskService';
import { showErrorToast } from '../../lib/toast';

vi.mock('../../services/healthRiskService', () => ({
  healthRiskService: {
    calculateRisk: vi.fn(),
  },
}));

vi.mock('../../lib/toast', () => ({
  showErrorToast: vi.fn(),
}));

const validApiResponse = {
  risk_score: 8.2,
  risk_category: 'low',
  risk_category_description: 'Low risk',
  factor_breakdown: {
    age_factor: 1,
    cholesterol_factor: 1,
    blood_pressure_factor: 1,
    smoking_factor: 0,
    diabetes_factor: 0,
  },
  recommendations: ['Maintain healthy habits'],
  disclaimer: 'Educational only.',
};

describe('FraminghamRisk', () => {
  beforeEach(() => {
    vi.mocked(healthRiskService.calculateRisk).mockReset();
    vi.mocked(showErrorToast).mockReset();
  });

  const renderPage = () =>
    renderWithProviders(<FraminghamRisk />, {
      authContext: createAuthenticatedContext(),
    });

  const fillValidForm = async (user) => {
    await user.type(screen.getByLabelText(/Age \(years\)/i), '45');
    await user.selectOptions(screen.getByLabelText(/Biological sex/i), 'male');
    await user.type(screen.getByLabelText(/Total cholesterol/i), '200');
    await user.type(screen.getByLabelText(/HDL cholesterol/i), '50');
    await user.type(screen.getByLabelText(/Systolic blood pressure/i), '120');
    document.querySelector('input[name="blood_pressure_treatment"][value="no"]')?.click();
    document.querySelector('input[name="smoking_status"][value="never"]')?.click();
    document.querySelector('input[name="diabetes_status"][value="no"]')?.click();
  };

  it('shows validation message when submitting an empty form', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Calculate risk/i }));

    const messages = screen.getAllByText(/Please check the highlighted fields/i);
    expect(messages.length).toBeGreaterThan(0);
    expect(healthRiskService.calculateRisk).not.toHaveBeenCalled();
  });

  it('displays API risk results when the backend returns a valid payload', async () => {
    vi.mocked(healthRiskService.calculateRisk).mockResolvedValueOnce(validApiResponse);
    const user = userEvent.setup();
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /Calculate risk/i }));

    expect(healthRiskService.calculateRisk).toHaveBeenCalledWith(
      expect.objectContaining({
        age: 45,
        gender: 'male',
        total_cholesterol: 200,
        hdl_cholesterol: 50,
        systolic_blood_pressure: 120,
        blood_pressure_treatment: 'no',
        smoking_status: 'never',
        diabetes_status: 'no',
      }),
    );

    expect(await screen.findByText('8.2%')).toBeInTheDocument();
    expect(screen.getByText('Low risk')).toBeInTheDocument();
  });

  it('shows an error and toast when the API body is not a valid risk result', async () => {
    vi.mocked(healthRiskService.calculateRisk).mockResolvedValueOnce({ incomplete: true });
    const user = userEvent.setup();
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /Calculate risk/i }));

    expect(await screen.findByText(/incomplete risk result/i)).toBeInTheDocument();
    expect(showErrorToast).toHaveBeenCalled();
    expect(screen.queryByText('8.2%')).not.toBeInTheDocument();
  });

  it('shows mapped error when the API request fails', async () => {
    vi.mocked(healthRiskService.calculateRisk).mockRejectedValueOnce({
      messageKey: 'errors.validation',
      message: 'Invalid input',
      status: 422,
    });
    const user = userEvent.setup();
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /Calculate risk/i }));

    expect(await screen.findByText(/Invalid input/i)).toBeInTheDocument();
    expect(showErrorToast).not.toHaveBeenCalled();
  });
});
