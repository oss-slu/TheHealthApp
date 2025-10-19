import { authBus } from './authBus';

const TOKEN_KEY = 'healthApp.tokens';
const USER_KEY = 'healthApp.user';

const safeParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('Failed to parse stored value', error);
    return null;
  }
};

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

let cachedTokens = null;
let cachedUser = null;

const syncFromStorage = () => {
  if (!isBrowser) return;
  cachedTokens = safeParse(window.localStorage.getItem(TOKEN_KEY));
  cachedUser = safeParse(window.localStorage.getItem(USER_KEY));
};

const ensureCache = () => {
  if (cachedTokens === null && cachedUser === null) {
    syncFromStorage();
  }
};

const persist = (key, value) => {
  if (!isBrowser) return;
  if (value === null || value === undefined) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
};

export const authStorage = {
  getTokens() {
    ensureCache();
    return cachedTokens;
  },
  getAccessToken() {
    return this.getTokens()?.access_token ?? null;
  },
  getRefreshToken() {
    return this.getTokens()?.refresh_token ?? null;
  },
  setTokens(tokens) {
    cachedTokens = tokens ?? null;
    persist(TOKEN_KEY, cachedTokens);
    if (tokens) authBus.emitTokensUpdated(tokens);
  },
  getUser() {
    ensureCache();
    return cachedUser;
  },
  setUser(user) {
    cachedUser = user ?? null;
    persist(USER_KEY, cachedUser);
    authBus.emitUserUpdated(cachedUser);
  },
  setSession(session) {
    if (!session) {
      this.clear();
      return;
    }
    const { tokens, user } = session;
    this.setTokens(tokens ?? null);
    this.setUser(user ?? null);
  },
  clear() {
    cachedTokens = null;
    cachedUser = null;
    persist(TOKEN_KEY, null);
    persist(USER_KEY, null);
  },
  getPreferredLanguage() {
    if (!isBrowser) return 'en';
    return window.localStorage.getItem('app.lang') || 'en';
  },
};

if (isBrowser) {
  try {
    window.addEventListener('storage', (event) => {
      if (event.key === TOKEN_KEY) {
        cachedTokens = safeParse(event.newValue);
      }
      if (event.key === USER_KEY) {
        cachedUser = safeParse(event.newValue);
      }
    });
  } catch (error) {
    console.warn('Storage event listener registration failed', error);
  }
}
