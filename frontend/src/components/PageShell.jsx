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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Health Support Assistant
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
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {title && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 Health Support Assistant. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PageShell;
