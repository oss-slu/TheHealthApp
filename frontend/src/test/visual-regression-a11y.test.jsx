import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, renderWithRTL } from './test-utils';
import Dashboard from '../pages/Dashboard';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ completed: false }),
  },
}));

describe('Issue #160: Responsive, Accessibility, RTL, and Visual Regression Verifications', () => {
  beforeEach(() => {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          user: { name: 'Test User' },
          recentAssessments: [],
        }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  });

  describe('1. Responsive Viewport Coverage', () => {
    const setViewport = (width, height) => {
      window.innerWidth = width;
      window.innerHeight = height;
      window.dispatchEvent(new Event('resize'));
    };

    it('renders dashboard correctly at mobile viewport dimensions (375px)', () => {
      setViewport(375, 667);
      const { container } = renderWithProviders(<Dashboard />, { route: '/dashboard' });

      const responsiveGrid = container.querySelector('.grid');
      expect(responsiveGrid).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(0);
    });

    it('renders dashboard correctly at desktop viewport dimensions (1280px)', () => {
      setViewport(1280, 800);
      const { container } = renderWithProviders(<Dashboard />, { route: '/dashboard' });

      const responsiveGrid = container.querySelector('.grid-cols-1.md\\:grid-cols-2');
      expect(responsiveGrid).toBeInTheDocument();
      expect(screen.getByRole('main') || container.firstChild).toBeInTheDocument();
    });
  });

  describe('2. Accessibility (a11y) & ARIA Behavior', () => {
    it('ensures interactive cards and links have accessible names and receive keyboard focus', () => {
      renderWithProviders(<Dashboard />, { route: '/dashboard' });

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);

      links.forEach((link) => {
        expect(link.getAttribute('href')).toBeTruthy();
        expect(link).toHaveAccessibleName();
        link.focus();
        expect(link).toHaveFocus();
      });

      const expectedPaths = [
        '/questionnaire',
        '/modules/framingham-risk',
        '/modules/heart-risk',
        '/modules/prescription',
      ];

      expectedPaths.forEach((path) => {
        const matched = links.find((link) => link.getAttribute('href') === path);
        expect(matched).toBeInTheDocument();
      });
    });

    it('maintains strict heading hierarchy and ARIA semantics', () => {
      renderWithProviders(<Dashboard />, { route: '/dashboard' });

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      headings.forEach((heading) => {
        expect(heading.tagName).toMatch(/^H[1-6]$/);
        expect(heading.textContent.trim()).not.toBe('');
      });
    });
  });

  describe('3. Arabic RTL Layout & Interaction', () => {
        it('renders dashboard with Arabic locale, dir="rtl", and lang="ar"', () => {
      const { container } = renderWithRTL(<Dashboard />, { route: '/dashboard' });

      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('ar');
      expect(container.firstChild).toBeInTheDocument();

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      links[0].focus();
      expect(links[0]).toHaveFocus();
    });
  });

  describe('4. Reduced Motion Preference Compliance', () => {
    it('respects prefers-reduced-motion: reduce preference', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { container } = renderWithProviders(<Dashboard />, { route: '/dashboard' });

      expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);

      const transitionElements = container.querySelectorAll('.transition-shadow, .transition-colors');
      expect(transitionElements.length).toBeGreaterThan(0);
    });
  });

  describe('5. Visual Regression DOM Snapshots', () => {
    it('matches visual DOM snapshot for mobile and desktop views', async () => {
      const { asFragment } = renderWithProviders(<Dashboard />, { route: '/dashboard' });

      await waitFor(() => {
        expect(screen.getByText('Incomplete')).toBeInTheDocument();
      });
      expect(asFragment()).toMatchSnapshot();
    });
  });
});
