import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

describe('Dashboard Page Component (Issue #159 / PR #235)', () => {
  beforeEach(() => {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  });

  const renderDashboard = (initialState = {}) => {
    return render(
      <MemoryRouter initialEntries={[{ pathname: '/dashboard', state: initialState }]}>
        <Dashboard />
      </MemoryRouter>
    );
  };

  it('renders greeting and subtitle in the structured header area', () => {
    renderDashboard();

    const greetingHeading = screen.getByRole('heading', { level: 2, name: /welcome back/i });
    expect(greetingHeading).toBeInTheDocument();
    expect(screen.getByText(/track your health vitals, daily actions/i)).toBeInTheDocument();
  });

  it('renders explicit account status indicator badge', () => {
    renderDashboard();

    const statusBadges = screen.getAllByRole('status');
    const accountBadge = statusBadges.find((badge) => /account: active/i.test(badge.textContent));
    expect(accountBadge).toBeDefined();
    expect(accountBadge).toBeInTheDocument();
  });

  it('renders primary daily health action card with questionnaire and summary links', () => {
    renderDashboard();

    const links = screen.getAllByRole('link');
    const questionnaireLink = links.find((link) => link.getAttribute('href') === '/questionnaire');
    expect(questionnaireLink).toBeDefined();
    expect(questionnaireLink).toBeInTheDocument();

    const summaryLink = links.find((link) => link.getAttribute('href') === '/health-summary');
    expect(summaryLink).toBeDefined();
    expect(summaryLink).toBeInTheDocument();
  });

  it('renders recent assessments empty state with informative next-action link', () => {
    renderDashboard();

    expect(screen.getByText(/no recent health assessments/i)).toBeInTheDocument();
    expect(screen.getByText(/complete a risk evaluation to track your progress/i)).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    const evaluateLink = links.find((link) => link.getAttribute('href') === '/modules/framingham-risk');
    expect(evaluateLink).toBeDefined();
    expect(evaluateLink).toBeInTheDocument();
  });

  it('preserves reachability and accessible routes for all diagnostic modules', () => {
    renderDashboard();

    const links = screen.getAllByRole('link');

    const framinghamLink = links.find((link) => link.getAttribute('href') === '/modules/framingham-risk');
    expect(framinghamLink).toBeDefined();

    const heartRiskLink = links.find((link) => link.getAttribute('href') === '/modules/heart-risk');
    expect(heartRiskLink).toBeDefined();

    const prescriptionLink = links.find((link) => link.getAttribute('href') === '/modules/prescription');
    expect(prescriptionLink).toBeDefined();

    const consultationLink = links.find((link) => link.getAttribute('href') === '/modules/tba');
    expect(consultationLink).toBeDefined();
  });

  it('renders localized dashboard strings in Arabic locale without crashing', () => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';

    const { container } = renderDashboard();

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders completion banner when returning with questionnaireComplete state', () => {
    renderDashboard({ questionnaireComplete: true });

    expect(screen.getByText(/questionnaire completed successfully!/i)).toBeInTheDocument();
  });
});