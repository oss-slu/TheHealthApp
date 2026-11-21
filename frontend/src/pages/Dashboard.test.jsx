import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderWithProviders,
  renderWithRTL,
  screen,
  fireEvent,
  createAuthenticatedContext,
} from '../test/test-utils';
import Dashboard from './Dashboard';
import apiClient from '../api/client';
import { healthTimelineService } from '../services/healthTimelineService';
import { integrationService } from '../services/integrationService';
import { prescriptionService } from '../services/prescriptionService';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../services/healthTimelineService', () => ({
  healthTimelineService: {
    getTimeline: vi.fn(),
  },
}));

vi.mock('../services/integrationService', () => ({
  integrationService: {
    listMeasurements: vi.fn(),
  },
}));

vi.mock('../services/prescriptionService', () => ({
  prescriptionService: {
    getAll: vi.fn(),
  },
}));

describe('Dashboard', () => {
  beforeEach(() => {
  apiClient.get.mockResolvedValue({ completed: false });
    apiClient.post.mockResolvedValue({
    id: 'check-in-1',
    check_in_date: '2026-11-20',
    feeling: 'good',
  });

  healthTimelineService.getTimeline.mockResolvedValue({
    events: [],
    total: 0,
    limit: 5,
    offset: 0,
    has_more: false,
  });

  integrationService.listMeasurements.mockResolvedValue([]);
  prescriptionService.getAll.mockResolvedValue([]);
});

  const renderDashboard = (options = {}) => {
    return renderWithProviders(<Dashboard />, {
      authContext: createAuthenticatedContext(),
      ...options,
    });
  };

  describe('Daily Check-In', () => {
    it('renders the daily check-in question and feeling options', async () => {
      renderDashboard();

      expect(
        await screen.findByText('How are you feeling today?')
      ).toBeInTheDocument();

      expect(screen.getByRole('radio', { name: 'Good' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Okay' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Not well' })).toBeInTheDocument();

      expect(
        screen.getByRole('button', { name: 'Save check-in' })
      ).toBeDisabled();
    });

    it('submits the selected feeling and shows the completed state', async () => {
      renderDashboard();

      const goodOption = await screen.findByRole('radio', { name: 'Good' });
      fireEvent.click(goodOption);

      fireEvent.click(
        screen.getByRole('button', { name: 'Save check-in' })
      );

      expect(await screen.findByText(/thanks for checking in today/i))
        .toBeInTheDocument();

      expect(apiClient.post).toHaveBeenCalledWith(
        '/users/me/daily-check-in',
        { feeling: 'good' },
        { params: { timezone: expect.any(String) } }
      );
    });

        it('shows an error state when the daily check-in cannot be loaded', async () => {
          apiClient.get.mockImplementation((url) => {
            if (url === '/users/me/daily-check-in') {
            return Promise.reject(new Error('Network error'));
          }

          return Promise.resolve({ completed: false });
        });
      renderDashboard();

      expect(
        await screen.findByText(/your daily check-in couldn't be loaded or saved/i)
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', { name: 'Try again' })
      ).toBeInTheDocument();
    });

    it("shows the completed state when today's check-in already exists", async () => {
      apiClient.get.mockImplementation((url) => {
  if (url === '/users/me/daily-check-in') {
    return Promise.resolve({
      completed: true,
      check_in: {
        id: 'check-in-1',
        check_in_date: '2026-11-20',
        feeling: 'okay',
      },
    });
  }

  return Promise.resolve({ completed: false });
});

      renderDashboard();

      expect(
        await screen.findByText(/thanks for checking in today/i)
      ).toBeInTheDocument();

      expect(screen.getByText('Okay')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Save check-in' })
      ).not.toBeInTheDocument();
    });
  });

    describe('Next Action', () => {
    it('displays the next action returned by the API', async () => {
      apiClient.get.mockImplementation((url) => {
        if (url === '/users/me/next-action') {
          return Promise.resolve({
            action: {
              key: 'complete_questionnaire',
              href: '/questionnaire',
            },
          });
        }

        return Promise.resolve({ completed: false });
      });

      renderDashboard();

      expect(
        await screen.findByTestId('next-action')
      ).toBeInTheDocument();

      expect(
        screen.getByRole('heading', {
          name: 'Complete your health questionnaire',
        })
      ).toBeInTheDocument();

      expect(
        screen.getByRole('link', { name: /complete questionnaire/i })
      ).toHaveAttribute('href', '/questionnaire');
    });

    it('does not display the card when there is no next action', async () => {
      apiClient.get.mockImplementation((url) => {
        if (url === '/users/me/next-action') {
          return Promise.resolve({ action: null });
        }

        return Promise.resolve({ completed: false });
      });

      renderDashboard();

      expect(
        await screen.findByText('How are you feeling today?')
      ).toBeInTheDocument();

      expect(screen.queryByTestId('next-action')).not.toBeInTheDocument();
    });

    it('dismisses the next action', async () => {
      apiClient.get.mockImplementation((url) => {
        if (url === '/users/me/next-action') {
          return Promise.resolve({
            action: {
              key: 'complete_questionnaire',
              href: '/questionnaire',
            },
          });
        }

        return Promise.resolve({ completed: false });
      });

      renderDashboard();

      const dismissButton = await screen.findByRole('button', {
        name: 'Dismiss',
      });

      fireEvent.click(dismissButton);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/users/me/next-action/dismiss',
        { action_key: 'complete_questionnaire' }
      );

      expect(
        await screen.findByText('How are you feeling today?')
      ).toBeInTheDocument();

      expect(screen.queryByTestId('next-action')).not.toBeInTheDocument();
    });

    it('shows an error when the next action cannot be loaded', async () => {
      apiClient.get.mockImplementation((url) => {
        if (url === '/users/me/next-action') {
          return Promise.reject(new Error('Network error'));
        }

        return Promise.resolve({ completed: false });
      });

      renderDashboard();

      expect(
        await screen.findByText(
          "Your next step couldn't be loaded. Please try again."
        )
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', { name: 'Try again' })
      ).toBeInTheDocument();
    });
  });

  describe('Hierarchy', () => {
    it('renders dashboard title as page heading', () => {
      renderDashboard();
      expect(screen.getByRole('heading', { level: 1, name: /dashboard/i })).toBeInTheDocument();
    });

    it('renders a clear primary action', () => {
      renderDashboard();
      const primary = screen.getByTestId('dashboard-primary');
      expect(primary).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /health questionnaire/i })).toHaveAttribute(
        'href',
        '/questionnaire'
      );
      expect(screen.getByText(/start here/i)).toBeInTheDocument();
    });

    it('does not render placeholder-only reminder cards', () => {
      renderDashboard();
      expect(screen.queryByText(/^Reminders$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/no reminders/i)).not.toBeInTheDocument();
    });

    it('renders interactive health tools', () => {
      renderDashboard();
      expect(screen.getByText('Health tools')).toBeInTheDocument();
      expect(screen.getByText('Heart Risk Assessment')).toBeInTheDocument();
      expect(screen.getByText('Prescription Manager')).toBeInTheDocument();
      expect(screen.getAllByText(/health support/i).length).toBeGreaterThan(0);
      expect(screen.getByText('Framingham Risk Assessment')).toBeInTheDocument();
    });

    it('uses EmptyState for activity instead of empty decorative cards', async () => {
      renderDashboard();

      const activitySection = screen.getByRole('region', {
      name: /recent activity/i,
    });

      expect(
      await screen.findByText(/no recent activity yet/i)
    ).toBeInTheDocument();

      expect(activitySection.querySelector('[data-testid="empty-state"]'))
      .toBeInTheDocument();
    });

        it('renders real health measurements returned by the service', async () => {
      integrationService.listMeasurements.mockResolvedValueOnce([
        {
          id: 'measurement-1',
          measurement_type: 'body_weight',
          value: 72,
          unit: 'kg',
          recorded_at: '2026-11-18T10:30:00Z',
        },
      ]);

      renderDashboard();

      expect(await screen.findByText('72 kg')).toBeInTheDocument();
    });

        it('provides an action when no measurements are available', async () => {
      integrationService.listMeasurements.mockResolvedValueOnce([]);

      renderDashboard();

      expect(
        await screen.findByText(/no measurements yet/i)
      ).toBeInTheDocument();

      expect(
        screen.getByRole('link', { name: /add a measurement/i })
      ).toHaveAttribute('href', '/health-summary');
    });

        it('renders active medications returned by the service', async () => {
      prescriptionService.getAll.mockResolvedValueOnce([
        {
          id: 'prescription-1',
          medication_name: 'Metformin',
          dosage: '500 mg',
          frequency: 'Twice daily',
          next_dose: '2026-11-20T08:00:00Z',
        },
      ]);

      renderDashboard();

      expect(await screen.findByText('Metformin')).toBeInTheDocument();
      expect(screen.getByText(/500 mg · Twice daily/)).toBeInTheDocument();
    });

        it('renders recent health activity returned by the timeline service', async () => {
      healthTimelineService.getTimeline.mockResolvedValueOnce({
        events: [
          {
            id: 'activity-1',
            category: 'assessment',
            source: 'health_risk_assessment',
            occurred_at: '2026-11-18T10:30:00Z',
            created_at: '2026-11-18T10:30:00Z',
          },
        ],
        total: 1,
        limit: 5,
        offset: 0,
        has_more: false,
      });

      renderDashboard();

      expect(await screen.findByText(/health risk assessment/i)).toBeInTheDocument();
    });

    it('shows an error state when recent activity fails to load', async () => {
      healthTimelineService.getTimeline.mockRejectedValueOnce(
        new Error('Network error')
      );

      renderDashboard();

      expect(
        await screen.findByText(/recent activity could not be loaded/i)
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', { name: /try again/i })
      ).toBeInTheDocument();
    });

        it('retries loading measurements successfully', async () => {
      integrationService.listMeasurements
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([
          {
            id: 'measurement-retry-1',
            measurement_type: 'body_weight',
            value: 70,
            unit: 'kg',
            recorded_at: '2026-11-19T10:30:00Z',
          },
        ]);

      renderDashboard();

      fireEvent.click(
        await screen.findAllByRole('button', { name: /try again/i }).then(
          (buttons) => buttons.find((button) =>
            button.closest('section')?.getAttribute('aria-labelledby') ===
            'dashboard-measurements-heading'
          )
        )
      );

      expect(await screen.findByText('70 kg')).toBeInTheDocument();
      expect(integrationService.listMeasurements).toHaveBeenCalledTimes(2);
    });

        it('retries loading recent activity successfully', async () => {
      healthTimelineService.getTimeline
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          events: [
            {
              id: 'activity-retry-1',
              category: 'assessment',
              source: 'health_risk_assessment',
              occurred_at: '2026-11-18T10:30:00Z',
              created_at: '2026-11-18T10:30:00Z',
            },
          ],
          total: 1,
          limit: 5,
          offset: 0,
          has_more: false,
        });

      renderDashboard();

      fireEvent.click(
        await screen.findByRole('button', { name: /try again/i })
      );

      expect(
        await screen.findByText(/health risk assessment/i)
      ).toBeInTheDocument();

      expect(healthTimelineService.getTimeline).toHaveBeenCalledTimes(2);
    });

    it('renders status metrics with token-driven status', () => {
      renderDashboard();
      const metrics = screen.getAllByTestId('metric');
      expect(metrics.length).toBeGreaterThanOrEqual(2);
      expect(metrics[0]).toHaveAttribute('data-status');
    });
  });
    it('shows an error state when measurements fail to load', async () => {
      integrationService.listMeasurements.mockRejectedValueOnce(
        new Error('Network error')
      );

      renderDashboard();

      expect(
        await screen.findByText(/measurements could not be loaded/i)
      ).toBeInTheDocument();
    });

    it('retries loading measurements successfully', async () => {
      integrationService.listMeasurements
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([
          {
            id: 'measurement-retry-1',
            measurement_type: 'body_weight',
            value: 70,
            unit: 'kg',
            recorded_at: '2026-11-19T10:30:00Z',
          },
        ]);

      renderDashboard();

      const retryButtons = await screen.findAllByRole('button', {
        name: /try again/i,
      });
      const measurementsRetryButton = retryButtons.find(
        (button) =>
          button.closest('section')?.getAttribute('aria-labelledby') ===
          'dashboard-measurements-heading'
      );

      fireEvent.click(measurementsRetryButton);

      expect(await screen.findByText('70 kg')).toBeInTheDocument();
      expect(integrationService.listMeasurements).toHaveBeenCalledTimes(2);
    });

    it('shows an error state when medications fail to load', async () => {
      prescriptionService.getAll.mockRejectedValueOnce(
        new Error('Network error')
      );

      renderDashboard();

      expect(
        await screen.findByText(/medications could not be loaded/i)
      ).toBeInTheDocument();
    });

    it('retries loading medications successfully', async () => {
      prescriptionService.getAll
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([
          {
            id: 'prescription-retry-1',
            medication_name: 'Lisinopril',
            dosage: '10 mg',
            frequency: 'Once daily',
            next_dose: '2026-11-20T08:00:00Z',
          },
        ]);

      renderDashboard();

      const retryButtons = await screen.findAllByRole('button', {
        name: /try again/i,
      });
      const medicationsRetryButton = retryButtons.find(
        (button) =>
          button.closest('section')?.getAttribute('aria-labelledby') ===
          'dashboard-medications-heading'
      );

      fireEvent.click(medicationsRetryButton);

      expect(await screen.findByText('Lisinopril')).toBeInTheDocument();
      expect(prescriptionService.getAll).toHaveBeenCalledTimes(2);
    });


  describe('Module Navigation', () => {
    it('framingham link points to correct path', () => {
      renderDashboard();
      const framinghamLink = screen.getByRole('link', { name: /framingham/i });
      expect(framinghamLink).toHaveAttribute('href', '/modules/framingham-risk');
    });

    it('heart risk link points to correct path', () => {
      renderDashboard();
      const heartRiskLink = screen.getByRole('link', { name: /heart risk/i });
      expect(heartRiskLink).toHaveAttribute('href', '/modules/heart-risk');
    });

    it('prescription link points to correct path', () => {
      renderDashboard();
      const prescriptionLink = screen.getByRole('link', { name: /prescription/i });
      expect(prescriptionLink).toHaveAttribute('href', '/modules/prescription');
    });

    it('health support link points to correct path', () => {
      renderDashboard();
      const tbaLink = screen.getByRole('link', { name: /health support.*view details/i });
      expect(tbaLink).toHaveAttribute('href', '/modules/tba');
    });
  });

  describe('Completed questionnaire primary action', () => {
    it('promotes Framingham when questionnaire is complete', async () => {
      apiClient.get.mockResolvedValue({ completed: true });
      renderDashboard();

      expect(
        await screen.findByRole('link', { name: /continue your heart health journey/i })
      ).toHaveAttribute('href', '/modules/framingham-risk');
    });
  });

  describe('RTL Layout', () => {
    it('renders correctly in RTL mode', () => {
      renderWithRTL(<Dashboard />, {
        authContext: createAuthenticatedContext(),
      });
      expect(screen.getByRole('heading', { name: /لوحة التحكم/i })).toBeInTheDocument();
    });

    it('has RTL direction set on document', () => {
      renderWithRTL(<Dashboard />, {
        authContext: createAuthenticatedContext(),
      });
      expect(document.documentElement.dir).toBe('rtl');
    });
  });

  describe('Responsive Layout', () => {
    it('renders tools in a responsive grid', () => {
      renderDashboard();
      const tools = screen.getByTestId('dashboard-tools');
      expect(tools).toHaveClass('grid');
      expect(tools).toHaveClass('grid-cols-1');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderDashboard();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(0);
    });

    it('module cards are accessible links', () => {
      renderDashboard();
      const moduleLinks = screen.getAllByRole('link');
      expect(moduleLinks.length).toBeGreaterThanOrEqual(5);
    });

    it('primary action is keyboard-focusable link', () => {
      renderDashboard();
      const primaryLink = screen.getByTestId('dashboard-primary').querySelector('a');
      expect(primaryLink).toBeTruthy();
      expect(primaryLink.tabIndex).toBeGreaterThanOrEqual(0);
    });
  });
});
