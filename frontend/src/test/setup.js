import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Clear mocks after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  document.documentElement.dir = 'ltr';
  document.body.innerHTML = '';
});

// Suppress console.error for expected errors in tests
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    // Allow logging actual errors, suppress React error boundary warnings
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Error boundaries')
    ) {
      return;
    }
    // Uncomment the line below to see all console errors during test development
    // console.warn(...args);
  });
});
