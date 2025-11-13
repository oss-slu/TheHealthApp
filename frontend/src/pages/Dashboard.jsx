import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';

const Dashboard = () => {
  const { t } = useTranslation(['dashboard', 'modules']);
  return (
    <PageShell title="dashboard:title">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
