import React, { useState, startTransition, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n.js';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../UserContext';
import apiClient from '../apiClient';

const UserAvatar = () => {
  const { user, refresh } = useUser() || {};
  const [err, setErr] = useState(null);
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const onChoose = () => {
    inputRef.current?.click();
  };

  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) return 'Only PNG, JPEG or WEBP images are allowed for profile photo.';
    if (file.size > maxSize) return 'File is too large. Maximum allowed size is 5MB.';
    return null;
  };

  const onFile = async (e) => {
    setErr(null);
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const v = validateFile(file);
    if (v) { setErr(v); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      await apiClient.updateCurrentUser(fd);
      await refresh();
    } catch (error) {
      setErr(error?.body?.message || error.message || 'Upload failed');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <button onClick={onChoose} className="flex items-center focus:outline-none">
          {user && user.photo ? (
            <img src={user.photo} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">U</div>
          )}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      {loading && <div className="text-xs text-gray-500 mt-1">Updating...</div>}
      {err && <div className="text-xs text-red-600 mt-1">{err}</div>}
    </div>
  );
};

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
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  className="border rounded-full w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors" 
                  aria-label={t('common:language')} 
                  onClick={() => setOpen(o=>!o)}
                >
                  🌐
                </button>
                {open && (
                  <div className="absolute ltr:right-0 rtl:left-0 mt-2 bg-white border rounded-md shadow-lg z-20 min-w-28">
                    {['en','hi','es','ar','zh'].map(code => (
                      <button 
                        key={code} 
                        className="px-3 py-2 text-left rtl:text-right hover:bg-gray-50 w-full transition-colors block" 
                        onClick={() => { 
                          startTransition(()=>{ 
                            i18n.changeLanguage(code); 
                            localStorage.setItem('app.lang', code); 
                            document.documentElement.dir = code==='ar'?'rtl':'ltr'; 
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

            {/* User avatar + upload */}
            <UserAvatar />
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
