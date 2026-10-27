import React, { useState, startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n.js';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PageShell = ({ children, title, showNav = true, variant = 'default' }) => {
  const { t } = useTranslation(['common', 'auth', 'dashboard', 'modules']);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout: authLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authLogout();
    navigate('/auth/login', { replace: true });
  };

  const changeLanguage = (code) => {
    startTransition(() => {
      i18n.changeLanguage(code);
      localStorage.setItem('app.lang', code);
      document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
      setLangOpen(false);
    });
  };

  const navigation = [
    ...(isAuthenticated
      ? [
          { path: '/dashboard', label: t('dashboard:menuLabel', 'Dashboard') },
          { path: '/modules/framingham', label: t('dashboard:framingham', 'Risk Assessment') },
          { path: '/settings/account', label: t('common:accountSettings', 'Settings') },
        ]
      : [
          { path: '/auth/login', label: t('auth:login', 'Login') },
          { path: '/auth/signup', label: t('auth:signup', 'Sign Up') },
        ]),
  ];

  const isLanding = variant === 'landing';

  return (
    <div className="health-app-shell min-h-screen flex flex-col bg-slate-50/50">
      {/* Header */}
      <header className="health-header sticky top-0 z-30 border-b border-teal-100/60 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg p-1">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25"
                aria-hidden="true"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-800 to-emerald-800 bg-clip-text text-transparent">
                {t('common:appName', 'The Health App')}
              </h1>
            </Link>

            {/* Right Controls: Desktop Nav + Single Language Picker + Mobile Toggle */}
            <div className="flex items-center space-x-3 sm:space-x-6">
              
              {/* Desktop Nav Items */}
              <div className="hidden md:flex items-center space-x-6">
                {showNav &&
                  navigation.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          isActive
                            ? 'bg-teal-100 text-teal-900 shadow-sm font-semibold'
                            : 'text-gray-600 hover:text-teal-800 hover:bg-teal-50/80'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}

                {isAuthenticated && showNav && (
                  <button
                    type="button"
                    className="text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
                    onClick={handleLogout}
                  >
                    {t('common:logout', 'Logout')}
                  </button>
                )}
              </div>

              {/* Single Global Language Picker (RTL aware & Accessible) */}
              <div className="relative">
                <button
                  type="button"
                  className="border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center text-sm hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
                  aria-label={t('common:language', 'Select Language')}
                  onClick={() => setLangOpen((prev) => !prev)}
                >
                  🌐
                </button>
                {langOpen && (
                  <div className="absolute ltr:right-0 rtl:left-0 mt-2 bg-white border border-gray-100 rounded-md shadow-lg z-50 min-w-28 py-1">
                    {['en', 'hi', 'es', 'ar', 'zh'].map((code) => (
                      <button
                        key={code}
                        type="button"
                        className="px-3 py-2 text-left rtl:text-right hover:bg-teal-50 text-xs w-full transition-colors block text-gray-700 font-medium"
                        onClick={() => changeLanguage(code)}
                      >
                        {code.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Toggle */}
              {showNav && (
                <button
                  type="button"
                  className="md:hidden p-2 rounded-md text-gray-600 hover:text-teal-800 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  aria-label="Toggle navigation menu"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              )}

            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {showNav && mobileMenuOpen && (
          <div className="md:hidden border-t border-teal-100 bg-white/95 backdrop-blur-md px-4 pt-2 pb-4 space-y-1 shadow-inner">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-100 text-teal-900 font-semibold'
                      : 'text-gray-600 hover:bg-teal-50 hover:text-teal-800'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {isAuthenticated && (
              <button
                type="button"
                className="w-full text-left rtl:text-right px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                {t('common:logout', 'Logout')}
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main
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
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {typeof title === 'string' ? t(title) : title}
              </h2>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="health-footer mt-auto border-t border-teal-100/80 bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-teal-800/70">
            © {new Date().getFullYear()} {t('common:appName', 'TheHealthApp')}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PageShell;