import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';

const CheckIcon = () => (
  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </span>
);

const Home = () => {
  const { t } = useTranslation(['common']);

  const highlights = [
    'introHighlight1',
    'introHighlight2',
    'introHighlight3',
    'introHighlight4',
  ];

  const cards = [
    {
      to: '/questionnaire',
      titleKey: 'healthAssessment',
      descKey: 'healthDesc',
      ctaKey: 'startAssessment',
      gradient: 'from-sky-500 to-blue-600',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      ),
    },
    {
      to: '/modules/prescription',
      titleKey: 'prescriptionManagement',
      descKey: 'prescriptionDesc',
      ctaKey: 'managePrescription',
      gradient: 'from-emerald-500 to-teal-600',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      ),
    },
    {
      to: '/modules/tba',
      titleKey: 'getSupport',
      descKey: 'getSupportDesc',
      ctaKey: 'getSupport',
      gradient: 'from-violet-500 to-indigo-600',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      ),
    },
  ];

  return (
    <PageShell title={null} variant="landing">
      <div className="health-landing relative flex min-h-[calc(100vh-8.5rem)] flex-col items-center justify-center overflow-hidden rounded-3xl border border-teal-100/80 bg-gradient-to-b from-white via-teal-50/40 to-emerald-50/30 px-4 py-10 shadow-[0_4px_40px_-12px_rgba(13,148,136,0.15)] sm:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          aria-hidden
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, rgba(45,212,191,0.25) 0%, transparent 45%),
              radial-gradient(circle at 80% 10%, rgba(99,102,241,0.12) 0%, transparent 40%),
              radial-gradient(circle at 50% 100%, rgba(16,185,129,0.12) 0%, transparent 50%)`,
          }}
        />
        <div className="relative z-[1] mx-auto w-full max-w-4xl text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-wider text-teal-800 shadow-sm">
            {t('common:introBadge')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-teal-950 sm:text-4xl md:text-5xl">
            {t('common:introWelcomeTitle')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-teal-900/90 sm:text-xl">
            {t('common:introSubtitle')}
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-600">
            {t('common:introDescription')}
          </p>

          <ul className="mx-auto mt-8 max-w-xl space-y-3 text-left text-sm text-gray-700 sm:text-base">
            {highlights.map((key) => (
              <li key={key} className="flex items-start gap-3">
                <CheckIcon />
                <span>{t(`common:${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-[1] mt-12 w-full max-w-5xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.to}
                className="group flex flex-col rounded-2xl border border-white/80 bg-white/90 p-6 shadow-lg shadow-teal-900/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-200/80 hover:shadow-xl hover:shadow-teal-900/10"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg`}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {card.icon}
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t(`common:${card.titleKey}`)}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{t(`common:${card.descKey}`)}</p>
                <Link
                  to={card.to}
                  className={`mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r ${card.gradient} px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 hover:shadow-lg`}
                >
                  {t(`common:${card.ctaKey}`)}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Home;
