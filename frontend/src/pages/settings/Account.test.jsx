import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthenticatedContext, render, renderWithProviders, screen, userEvent } from '../../test/test-utils';
import { AuthContext } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import App from '../../App';
import Account from './Account';

vi.mock('../../services/authService', () => ({
  authService: { exportOwnData: vi.fn() },
}));

// App loads translations over HTTP; tests use the inline instance from test-utils instead.
vi.mock('../../i18n', () => ({}));

const CONSENT_GRANTED = 'Health data consent is currently recorded for your account.';
const CONSENT_NOT_GRANTED = 'Health data consent is not currently recorded for your account.';

const staleConsentUser = {
  username: 'testuser',
  name: 'Test User',
  consent_given: true,
  data_usage: true,
  consent_version: 'v0.9',
};

describe('Account consent status', () => {
  it.each([
    ['data usage declined', { consent_given: false, version: 'v1.0' }, { data_usage: false, consent_version: 'v1.0' }],
    ['stale policy version', { consent_given: false, version: 'v0.9' }, { consent_version: 'v0.9' }],
    ['withdrawn', { consent_given: false, version: 'v1.0' }, { consent_given: false, consent_version: 'v1.0' }],
    ['incomplete', { consent_given: false, version: '' }, { data_usage: null, consent_version: null }],
  ])('shows consent as not granted when it is %s', (_label, consentStatus, userOverrides) => {
    const authContext = createAuthenticatedContext({ consentStatus });
    authContext.user = { ...authContext.user, ...userOverrides };
    renderWithProviders(<Account />, { authContext });

    expect(screen.getByText(CONSENT_NOT_GRANTED)).toBeInTheDocument();
    expect(screen.queryByText(CONSENT_GRANTED)).not.toBeInTheDocument();
  });

  it('trusts the backend verdict over the raw consent_given flag', () => {
    renderWithProviders(<Account />, {
      authContext: createAuthenticatedContext({
        user: staleConsentUser,
        consentStatus: { consent_given: false, version: 'v0.9' },
      }),
    });

    expect(screen.getByText(CONSENT_NOT_GRANTED)).toBeInTheDocument();
  });

  it('applies the shared validity rule before consent status has loaded', () => {
    renderWithProviders(<Account />, {
      authContext: createAuthenticatedContext({ user: staleConsentUser, consentStatus: null }),
    });

    expect(screen.getByText(CONSENT_NOT_GRANTED)).toBeInTheDocument();
  });

  it('shows consent as granted when the backend reports valid consent', () => {
    renderWithProviders(<Account />, { authContext: createAuthenticatedContext() });

    expect(screen.getByText(CONSENT_GRANTED)).toBeInTheDocument();
  });
});

describe('Account Settings route', () => {
  const withoutConsent = () =>
    createAuthenticatedContext({ user: staleConsentUser, consentStatus: { consent_given: false, version: 'v0.9' } });

  const renderAppAt = (path, authContext) => {
    window.history.pushState({}, '', path);
    return render(
      <AuthContext.Provider value={authContext}>
        <App />
      </AuthContext.Provider>,
    );
  };

  afterEach(() => window.history.pushState({}, '', '/'));

  it('stays accessible to signed-in users without health consent', () => {
    renderAppAt('/settings/account', withoutConsent());

    expect(window.location.pathname).toBe('/settings/account');
    expect(screen.getByRole('heading', { name: 'Privacy and your data' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download my data' })).toBeEnabled();
    expect(screen.getByText(CONSENT_NOT_GRANTED)).toBeInTheDocument();
  });

  it('still sends health routes to the consent page for the same user', () => {
    renderAppAt('/dashboard', withoutConsent());

    expect(window.location.pathname).toBe('/consent');
  });
});

describe('Account privacy controls', () => {
  // jsdom has no object URL support, so vi.spyOn cannot wrap these; save and restore them by hand.
  const originalObjectUrlFns = {
    createObjectURL: Object.getOwnPropertyDescriptor(URL, 'createObjectURL'),
    revokeObjectURL: Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL'),
  };

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

  afterEach(() => {
    vi.restoreAllMocks();
    for (const [name, descriptor] of Object.entries(originalObjectUrlFns)) {
      if (descriptor) Object.defineProperty(URL, name, descriptor);
      else delete URL[name];
    }
  });

  it('downloads the signed-in user export and reports success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Account />, { authContext: createAuthenticatedContext() });

    await user.click(screen.getByRole('button', { name: 'Download my data' }));

    expect(authService.exportOwnData).toHaveBeenCalledOnce();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    expect(await screen.findByRole('status')).toHaveTextContent('Your data export was downloaded.');
  });

  it('explains when there are no saved health records', async () => {
    authService.exportOwnData.mockResolvedValue({ questionnaires: [], risk_assessments: [] });
    const user = userEvent.setup();
    renderWithProviders(<Account />, { authContext: createAuthenticatedContext() });

    await user.click(screen.getByRole('button', { name: 'Download my data' }));

    expect(await screen.findByRole('status')).toHaveTextContent('You have no saved questionnaire or risk assessment records yet.');
  });

  it('announces export failures accessibly', async () => {
    authService.exportOwnData.mockRejectedValue(new Error('Network failure'));
    const user = userEvent.setup();
    renderWithProviders(<Account />, { authContext: createAuthenticatedContext() });

    await user.click(screen.getByRole('button', { name: 'Download my data' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not export your data.');
  });
});
// Runs after the privacy controls suite, so a leaked stub would be visible here.
describe('Account test cleanup', () => {
  it('leaves URL object helpers as jsdom provides them', () => {
    expect(vi.isMockFunction(URL.createObjectURL)).toBe(false);
    expect(vi.isMockFunction(URL.revokeObjectURL)).toBe(false);
  });
});
