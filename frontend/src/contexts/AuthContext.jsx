import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Optionally verify token or fetch user profile
      // For now, assume valid and set dummy user
      setUser({}); // TODO: fetch user data
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.data.tokens.access_token);
        localStorage.setItem('refreshToken', data.data.tokens.refresh_token);
        setUser(data.data.user);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/auth/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};