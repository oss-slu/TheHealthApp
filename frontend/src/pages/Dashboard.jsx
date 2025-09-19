import React from 'react';
<<<<<<< HEAD
import PageShell from '../components/PageShell';

const Dashboard = () => {
  return (
    <PageShell title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Assessments</h3>
          <p className="text-gray-600">No recent assessments found.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Status</h3>
          <p className="text-gray-600">Complete an assessment to see your health status.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
=======
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
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
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
