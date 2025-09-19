import React from 'react';
import { useTranslation } from 'react-i18next';
import PageShell from '../components/PageShell';

const Dashboard = () => {
  const { t } = useTranslation(['dashboard']);
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard:quickActions','Quick Actions')}</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
              Take Health Assessment
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
              View Prescriptions
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Dashboard;
