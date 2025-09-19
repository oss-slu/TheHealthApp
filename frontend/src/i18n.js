import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

const savedLang = localStorage.getItem('app.lang') || 'en';

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: savedLang,
    fallbackLng: 'en',
    ns: ['common', 'auth', 'dashboard', 'modules'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
    react: { useSuspense: false }
  });

document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';

export default i18n;
