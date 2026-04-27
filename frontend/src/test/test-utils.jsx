import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import framinghamEn from '../../public/locales/en/framingham.json';

// Create a test i18n instance with inline translations
const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'auth', 'dashboard', 'modules', 'errors', 'framingham', 'questionnaire'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  resources: {
    en: {
      common: {
        appName: 'Health Support',
        language: 'Language',
        pleaseWait: 'Please wait...',
        select: 'Select...',
        logout: 'Logout',
        accountSettings: 'Account Settings',
        male: 'Male',
        female: 'Female',
        others: 'Other',
        preferNotToSay: 'Prefer not to say',
        save: 'Save',
      },
      auth: {
        login: 'Login',
        signup: 'Sign Up',
        username: 'Username',
        password: 'Password',
        usernamePlaceholder: 'Enter username',
        passwordPlaceholder: 'Enter password',
        usernameHelp: '3-20 characters, letters, numbers, dots, and underscores',
        passwordHelp: '8+ characters with uppercase, lowercase, number, and special char',
        forgotPassword: 'Forgot Password?',
        confirmPassword: 'Confirm Password',
        name: 'Full Name',
        namePlaceholder: 'Enter your full name',
        age: 'Age',
        gender: 'Gender',
        phone: 'Phone',
        phonePlaceholder: '10-15 digit phone number',
        resetLinkSent: 'Reset link has been sent.',
        errors: {
          usernameInvalid: 'Invalid username format',
          passwordInvalid: 'Invalid password format',
          passwordMismatch: 'Passwords do not match',
          nameInvalid: 'Name must be at least 2 characters',
          ageInvalid: 'Age must be between 13 and 120',
          genderRequired: 'Please select a gender',
          phoneInvalid: 'Enter a valid 10-15 digit phone number',
        },
      },
      dashboard: {
        title: 'Dashboard',
        menuLabel: 'Dashboard',
        recentAssessments: 'Recent Assessments',
        noRecent: 'No recent assessments',
        healthStatus: 'Health Status',
        promptAssess: 'Complete an assessment to view your health status',
        reminders: 'Reminders',
        noReminders: 'No reminders',
        viewDetails: 'View Details',
        cardioRiskAssessmentDescription: 'Evaluate your cardiovascular health risk',
        healthQuestionnaire: 'Health Questionnaire',
        questionnaireDescription: 'Complete your profile',
        completeQuestionnaire: 'Complete Now',
        framinghamCardTitle: 'Framingham Risk Assessment',
        framinghamCardDesc: '10-year cardiovascular risk from the backend model.',
      },
      modules: {
        heartRisk: 'Heart Risk Assessment',
        prescription: 'Prescription Manager',
        tba: 'Health Support',
        cardioRiskAssessmentDescription: 'Evaluate your cardiovascular health risk',
        medicalDescription: 'Manage your prescriptions',
        tbaDescription: 'Get personalized health support',
        selectYourGender: 'Select gender',
        male: 'Male',
        female: 'Female',
      },
      errors: {
        generic: 'Something went wrong',
        boundaryTitle: 'Something went wrong',
        boundaryDescription: 'We encountered an unexpected error.',
        retry: 'Try Again',
        goHome: 'Go Home',
        server: 'Server error',
        network: 'Network error',
        timeout: 'Request timed out',
      },
      framingham: framinghamEn,
    },
    ar: {
      common: {
        appName: 'دعم الصحة',
        language: 'اللغة',
        pleaseWait: 'يرجى الانتظار...',
        logout: 'تسجيل خروج',
        save: 'حفظ',
      },
      auth: {
        login: 'تسجيل الدخول',
        signup: 'إنشاء حساب',
        username: 'اسم المستخدم',
        password: 'كلمة المرور',
        forgotPassword: 'نسيت كلمة المرور؟',
        resetLinkSent: 'تم إرسال رابط إعادة التعيين',
        phone: 'الهاتف',
      },
      dashboard: {
        title: 'لوحة التحكم',
        menuLabel: 'لوحة التحكم',
      },
      errors: {
        boundaryTitle: 'حدث خطأ ما',
        boundaryDescription: 'واجهنا خطأ غير متوقع.',
        retry: 'حاول مرة أخرى',
        goHome: 'الذهاب إلى الصفحة الرئيسية',
      },
    },
  },
});

// Default mock auth context
const defaultAuthContext = {
  user: null,
  tokens: null,
  initializing: false,
  isAuthenticated: false,
  consentStatus: { consent_given: true, version: 'v1.0' },
  consentReady: true,
  consentLoadError: false,
  retryConsentLoad: vi.fn(),
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
  updateProfile: vi.fn(),
  uploadProfilePhoto: vi.fn(),
};

/**
 * Custom render function with all providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {string} options.route - Initial route (default: '/')
 * @param {Object} options.authContext - Auth context overrides
 * @param {string} options.locale - Locale for i18n (default: 'en')
 * @param {string} options.dir - Document direction (default: 'ltr')
 */
export function renderWithProviders(
  ui,
  {
    route = '/',
    authContext = {},
    locale = 'en',
    dir = 'ltr',
    ...renderOptions
  } = {}
) {
  // Set document direction for RTL testing
  document.documentElement.dir = dir;
  
  // Set locale
  testI18n.changeLanguage(locale);

  const mergedAuthContext = { ...defaultAuthContext, ...authContext };

  function Wrapper({ children }) {
    return (
      <I18nextProvider i18n={testI18n}>
        <AuthContext.Provider value={mergedAuthContext}>
          <MemoryRouter initialEntries={[route]}>
            {children}
          </MemoryRouter>
        </AuthContext.Provider>
      </I18nextProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    authContext: mergedAuthContext,
    i18n: testI18n,
  };
}

/**
 * Render with RTL (Arabic) locale
 */
export function renderWithRTL(ui, options = {}) {
  return renderWithProviders(ui, {
    ...options,
    locale: 'ar',
    dir: 'rtl',
  });
}

/**
 * Create a mock authenticated context
 */
export function createAuthenticatedContext(overrides = {}) {
  return {
    user: {
      username: 'testuser',
      name: 'Test User',
      consent_given: true,
      data_usage: true,
      consent_version: 'v1.0',
    },
    tokens: { access_token: 'test-token' },
    initializing: false,
    isAuthenticated: true,
    consentStatus: { consent_given: true, version: 'v1.0' },
    consentReady: true,
    consentLoadError: false,
    retryConsentLoad: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    updateProfile: vi.fn(),
    uploadProfilePhoto: vi.fn(),
    ...overrides,
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
