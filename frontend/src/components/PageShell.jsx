import React, { useEffect, useId, useState, startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n.js';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme, THEMES } from '../context/ThemeContext';

const LANG_CODES = ['en', 'hi', 'es', 'ar', 'zh'];

const PageShell = ({ children, title, showNav = true, variant = 'default' }) => {
  const { t } = useTranslation(['common', 'auth', 'dashboard', 'modules','summary']);
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, logout: authLogout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const mobileNavId = useId();

  const handleLogout = async () => {
    await authLogout();
    navigate('/auth/login', { replace: true });
  };

  const navigation = [
    ...(isAuthenticated
      ? [
          { path: '/dashboard', label: t('dashboard:menuLabel') },
          { path: '/health-summary', label: t('summary:navLabel') },
          { path: '/settings/account', label: t('common:accountSettings') },
        ]
      : [
          { path: '/auth/login', label: t('auth:login') },
          { path: '/auth/signup', label: t('auth:signup') },
        ]),
  ];

  const isLanding = variant === 'landing';

  useEffect(() => {
    setMobileOpen(false);
    setLangOpen(false);
    setThemeOpen(false);
  }, [location.pathname]);

  const changeLanguage = (code) => {
    startTransition(() => {
      i18n.changeLanguage(code);
      localStorage.setItem('app.lang', code);
      document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = code;
      setLangOpen(false);
      setMobileOpen(false);
    });
  };

  const navLinkClass = (path) =>
    `rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold transition-colors ${
      location.pathname === path
        ? 'bg-[var(--color-brand-100)] text-[var(--color-brand-800)]'
        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]'
    }`;

  return (
    <div className="health-app-shell min-h-screen flex flex-col" data-testid="app-shell">
      <a
        href="#main-content"
        className="health-skip-link sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-md)] focus:bg-[var(--surface-elevated)] focus:px-4 focus:py-2 focus:shadow-lg"
      >
        {t('common:skipToContent')}
      </a>

      <header className="health-header sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link to="/" className="flex min-w-0 items-center gap-2.5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-600)] text-white"
                aria-hidden
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-[var(--color-brand-800)] sm:text-2xl truncate">
                {t('common:appName')}
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-2" aria-label={t('common:primaryNav')}>
              {showNav &&
                navigation.map((item) => (
                  <Link key={item.path} to={item.path} className={navLinkClass(item.path)}>
                    {item.label}
                  </Link>
                ))}

              {isAuthenticated && showNav && (
                <button
                  type="button"
                  className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                  onClick={handleLogout}
                >
                  {t('common:logout')}
                </button>
              )}

              <div className="relative">
                <button
                  type="button"
                  className="rounded-[var(--radius-md)] border border-[var(--surface-border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                  aria-label={t('common:backgroundTheme')}
                  aria-expanded={themeOpen}
                  onClick={() => {
                    setThemeOpen((o) => !o);
                    setLangOpen(false);
                  }}
                >
                  {t(`common:themes.${theme}`)}
                </button>
                {themeOpen && (
                  <div
                    className="absolute ltr:right-0 rtl:left-0 mt-2 min-w-36 rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-elevated)] py-1 shadow-lg z-20"
                    role="listbox"
                    aria-label={t('common:backgroundTheme')}
                  >
                    {THEMES.map((code) => (
                      <button
                        key={code}
                        type="button"
                        role="option"
                        aria-selected={theme === code}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-muted)] rtl:text-right"
                        onClick={() => {
                          setTheme(code);
                          setThemeOpen(false);
                        }}
                      >
                        {t(`common:themes.${code}`)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  className="rounded-full border border-[var(--surface-border)] w-9 h-9 flex items-center justify-center text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                  aria-label={t('common:language')}
                  aria-expanded={langOpen}
                  onClick={() => {
                    setLangOpen((o) => !o);
                    setThemeOpen(false);
                  }}
                >
                  {i18n.language?.slice(0, 2).toUpperCase() || 'EN'}
                </button>
                {langOpen && (
                  <div className="absolute ltr:right-0 rtl:left-0 mt-2 min-w-28 rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-elevated)] shadow-lg z-20">
                    {LANG_CODES.map((code) => (
                      <button
                        key={code}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-muted)] rtl:text-right"
                        onClick={() => changeLanguage(code)}
                      >
                        {code.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--surface-border)] p-2 text-[var(--text-primary)]"
              aria-label={t('common:openMenu')}
              aria-expanded={mobileOpen}
              aria-controls={mobileNavId}
              onClick={() => setMobileOpen((o) => !o)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {mobileOpen && (
            <nav
              id={mobileNavId}
              className="md:hidden border-t border-[var(--surface-border)] py-3 space-y-1"
              aria-label={t('common:primaryNav')}
            >
              {showNav &&
                navigation.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block ${navLinkClass(item.path)}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              {isAuthenticated && showNav && (
                <button
                  type="button"
                  className="block w-full rounded-[var(--radius-md)] px-3 py-2 text-start text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                  onClick={handleLogout}
                >
                  {t('common:logout')}
                </button>
              )}
              <div className="px-3 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  {t('common:backgroundTheme')}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {THEMES.map((code) => (
                    <button
                      key={code}
                      type="button"
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        theme === code
                          ? 'bg-[var(--color-brand-600)] text-white'
                          : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'
                      }`}
                      onClick={() => setTheme(code)}
                    >
                      {t(`common:themes.${code}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-3 pt-3 pb-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  {t('common:language')}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {LANG_CODES.map((code) => (
                    <button
                      key={code}
                      type="button"
                      className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
                      onClick={() => changeLanguage(code)}
                    >
                      {code.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </nav>
          )}
        </div>
      </header>

      <main
        id="main-content"
        className={
          isLanding
            ? 'flex-1 flex flex-col w-full'
            : 'flex-1 w-full max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'
        }
      >
        <div
          className={
            isLanding
              ? 'flex-1 flex flex-col w-full px-4 sm:px-6 lg:px-8 py-6'
              : 'px-4 py-6 sm:px-0'
          }
        >
          {title && (
            <div className="mb-6">
              <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                {typeof title === 'string' ? t(title) : title}
              </h1>
            </div>
          )}
          {children}
        </div>
      </main>

      <footer className="health-footer mt-auto border-t">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-[var(--text-secondary)]">
            © {new Date().getFullYear()} {t('common:appName')}. {t('common:allRightsReserved')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PageShell;
