<<<<<<< HEAD
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PageShell = ({ children, title }) => {
  const location = useLocation();
  
  const navigation = [
    { path: '/', label: 'Home' },
    { path: '/auth/login', label: 'Login' },
    { path: '/auth/signup', label: 'Sign Up' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/settings/account', label: 'Account' },
    { path: '/modules/heart-risk', label: 'Heart Risk' },
    { path: '/modules/prescription', label: 'Prescription' },
    { path: '/modules/tba', label: 'TBA' },
  ];
=======
import React, { useState, startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n.js';
import { Link, useLocation } from 'react-router-dom';

const PageShell = ({ children, title }) => {
  const { t } = useTranslation(['common','auth','dashboard','modules']);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  
  const navigation = [
  { path: '/', label: t('common:home') },
  { path: '/auth/login', label: t('auth:login') },
  { path: '/auth/signup', label: t('auth:signup') },
  { path: '/dashboard', label: t('dashboard:menuLabel') },
  { path: '/settings/account', label: t('common:accountSettings') },
  { path: '/modules/heart-risk', label: t('modules:heartRisk') },
  { path: '/modules/prescription', label: t('modules:prescription') },
  { path: '/modules/tba', label: t('modules:tba') },
];
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
<<<<<<< HEAD
                Health Support Assistant
=======
                {t('common:appName')}
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
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
<<<<<<< HEAD
            </nav>
=======
            <div className="flex items-center space-x-4">
            <div className="relative">
              <button className="border rounded-full w-9 h-9 flex items-center justify-center" aria-label={t('common:language')} onClick={() => setOpen(o=>!o)}>🌐</button>
              {open && (
                <div className="absolute right-0 mt-2 bg-white border rounded-md shadow z-20 min-w-28">
                  {['en','hi','es','ar','zh'].map(code => (
                    <button key={code} className="px-3 py-2 text-left hover:bg-gray-50 w-full" onClick={() => { startTransition(()=>{ i18n.changeLanguage(code); localStorage.setItem('app.lang', code); document.documentElement.dir = code==='ar'?'rtl':'ltr'; setOpen(false); });}}>{code.toUpperCase()}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {title && (
            <div className="mb-6">
<<<<<<< HEAD
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
=======
              <h2 className="text-2xl font-bold text-gray-900">{typeof title === "string" ? t(title) : title}</h2>
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
<<<<<<< HEAD
            © 2024 Health Support Assistant. All rights reserved.
=======
            © 2024 {t('common:appName')}. All rights reserved.
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PageShell;
