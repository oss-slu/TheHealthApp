import { describe, it, expect } from 'vitest';
import {
  renderWithProviders,
  renderWithRTL,
  screen,
  createAuthenticatedContext,
  userEvent,
} from '../test/test-utils';
import PageShell from './PageShell';

describe('PageShell design system shell', () => {
  it('renders skip link, brand, and main landmark', () => {
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
    expect(screen.getByText('Health Support')).toBeInTheDocument();
    expect(document.getElementById('main-content')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('exposes mobile menu control for responsive navigation', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PageShell showNav>
        <p>Body</p>
      </PageShell>,
      { authContext: createAuthenticatedContext() }
    );

    const menuButton = screen.getByRole('button', { name: /open menu/i });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('link', { name: /dashboard/i }).length).toBeGreaterThan(0);
  });

  it('allows switching background theme via token-driven control', async () => {
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
