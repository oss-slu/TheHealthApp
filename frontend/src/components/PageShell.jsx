import React, { useState, useEffect, startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n.js';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const PageShell = ({ children, title, showNav = true }) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto pl-2 sm:pl-4 lg:pl-6 pr-4 sm:pr-6 lg:pr-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                {t('common:appName')}
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              {showNav &&
                navigation.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {title && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{typeof title === "string" ? t(title) : title}</h2>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 {t('common:appName')}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PageShell;
