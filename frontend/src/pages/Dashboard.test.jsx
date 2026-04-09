import { describe, it, expect } from 'vitest';
import {
  renderWithProviders,
  renderWithRTL,
  screen,
  createAuthenticatedContext,
} from '../test/test-utils';
import Dashboard from './Dashboard';

describe('Dashboard', () => {
  const renderDashboard = (options = {}) => {
    return renderWithProviders(<Dashboard />, {
      authContext: createAuthenticatedContext(),
      ...options,
    });
  };

  describe('Rendering', () => {
    it('renders dashboard title', () => {
      renderDashboard();

      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('renders all dashboard cards', () => {
      renderDashboard();

      // Check for dashboard sections - the translations are set up in test-utils
      expect(screen.getByText('Recent Assessments')).toBeInTheDocument();
      expect(screen.getByText('Health Status')).toBeInTheDocument();
      expect(screen.getByText('Reminders')).toBeInTheDocument();
    });

    it('renders module links', () => {
      renderDashboard();

      expect(screen.getByText('Heart Risk Assessment')).toBeInTheDocument();
      expect(screen.getByText('Prescription Manager')).toBeInTheDocument();
      // TBA module is labeled as "Health Support" in modules namespace
      expect(screen.getAllByText(/health support/i).length).toBeGreaterThan(0);
    });

    it('renders view details links for modules', () => {
      renderDashboard();

      const viewDetailsLinks = screen.getAllByText(/view details/i);
      expect(viewDetailsLinks.length).toBeGreaterThanOrEqual(4);
    });

    it('renders Framingham assessment card', () => {
      renderDashboard();

      expect(screen.getByText('Framingham Risk Assessment')).toBeInTheDocument();
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

  describe('Empty States', () => {
    it('shows no recent assessments message', () => {
      renderDashboard();

      expect(screen.getByText(/no recent assessments/i)).toBeInTheDocument();
    });

    it('shows prompt to assess message', () => {
      renderDashboard();

      expect(screen.getByText(/complete an assessment/i)).toBeInTheDocument();
    });

    it('shows no reminders message', () => {
      renderDashboard();

      expect(screen.getByText(/no reminders/i)).toBeInTheDocument();
    });
  });

  describe('RTL Layout', () => {
    it('renders correctly in RTL mode', () => {
      renderWithRTL(<Dashboard />);

      // Check that Arabic translation is being used
      expect(screen.getByRole('heading', { name: /لوحة التحكم/i })).toBeInTheDocument();
    });

    it('has RTL direction set on document', () => {
      renderWithRTL(<Dashboard />);

      expect(document.documentElement.dir).toBe('rtl');
    });
  });

  describe('Responsive Layout', () => {
    it('renders with grid layout classes', () => {
      renderDashboard();

      // Find the grid container
      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid-cols-1');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderDashboard();

      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toBeInTheDocument();

      const sectionHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it('module cards are accessible links', () => {
      renderDashboard();

      const moduleLinks = screen.getAllByRole('link');
      expect(moduleLinks.length).toBeGreaterThanOrEqual(5);
    });
  });
});
