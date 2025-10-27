import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient, { setUnauthorizedHandler, setTokens as storeTokens } from './apiClient';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate?.() || null;

  const logout = () => {
    storeTokens(null);
    setProfile(null);
    if (navigate) navigate('/auth/login');
    else window.location.href = '/auth/login';
  };

  // handle 401 from apiClient
  useEffect(() => {
    setUnauthorizedHandler(() => logout);
  }, []);

  // on mount, if tokens exist try to fetch profile
  useEffect(() => {
    const tokens = localStorage.getItem('tokens') || localStorage.getItem('access_token');
    if (!tokens) return;
    (async () => {
      try {
        await fetchMe();
      } catch (e) {
        // ignore; fetchMe handles logout on 401
        console.error('fetchMe failed', e);
      }
    })();
  }, []);

  const fetchMe = async () => {
    try {
      const res = await apiClient.request('/users/me');
      // server returns data shape { data: { ...user } } or user directly; handle both
      const user = res?.data ?? res;
      setProfile(user);
      return user;
    } catch (err) {
      if (err.status === 401) {
        logout();
        return null;
      }
      throw err;
    }
  };

  const value = {
    profile,
    setProfile,
    fetchMe,
    logout,
    setTokens: (tokens) => storeTokens(tokens),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
