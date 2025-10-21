import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './i18n';
import LanguagePicker from './components/LanguagePicker';
import ProtectedRoute from './components/ProtectedRoute';
import AuthProvider from './context/AuthProvider';

// Import pages
import Home from './pages/Home';
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

  useEffect(() => {
    if (!localStorage.getItem('app.lang')) {
      setShowPicker(true);
    }
  }, []);

  const handleSelectLang = (code) => {
    localStorage.setItem('app.lang', code);
    window.location.reload(); // reload to re-init i18n and dir
  };

  return (
    <>
      {showPicker && <LanguagePicker onSelect={handleSelectLang} />}
      <AuthProvider>
        <Router>
          <Toaster position="top-right" reverseOrder={false} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/dashboard"
              element={(
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/settings/account"
              element={(
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              )}
            />
            <Route path="/modules/heart-risk" element={<HeartRisk />} />
            <Route path="/modules/prescription" element={<Prescription />} />
            <Route path="/modules/tba" element={<TBA />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;