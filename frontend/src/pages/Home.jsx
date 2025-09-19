import React from 'react';
<<<<<<< HEAD
=======
import { useTranslation } from 'react-i18next';
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';

const Home = () => {
<<<<<<< HEAD
  return (
    <PageShell title="Welcome to Health Support Assistant">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Your Health Companion
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Get personalized health assessments and support whenever you need it.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Health Assessment</h3>
            <p className="text-gray-600 mb-4">
              Take our comprehensive health questionnaire to get personalized insights.
=======
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
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
            </p>
            <Link
              to="/modules/heart-risk"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
<<<<<<< HEAD
              Start Assessment
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Prescription Management</h3>
            <p className="text-gray-600 mb-4">
              Keep track of your medications and get reminders.
=======
              {t('common:startAssessment', 'Start Assessment')}
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">{t('common:prescriptionManagement', 'Prescription Management')}</h3>
            <p className="text-gray-600 mb-4">
              {t('common:prescriptionDesc', 'Keep track of your medications and get reminders.')}
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
            </p>
            <Link
              to="/modules/prescription"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
<<<<<<< HEAD
              Manage Prescriptions
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Get Support</h3>
            <p className="text-gray-600 mb-4">
              Connect with healthcare professionals for personalized support.
=======
              {t('common:managePrescription', 'Manage Prescriptions')}
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">{t('common:getSupport', 'Get Support')}</h3>
            <p className="text-gray-600 mb-4">
              {t('common:getSupportDesc', 'Connect with healthcare professionals for personalized support.')}
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
            </p>
            <Link
              to="/modules/tba"
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
<<<<<<< HEAD
              Get Support
=======
              {t('common:getSupport', 'Get Support')}
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Home;
