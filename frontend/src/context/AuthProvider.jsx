import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AuthContext } from './AuthContext';
import { authStorage } from '../lib/authStorage';
import { authBus } from '../lib/authBus';
import { authService } from '../services/authService';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [tokens, setTokens] = useState(() => authStorage.getTokens());
  const [initializing, setInitializing] = useState(true);

  const setSession = useCallback((session) => {
    authStorage.setSession(session);
    setTokens(session?.tokens ?? null);
    setUser(session?.user ?? null);
  }, []);

  const clearSession = useCallback(() => {
    authStorage.clear();
    setTokens(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const current = await authService.getCurrentUser({ suppressToast: true });
    authStorage.setUser(current);
    setUser(current);
    return current;
  }, []);

  const login = useCallback(
    async (credentials) => {
      const response = await authService.login(credentials);
      setSession(response);
      return response.user;
    },
    [setSession],
  );

  const signup = useCallback(
    async (payload) => {
      const response = await authService.signup(payload);
      setSession(response);
      return response.user;
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout request failed', error);
    } finally {
      authBus.emitLogout();
    }
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const updatedUser = await authService.updateProfile(payload);
    authStorage.setUser(updatedUser);
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const uploadProfilePhoto = useCallback(async (file) => {
    const updatedUser = await authService.uploadProfilePhoto(file);
    authStorage.setUser(updatedUser);
    setUser(updatedUser);
    return updatedUser;
  }, []);

  useEffect(() => {
    const unsubscribeLogout = authBus.onLogout(() => {
      clearSession();
    });
    const unsubscribeTokens = authBus.onTokensUpdated((nextTokens) => {
      setTokens(nextTokens ?? null);
    });
    const unsubscribeUser = authBus.onUserUpdated((nextUser) => {
      setUser(nextUser ?? null);
    });

    return () => {
      unsubscribeLogout();
      unsubscribeTokens();
      unsubscribeUser();
    };
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const accessToken = authStorage.getAccessToken();
      if (!accessToken) {
        if (!cancelled) setInitializing(false);
        return;
      }

      try {
        await refreshUser();
      } catch (error) {
        console.warn('Failed to refresh user session', error);
        if (!cancelled) {
          clearSession();
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [clearSession, refreshUser]);

  const value = useMemo(
    () => ({
      user,
      tokens,
      initializing,
      isAuthenticated: Boolean(tokens?.access_token),
      login,
      signup,
      logout,
      refreshUser,
      updateProfile,
      uploadProfilePhoto,
    }),
    [initializing, login, logout, refreshUser, signup, tokens, updateProfile, uploadProfilePhoto, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
