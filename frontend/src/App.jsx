import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './i18n';
import LanguagePicker from './components/LanguagePicker';

// Import pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Account from './pages/settings/Account';
import HeartRisk from './pages/modules/HeartRisk';
import Prescription from './pages/modules/Prescription';
import TBA from './pages/modules/TBA';
import NotFound from './pages/NotFound';


function App() {
  const [showPicker, setShowPicker] = useState(() => !localStorage.getItem('app.lang'));
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('auth.session') === 'true'
  );

  useEffect(() => {
    if (!localStorage.getItem('app.lang')) {
      setShowPicker(true);
    }
  }, []);

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

  const handleSelectLang = (code) => {
    localStorage.setItem('app.lang', code);
    window.location.reload(); // reload to re-init i18n and dir
  };

  const handleAuthSuccess = () => {
    localStorage.setItem('auth.session', 'true');
    setIsAuthenticated(true);
    window.dispatchEvent(new Event('auth-change'));
  };

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/auth/login" replace />;
    }
    return children;
  };

  return (
    <>
      {showPicker && <LanguagePicker onSelect={handleSelectLang} />}
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/login" element={<Login onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/auth/signup" element={<Signup onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )}
          />
          <Route path="/settings/account" element={<Account />} />
          <Route path="/modules/heart-risk" element={<HeartRisk />} />
          <Route path="/modules/prescription" element={<Prescription />} />
          <Route path="/modules/tba" element={<TBA />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;