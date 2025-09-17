import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';

const Home = () => {
  const { t } = useTranslation(['common']);
  return (
    <PageShell title={t('common:home')}>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          {t('common:heroTitle')}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {t('common:heroSubtitle')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">{t('common:healthAssessment', 'Health Assessment')}</h3>
            <p className="text-gray-600 mb-4">
              {t('common:healthDesc', 'Take our comprehensive health questionnaire to get personalized insights')}
            </p>
            <Link
              to="/modules/heart-risk"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('common:startAssessment', 'Start Assessment')}
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">{t('common:prescriptionManagement', 'Prescription Management')}</h3>
            <p className="text-gray-600 mb-4">
              {t('common:prescriptionDesc', 'Keep track of your medications and get reminders.')}
            </p>
            <Link
              to="/modules/prescription"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              {t('common:managePrescription', 'Manage Prescriptions')}
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">{t('common:getSupport', 'Get Support')}</h3>
            <p className="text-gray-600 mb-4">
              {t('common:getSupportDesc', 'Connect with healthcare professionals for personalized support.')}
            </p>
            <Link
              to="/modules/tba"
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              {t('common:getSupport', 'Get Support')}
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Home;
