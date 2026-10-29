import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderWithProviders,
  renderWithRTL,
  screen,
  createAuthenticatedContext,
} from '../test/test-utils';
import Dashboard from './Dashboard';
import apiClient from '../api/client';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('Dashboard', () => {
  beforeEach(() => {
    apiClient.get.mockResolvedValue({ completed: false });
  });

  const renderDashboard = (options = {}) => {
    return renderWithProviders(<Dashboard />, {
      authContext: createAuthenticatedContext(),
      ...options,
    });
  };

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

    it('uses EmptyState for activity instead of empty decorative cards', () => {
      renderDashboard();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText(/no recent assessments yet/i)).toBeInTheDocument();
    });

    it('renders status metrics with token-driven status', () => {
      renderDashboard();
      const metrics = screen.getAllByTestId('metric');
      expect(metrics.length).toBeGreaterThanOrEqual(2);
      expect(metrics[0]).toHaveAttribute('data-status');
    });
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
