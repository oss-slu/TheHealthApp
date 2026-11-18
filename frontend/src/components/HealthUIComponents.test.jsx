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
      expect(badge.className).toContain('border-health-good');
    });

    it('renders critical status correctly', () => {
      render(<HealthBadge status="critical" label="High Risk" />);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('border-health-critical');
      expect(badge.className).toContain('bg-health-critical/10');
      expect(badge.className).toContain('text-red-950');
  });

    it('handles unknown status with fallback to neutral classes', () => {
      render(<HealthBadge status="unrecognized_status" label="Unknown State" />);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Unknown State');
      expect(badge.className).toContain('border-slate-400');
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
      expect(card).toHaveAccessibleName('Blood Pressure');
      expect(card).toHaveAccessibleDescription('120/80 mmHg Optimal Normal resting rate');
      expect(screen.getByText('120/80')).toBeInTheDocument();
      expect(screen.getByText('mmHg')).toBeInTheDocument();
      expect(screen.getByText('Optimal')).toBeInTheDocument();
      expect(screen.getByText('Normal resting rate')).toBeInTheDocument();
    });

    it('verifies accessible name and description of an interactive card include metric value, unit, status, and description', () => {
      const handleClick = vi.fn();
      render(
        <HealthMetricCard
          title="Blood Pressure"
          value="120/80"
          unit="mmHg"
          status="good"
          statusLabel="Optimal"
          description="Normal resting rate"
          onClick={handleClick}
        />
      );

      const button = screen.getByRole('button', { name: /blood pressure/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAccessibleName('Blood Pressure');
      expect(button).toHaveAccessibleDescription('120/80 mmHg Optimal Normal resting rate');

      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
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

    it('renders a non-clickable card without title using accessible fallback name without empty heading', () => {
      render(
        <HealthMetricCard
          value="120/80"
          unit="mmHg"
          status="good"
          statusLabel="Optimal"
          description="Normal resting rate"
        />
      );

      const card = screen.getByRole('region', { name: '120/80 mmHg Optimal' });
      expect(card).toBeInTheDocument();
      expect(card).toHaveAccessibleName('120/80 mmHg Optimal');
      expect(card).not.toHaveAttribute('aria-labelledby');
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
      expect(card).toHaveAccessibleDescription('120/80 mmHg Optimal Normal resting rate');
    });

    it('renders a clickable card without title with accessible name and keyboard activation', () => {
      const handleClick = vi.fn();
      render(
        <HealthMetricCard
          value="98"
          unit="%"
          status="good"
          statusLabel="Normal"
          onClick={handleClick}
        />
      );

      const button = screen.getByRole('button', { name: '98 % Normal' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAccessibleName('98 % Normal');
      expect(button).not.toHaveAttribute('aria-labelledby');
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();

      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
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

    it('does not produce an unnamed region when loading state has no title', () => {
      render(<HealthStateView type="loading" loadingLabel="Loading content" />);
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
      expect(screen.getByRole('progressbar', { name: 'Loading content' })).toBeInTheDocument();
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

    it('does not produce an unnamed region for untitled empty and error states', () => {
      const { rerender } = render(
        <HealthStateView type="empty" message="No records found" />
      );
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
      expect(screen.getByText('No records found')).toBeInTheDocument();

      rerender(
        <HealthStateView type="error" message="Unable to load content" />
      );
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
      expect(screen.getByText('Unable to load content')).toBeInTheDocument();
    });
  });
});