import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import HealthBadge from './HealthBadge';
import HealthMetricCard from './HealthMetricCard';
import HealthStateView from './HealthStateView';

describe('Health UI Components (Issue #158)', () => {
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
  });

  describe('HealthMetricCard', () => {
    it('renders title, value, unit, and handles keyboard interaction', () => {
      const handleClick = vi.fn();
      render(
        <HealthMetricCard
          title="Blood Pressure"
          value="120/80"
          unit="mmHg"
          status="good"
          statusLabel="Normal"
          onClick={handleClick}
        />
      );

      expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
      expect(screen.getByText('120/80')).toBeInTheDocument();
      expect(screen.getByText('mmHg')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();

      const card = screen.getByRole('button', { name: /blood pressure/i });
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('HealthStateView', () => {
    it('renders loading state indicator', () => {
      render(<HealthStateView type="loading" title="Loading records..." />);
      expect(screen.getByRole('progressbar', { name: /loading/i })).toBeInTheDocument();
      expect(screen.getByText('Loading records...')).toBeInTheDocument();
    });

    it('renders error state and handles retry button click', () => {
      const handleRetry = vi.fn();
      render(
        <HealthStateView
          type="error"
          title="Failed to load"
          message="Check your connection"
          actionLabel="Try Again"
          onAction={handleRetry}
        />
      );

      expect(screen.getByText('Failed to load')).toBeInTheDocument();
      expect(screen.getByText('Check your connection')).toBeInTheDocument();
      const retryBtn = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });
});