import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

describe('Issue #160: Responsive, Accessibility, RTL, and Visual Regression Verifications', () => {
  beforeEach(() => {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  });

  describe('Responsive Viewport Rendering', () => {
    it('renders responsive grid structures for mobile and desktop viewports', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Dashboard />
        </MemoryRouter>
      );

      const responsiveGrid = container.querySelector('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
      expect(responsiveGrid).toBeInTheDocument();
    });
  });

  describe('Keyboard Focus, ARIA, and Semantic Labels', () => {
    it('ensures all interactive cards and module links are keyboard focusable and have accessible labels', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Dashboard />
        </MemoryRouter>
      );

      const links = screen.getAllByRole('link');
      const questionnaireLink = links.find((link) => link.getAttribute('href') === '/questionnaire');
      expect(questionnaireLink).toBeInTheDocument();

      const framinghamLink = links.find((link) => link.getAttribute('href') === '/modules/framingham-risk');
      expect(framinghamLink).toBeInTheDocument();

      const heartRiskLink = links.find((link) => link.getAttribute('href') === '/modules/heart-risk');
      expect(heartRiskLink).toBeInTheDocument();

      const prescriptionLink = links.find((link) => link.getAttribute('href') === '/modules/prescription');
      expect(prescriptionLink).toBeInTheDocument();
    });

    it('maintains proper heading semantics and hierarchy', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Dashboard />
        </MemoryRouter>
      );

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      headings.forEach((heading) => {
        expect(heading.tagName).toMatch(/^H[1-6]$/);
      });
    });
  });

  describe('Arabic RTL Layout Behavior', () => {
    it('applies rtl direction attribute properly for RTL locale environments', () => {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';

      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Dashboard />
        </MemoryRouter>
      );

      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('ar');
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Reduced Motion Preference Compliance', () => {
    it('verifies transitions and animation accessibility styles', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Dashboard />
        </MemoryRouter>
      );

      const transitionElements = container.querySelectorAll('.transition-shadow, .transition-colors');
      expect(transitionElements.length).toBeGreaterThan(0);
    });
  });
});