import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './i18n';

import ErrorBoundary from './components/ErrorBoundary';
import RequireAuth from './components/RequireAuth';
import RequireHealthConsent from './components/RequireHealthConsent';

import Home from './pages/Home';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ConsentPage from './pages/ConsentPage';
import Dashboard from './pages/Dashboard';
import Account from './pages/settings/Account';
import HeartRisk from './pages/modules/HeartRisk';
import FraminghamRisk from './pages/modules/FraminghamRisk';
import Prescription from './pages/modules/Prescription';
import TBA from './pages/modules/TBA';
import Questionnaire from './pages/Questionnaire';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />

          <Route element={<RequireAuth />}>
            <Route path="/consent" element={<ConsentPage />} />
            <Route element={<RequireHealthConsent />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings/account" element={<Account />} />
              <Route path="/modules/heart-risk" element={<HeartRisk />} />
              <Route path="/modules/framingham-risk" element={<FraminghamRisk />} />
              <Route path="/modules/prescription" element={<Prescription />} />
              <Route path="/modules/tba" element={<TBA />} />
              <Route path="/questionnaire" element={<Questionnaire />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
