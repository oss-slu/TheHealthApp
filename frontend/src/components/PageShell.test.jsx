import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PageShell from './PageShell';
import * as authHook from '../hooks/useAuth';

describe('PageShell Navigation & Accessibility (Issue #157)', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderShell = ({ isAuthenticated = false, initialPath = '/dashboard' } = {}) => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      isAuthenticated,
      logout: mockLogout,
    });

    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="*"
            element={
              <PageShell title="Test Title">
                <div>Content</div>
              </PageShell>
            }
          />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Signed-out Navigation', () => {
    it('renders login and signup links when user is not authenticated', () => {
      renderShell({ isAuthenticated: false });

      expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/auth/login');
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/auth/signup');
      expect(screen.queryByRole('link', { name: /health summary/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
    });
  });

  describe('Signed-in Navigation', () => {
    it('renders dashboard, health summary, and risk assessment links pointing to /modules/framingham-risk', () => {
      renderShell({ isAuthenticated: true });

      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByRole('link', { name: /health summary/i })).toHaveAttribute('href', '/health-summary');

      const riskLink = screen.getByRole('link', { name: /risk assessment/i });
      expect(riskLink).toHaveAttribute('href', '/modules/framingham-risk');
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('highlights active navigation item', () => {
      renderShell({ isAuthenticated: true, initialPath: '/modules/framingham-risk' });

      const riskLink = screen.getByRole('link', { name: /risk assessment/i });
      expect(riskLink.className).toContain('bg-teal-100');
    });

    it('calls logout on logout button click', () => {
      renderShell({ isAuthenticated: true });

      const logoutBtn = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutBtn);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mobile Navigation & Accessibility', () => {
    it('toggles mobile menu with aria-expanded and aria-controls attributes', () => {
      renderShell({ isAuthenticated: true });

      const toggleBtn = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
      expect(toggleBtn).toHaveAttribute('aria-controls', 'mobile-navigation-drawer');

      fireEvent.click(toggleBtn);
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
      const drawer = document.getElementById('mobile-navigation-drawer');
      expect(drawer).toBeInTheDocument();

      fireEvent.click(toggleBtn);
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
      expect(document.getElementById('mobile-navigation-drawer')).not.toBeInTheDocument();
    });
  });
});