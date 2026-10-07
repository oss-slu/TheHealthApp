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
    ns: ['common', 'auth', 'dashboard', 'modules', 'errors', 'questionnaire', 'framingham'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
    react: { useSuspense: false }
  });

function applyDocumentLocale(lng) {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng || 'en';
}

applyDocumentLocale(savedLang);

i18n.on('languageChanged', (lng) => {
  applyDocumentLocale(lng);
});

export default i18n;
