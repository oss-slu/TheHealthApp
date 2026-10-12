import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthenticatedContext, renderWithProviders, screen, userEvent } from '../test/test-utils';
import { healthSummaryService } from '../services/healthSummaryService';
import HealthSummary from './HealthSummary';

vi.mock('../services/healthSummaryService', () => ({
  healthSummaryService: { getSummary: vi.fn() },
}));

const summaryResponse = {
  generated_at: '2026-10-11T12:00:00Z',
  period: { start_date: '2025-10-11', end_date: '2026-10-11' },
  profile: { name: 'Demo User', date_of_birth: '1990-01-02', gender: 'female' },
  questionnaires: [{
    submitted_at: '2026-10-10T12:00:00Z',
    existing_conditions: ['asthma'],
    allergies: 'None',
    current_medications: 'None',
    family_history: 'No known history',
    exercise_frequency: 'Weekly',
    diet_type: 'Mixed',
    smoking_status: 'Never',
    alcohol_consumption: 'None',
    sleep_hours: '8',
    stress_level: 'Low',
  }],
  risk_assessments: [{
    assessed_at: '2026-10-11T11:00:00Z',
    risk_score: 4.2,
    risk_category: 'low',
    risk_category_description: 'Low estimated risk',
    recommendations: ['Discuss results with a healthcare professional'],
  }],
};

describe('HealthSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    healthSummaryService.getSummary.mockResolvedValue(summaryResponse);
  });

  it('shows questionnaire details and the Framingham result in one preview', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HealthSummary />, { authContext: createAuthenticatedContext() });

    await user.click(screen.getByRole('button', { name: /preview summary/i }));

    expect(await screen.findByText('asthma')).toBeInTheDocument();
    expect(screen.getByText('Low estimated risk')).toBeInTheDocument();
    expect(screen.getByText('4.2%')).toBeInTheDocument();
    expect(screen.getByText(/not a diagnosis/i)).toBeInTheDocument();
    expect(healthSummaryService.getSummary).toHaveBeenCalledWith(expect.any(String), expect.any(String));
  });

  it('does not request a preview when the date range is invalid', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HealthSummary />, { authContext: createAuthenticatedContext() });

    await user.clear(screen.getByLabelText('From'));
    await user.type(screen.getByLabelText('From'), '2026-12-31');
    await user.clear(screen.getByLabelText('Through'));
    await user.type(screen.getByLabelText('Through'), '2026-01-01');
    await user.click(screen.getByRole('button', { name: /preview summary/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/start date must be on or before/i);
    expect(healthSummaryService.getSummary).not.toHaveBeenCalled();
  });
});