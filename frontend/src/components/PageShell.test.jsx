import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderWithProviders,
  renderWithRTL,
  screen,
  createAuthenticatedContext,
  userEvent,
} from '../test/test-utils';
import PageShell from './PageShell';

describe('PageShell navigation and accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders signed-out navigation', () => {
    renderWithProviders(
      <PageShell title="Test Title">
        <div>Content</div>
      </PageShell>
    );

    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/auth/login');
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/auth/signup');
    expect(screen.queryByRole('link', { name: /health summary/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });

  it('renders authenticated navigation, including the risk assessment', () => {
    renderWithProviders(
      <PageShell title="Test Title">
        <div>Content</div>
      </PageShell>,
      { authContext: createAuthenticatedContext() }
    );

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /health summary/i })).toHaveAttribute('href', '/health-summary');
    expect(screen.getByRole('link', { name: /risk assessment/i })).toHaveAttribute(
      'href',
      '/modules/framingham-risk'
    );
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('highlights the active navigation item and calls logout', async () => {
    const logout = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <PageShell title="Test Title">
        <div>Content</div>
      </PageShell>,
      {
        route: '/modules/framingham-risk',
        authContext: createAuthenticatedContext({ logout }),
      }
    );

    expect(screen.getByRole('link', { name: /risk assessment/i })).toHaveClass(
      'bg-[var(--color-brand-100)]'
    );
    await user.click(screen.getByRole('button', { name: /logout/i }));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('renders the skip link and main landmark', () => {
    renderWithProviders(
      <PageShell title="dashboard:title">
        <p>Body</p>
      </PageShell>,
      { authContext: createAuthenticatedContext() }
    );

    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute(
      'href',
      '#main-content'
    );
    expect(screen.getAllByText('Health Support').length).toBeGreaterThan(0);
    expect(document.getElementById('main-content')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('toggles the mobile navigation with accessible controls', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PageShell showNav>
        <p>Body</p>
      </PageShell>,
      { authContext: createAuthenticatedContext() }
    );

    const menuButton = screen.getByRole('button', { name: /open menu/i });
    const menuId = menuButton.getAttribute('aria-controls');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuId).toBeTruthy();

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(menuId)).toBeInTheDocument();

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('allows switching the background theme', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PageShell>
        <p>Body</p>
      </PageShell>,
      { authContext: createAuthenticatedContext() }
    );

    await user.click(screen.getByRole('button', { name: /background theme/i }));
    await user.click(screen.getByRole('option', { name: /clinical/i }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('clinical');
  });

  it('supports RTL language chrome', () => {
    renderWithRTL(
      <PageShell title="dashboard:title">
        <p>محتوى</p>
      </PageShell>,
      { authContext: createAuthenticatedContext() }
    );

    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByText('دعم الصحة')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /تخطي إلى المحتوى/i })).toBeInTheDocument();
  });
});
