import { createContext } from 'react';

export const AuthContext = createContext({
  user: null,
  tokens: null,
  initializing: true,
  isAuthenticated: false,
  consentStatus: null,
  consentReady: false,
  consentLoadError: false,
  retryConsentLoad: async () => {},
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  updateProfile: async () => {},
  uploadProfilePhoto: async () => {},
});
