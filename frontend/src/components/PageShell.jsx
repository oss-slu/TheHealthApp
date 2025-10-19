import React, { useMemo, useState, startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n.js';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const PageShell = ({ children, title }) => {
  const { t } = useTranslation(['common','auth','dashboard','modules']);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  
  const navigation = useMemo(() => {
    const shared = [
      { path: '/', label: t('common:home'), requireAuth: false },
      { path: '/modules/heart-risk', label: t('modules:heartRisk'), requireAuth: false },
      { path: '/modules/prescription', label: t('modules:prescription'), requireAuth: false },
      { path: '/modules/tba', label: t('modules:tba'), requireAuth: false },
    ];

    const authOnly = [
      { path: '/dashboard', label: t('dashboard:menuLabel'), requireAuth: true },
      { path: '/settings/account', label: t('common:accountSettings'), requireAuth: true },
    ];

    const publicOnly = [
      { path: '/auth/login', label: t('auth:login'), requireAuth: false, hideWhenAuth: true },
      { path: '/auth/signup', label: t('auth:signup'), requireAuth: false, hideWhenAuth: true },
    ];

    return [...shared, ...(isAuthenticated ? authOnly : []), ...publicOnly];
  }, [isAuthenticated, t]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login', { replace: true });
  };

  const initials = useMemo(() => {
    if (!user?.name) return '👤';
    const parts = user.name.trim().split(' ');
    const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
    return letters || '👤';
  }, [user?.name]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {t('common:appName')}
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                if ((item.hideWhenAuth && isAuthenticated) || (item.requireAuth && !isAuthenticated)) {
                  return null;
                }

                return (
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
                );
              })}
              <div className="flex items-center space-x-4">
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
                {isAuthenticated ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      {user?.photo_url ? (
                        <img
                          src={user.photo_url}
                          alt={user.name}
                          className="h-9 w-9 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                          {initials}
                        </div>
                      )}
                      <span className="text-sm text-gray-700 font-medium">{user?.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      {t('common:logout')}
                    </button>
                  </div>
                ) : null}
              </div>
            </nav>
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
