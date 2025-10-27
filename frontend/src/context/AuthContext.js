import { createContext } from 'react';

export const AuthContext = createContext({
  user: null,
  tokens: null,
  initializing: true,
  isAuthenticated: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  updateProfile: async () => {},
  uploadProfilePhoto: async () => {},
});
