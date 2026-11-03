import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import HealthBadge from './HealthBadge';
import HealthMetricCard from './HealthMetricCard';
import HealthStateView from './HealthStateView';

describe('Health UI Components (Issue #158 - PR Feedback)', () => {
  describe('HealthBadge', () => {
    it('renders with appropriate status label and role', () => {
      render(<HealthBadge status="good" label="Optimal" />);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Optimal');
      expect(badge.className).toContain('emerald');
    });

    it('renders critical status correctly', () => {
      render(<HealthBadge status="critical" label="High Risk" />);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('rose');
    });

    it('handles unknown status with fallback to neutral classes', () => {
      render(<HealthBadge status="unrecognized_status" label="Unknown State" />);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Unknown State');
      expect(badge.className).toContain('slate');
    });
  });

  describe('HealthMetricCard', () => {
    it('renders title, value, unit, status, and description properly exposed to accessibility tree', () => {
      render(
        <HealthMetricCard
          title="Blood Pressure"
          value="120/80"
          unit="mmHg"
          status="good"
          statusLabel="Optimal"
          description="Normal resting rate"
        />
      );

      const card = screen.getByRole('region', { name: /blood pressure/i });
      expect(card).toBeInTheDocument();
      expect(screen.getByText('120/80')).toBeInTheDocument();
      expect(screen.getByText('mmHg')).toBeInTheDocument();
      expect(screen.getByText('Optimal')).toBeInTheDocument();
      expect(screen.getByText('Normal resting rate')).toBeInTheDocument();
    });

    it('triggers action on Space key activation in addition to Enter', () => {
      const handleClick = vi.fn();
      render(
        <HealthMetricCard
          title="Interactive Metric"
          value="72"
          onClick={handleClick}
        />
      );

      const buttonCard = screen.getByRole('button', { name: /interactive metric/i });

      fireEvent.keyDown(buttonCard, { key: 'Enter', code: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(buttonCard, { key: ' ', code: 'Space' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('HealthStateView', () => {
    it('renders configurable loading indicator label in English and Arabic', () => {
      const { rerender } = render(
        <HealthStateView type="loading" loadingLabel="Loading content" />
      );
      expect(screen.getByRole('progressbar', { name: 'Loading content' })).toBeInTheDocument();

      rerender(<HealthStateView type="loading" loadingLabel="جارٍ تحميل المحتوى" />);
      expect(screen.getByRole('progressbar', { name: 'جارٍ تحميل المحتوى' })).toBeInTheDocument();
    });

    it('renders error state with assertive alert role and handles retry callback', () => {
      const handleRetry = vi.fn();
      render(
        <HealthStateView
          type="error"
          title="Connection Error"
          message="Unable to reach server"
          actionLabel="Retry"
          onAction={handleRetry}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Unable to reach server')).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('renders empty state in a region with polite announcement', () => {
      render(
        <HealthStateView
          type="empty"
          title="No records found"
          message="Start by adding your first reading."
        />
      );

      const region = screen.getByRole('region', { name: /no records found/i });
      expect(region).toHaveAttribute('aria-live', 'polite');
      expect(screen.getByText('Start by adding your first reading.')).toBeInTheDocument();
    });
  });
});