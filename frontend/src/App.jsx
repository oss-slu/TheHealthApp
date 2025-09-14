import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings/account" element={<Account />} />
        <Route path="/modules/heart-risk" element={<HeartRisk />} />
        <Route path="/modules/prescription" element={<Prescription />} />
        <Route path="/modules/tba" element={<TBA />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;