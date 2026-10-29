import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthenticatedContext, renderWithProviders, screen, userEvent } from '../../test/test-utils';
import { authService } from '../../services/authService';
import Account from './Account';

vi.mock('../../services/authService', () => ({
  authService: { exportOwnData: vi.fn() },
}));

describe('Account privacy controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:health-export');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    authService.exportOwnData.mockResolvedValue({
      profile: { username: 'testuser' },
      consent: { consent_given: true },
      questionnaires: [{ submitted_at: '2026-01-01T00:00:00Z' }],
      risk_assessments: [],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('downloads the signed-in user export and reports success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Account />, { authContext: createAuthenticatedContext() });

    await user.click(screen.getByRole('button', { name: /privacyExportButton/i }));

    expect(authService.exportOwnData).toHaveBeenCalledOnce();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    expect(await screen.findByRole('status')).toHaveTextContent('privacyExportSuccess');
  });

  it('explains when there are no saved health records', async () => {
    authService.exportOwnData.mockResolvedValue({ questionnaires: [], risk_assessments: [] });
    const user = userEvent.setup();
    renderWithProviders(<Account />, { authContext: createAuthenticatedContext() });

    await user.click(screen.getByRole('button', { name: /privacyExportButton/i }));

    expect(await screen.findByRole('status')).toHaveTextContent('privacyExportEmpty');
  });

  it('announces export failures accessibly', async () => {
    authService.exportOwnData.mockRejectedValue(new Error('Network failure'));
    const user = userEvent.setup();
    renderWithProviders(<Account />, { authContext: createAuthenticatedContext() });

    await user.click(screen.getByRole('button', { name: /privacyExportButton/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('privacyExportError');
  });
});