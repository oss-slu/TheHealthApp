const listeners = {
  logout: new Set(),
  tokens: new Set(),
  user: new Set(),
};

const subscribe = (type, callback) => {
  listeners[type].add(callback);
  return () => listeners[type].delete(callback);
};

export const authBus = {
  onLogout(callback) {
    return subscribe('logout', callback);
  },
  emitLogout() {
    listeners.logout.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('authBus logout listener error', error);
      }
    });
  },
  onTokensUpdated(callback) {
    return subscribe('tokens', callback);
  },
  emitTokensUpdated(tokens) {
    listeners.tokens.forEach((callback) => {
      try {
        callback(tokens);
      } catch (error) {
        console.error('authBus tokens listener error', error);
      }
    });
  },
  onUserUpdated(callback) {
    return subscribe('user', callback);
  },
  emitUserUpdated(user) {
    listeners.user.forEach((callback) => {
      try {
        callback(user);
      } catch (error) {
        console.error('authBus user listener error', error);
      }
    });
  },
};
