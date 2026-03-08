import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import PageShell from '../components/PageShell';

const Dashboard = () => {
  const { t } = useTranslation(['dashboard', 'modules', 'questionnaire']);
  const location = useLocation();
  const questionnaireComplete = location.state?.questionnaireComplete;

  return (
    <PageShell title="dashboard:title">
      {questionnaireComplete && (
        <div className="mb-6 rounded border border-green-300 bg-green-50 text-green-800 p-4">
          {t('questionnaire:success.message')}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/questionnaire"
          className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('dashboard:healthQuestionnaire')}</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-blue-100 mb-4">
            {t('dashboard:questionnaireDescription')}
          </p>
          <span className="text-white font-medium flex items-center">
            {t('dashboard:completeQuestionnaire')} →
          </span>
        </Link>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard:recentAssessments')}</h3>
          <p className="text-gray-600">{t('dashboard:noRecent')}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard:healthStatus')}</h3>
          <p className="text-gray-600">{t('dashboard:promptAssess')}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard:reminders')}</h3>
          <p className="text-gray-600">{t('dashboard:noReminders')}</p>
        </div>
        <Link
          to="/modules/heart-risk"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('modules:heartRisk')}</h3>
          <p className="text-gray-600 mb-4">
            {t('modules:cardioRiskAssessmentDescription', 'This assessment helps evaluate your risk for heart disease and other cardiovascular conditions.')}
          </p>
          <span className="text-blue-600 hover:text-blue-700 font-medium">
            {t('dashboard:viewDetails', 'View Details')} →
          </span>
        </Link>
        <Link
          to="/modules/prescription"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('modules:prescription')}</h3>
          <p className="text-gray-600 mb-4">
            {t('modules:medicalDescription', 'Manage and view your medical prescriptions here.')}
          </p>
          <span className="text-blue-600 hover:text-blue-700 font-medium">
            {t('dashboard:viewDetails', 'View Details')} →
          </span>
        </Link>
        <Link
          to="/modules/tba"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('modules:tba')}</h3>
          <p className="text-gray-600 mb-4">
            {t('modules:tbaDescription', 'Connect with healthcare professionals and get personalized support for your health needs.')}
          </p>
          <span className="text-blue-600 hover:text-blue-700 font-medium">
            {t('dashboard:viewDetails', 'View Details')} →
          </span>
        </Link>
      </div>
    </PageShell>
  );
};

export default Dashboard;
