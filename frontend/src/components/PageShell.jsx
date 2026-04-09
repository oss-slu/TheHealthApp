import React, { useState, useEffect, startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n.js';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const PageShell = ({ children, title, showNav = true, variant = 'default' }) => {
  const { t } = useTranslation(['common','auth','dashboard','modules']);
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('auth.session') === 'true'
  );
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(localStorage.getItem('auth.session') === 'true');
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth.session');
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('auth-change'));
    navigate('/auth/login', { replace: true });
  };
  
  const navigation = [
    ...(isAuthenticated
      ? [
          { path: '/dashboard', label: t('dashboard:menuLabel') },
          { path: '/settings/account', label: t('common:accountSettings') },
        ]
      : [
          { path: '/auth/login', label: t('auth:login') },
          { path: '/auth/signup', label: t('auth:signup') },
        ]),
  ];

  const isLanding = variant === 'landing';

  return (
    <div className="health-app-shell min-h-screen flex flex-col">
      {/* Header */}
      <header className="health-header sticky top-0 z-30 border-b border-teal-100/60 bg-white/85 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto pl-2 sm:pl-4 lg:pl-6 pr-4 sm:pr-6 lg:pr-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span
                className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25"
                aria-hidden
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-800 to-emerald-800 bg-clip-text text-transparent">
                {t('common:appName')}
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              {showNav &&
                navigation.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-teal-100 text-teal-800 shadow-sm'
                        : 'text-gray-600 hover:text-teal-800 hover:bg-teal-50/80'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              <div className="flex items-center space-x-4">
                {isAuthenticated && showNav && (
                  <button
                    type="button"
                    className="text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors"
                    onClick={handleLogout}
                  >
                    {t('common:logout')}
                  </button>
                )}
                <div className="relative">
                  <button
                    className="border rounded-full w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    aria-label={t('common:language')}
                    onClick={() => setOpen((o) => !o)}
                  >
                    🌐
                  </button>
                  {open && (
                    <div className="absolute ltr:right-0 rtl:left-0 mt-2 bg-white border rounded-md shadow-lg z-20 min-w-28">
                      {['en', 'hi', 'es', 'ar', 'zh'].map((code) => (
                        <button
                          key={code}
                          className="px-3 py-2 text-left rtl:text-right hover:bg-gray-50 w-full transition-colors block"
                          onClick={() => {
                            startTransition(() => {
                              i18n.changeLanguage(code);
                              localStorage.setItem('app.lang', code);
                              document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
                              setOpen(false);
                            });
                          }}
                        >
                          {code.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
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
            © {new Date().getFullYear()} {t('common:appName')}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PageShell;
