import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import PageShell from '../components/PageShell';

const BADGE_STYLES = {
  good: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  critical: 'bg-rose-50 text-rose-800 border-rose-200',
  neutral: 'bg-slate-50 text-slate-700 border-slate-200',
};

const DashboardBadge = ({ status = 'neutral', label, children, className = '' }) => {
  const badgeStyle = BADGE_STYLES[status] || BADGE_STYLES.neutral;
  return (
    <span
      role="status"
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}
    >
      {label || children}
    </span>
  );
};

const DashboardMetricCard = ({
  title,
  value,
  unit,
  status = 'neutral',
  statusLabel,
  description,
  isPlaceholder = false,
  className = '',
}) => {
  return (
    <div
      role="region"
      aria-label={title}
      className={`p-5 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md ${className}`}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className="text-sm font-medium text-slate-600 truncate">{title}</h3>
        {statusLabel && <DashboardBadge status={status} label={statusLabel} />}
      </div>
      <div className="flex items-baseline gap-1 my-1">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {unit && <span className="text-xs text-slate-500 font-medium">{unit}</span>}
      </div>
      {isPlaceholder && (
        <span className="inline-block mt-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          Sample / Placeholder
        </span>
      )}
      {description && <p className="text-xs text-slate-500 mt-2">{description}</p>}
    </div>
  );
};

const Dashboard = () => {
  const { t } = useTranslation(['dashboard', 'modules', 'questionnaire', 'common']);
  const location = useLocation();
  const questionnaireComplete = location.state?.questionnaireComplete;

  return (
    <PageShell title="dashboard:title">
      {/* Questionnaire Completion Banner */}
      {questionnaireComplete && (
        <div className="mb-6 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 p-4 shadow-sm flex items-center justify-between">
          <p className="font-medium">{t('questionnaire:success.message', 'Questionnaire completed successfully!')}</p>
        </div>
      )}

      {/* 1. Header / Greeting Area (Explicit Account Status) */}
      <section className="mb-8" aria-labelledby="dashboard-greeting">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 p-6 rounded-2xl shadow-sm">
          <div>
            <h2 id="dashboard-greeting" className="text-2xl sm:text-3xl font-extrabold text-teal-950 tracking-tight">
              {t('dashboard:greeting', 'Welcome back!')}
            </h2>
            <p className="text-sm text-teal-800/80 mt-1">
              {t('dashboard:subtitle', 'Track your health vitals, daily actions, and assessments all in one place.')}
            </p>
          </div>
          <div>
            <DashboardBadge
              status="neutral"
              label={t('dashboard:accountStatusActive', 'Account: Active')}
            />
          </div>
        </div>
      </section>

      {/* 2. Primary Daily Action Hero Card */}
      <section className="mb-8" aria-labelledby="primary-action-heading">
        <h3 id="primary-action-heading" className="text-lg font-bold text-slate-900 mb-3">
          {t('dashboard:primaryActionTitle', 'Primary Daily Health Action')}
        </h3>
        <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 rounded-2xl p-6 sm:p-8 text-white shadow-md hover:shadow-lg transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase text-teal-100">
                {t('dashboard:recommendedToday', 'Recommended for today')}
              </span>
              <h4 className="text-xl sm:text-2xl font-bold">
                {t('dashboard:healthQuestionnaire', 'Health Questionnaire')}
              </h4>
              <p className="text-teal-100 text-sm leading-relaxed">
                {t('dashboard:questionnaireDescription', 'Complete your comprehensive daily health survey to update your wellness status and personalized care guidance.')}
              </p>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <Link
                to="/questionnaire"
                className="inline-flex items-center justify-center px-6 py-3.5 bg-white text-teal-900 font-bold text-sm rounded-xl shadow-md hover:bg-teal-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-700"
              >
                {t('dashboard:completeQuestionnaire', 'Start Questionnaire')} →
              </Link>
              <Link
                to="/health-summary"
                className="inline-flex items-center justify-center px-4 py-3.5 bg-teal-800/60 hover:bg-teal-800 text-white font-medium text-sm rounded-xl border border-teal-500/50 transition-colors"
              >
                {t('dashboard:viewSummary', 'Health Summary')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Health Status & Vitals */}
      <section className="mb-8" aria-labelledby="health-status-heading">
        <h3 id="health-status-heading" className="text-lg font-bold text-slate-900 mb-3">
          {t('dashboard:healthStatus', 'Health Status')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <DashboardMetricCard
            title={t('dashboard:framinghamCardTitle', 'Cardiovascular Risk')}
            value="Low"
            status="good"
            isPlaceholder={true}
            statusLabel={t('dashboard:normalRisk', 'Normal')}
            description={t('dashboard:framinghamCardDesc', 'Based on your latest Framingham cardiovascular assessment data.')}
          />
          <DashboardMetricCard
            title={t('dashboard:bloodPressure', 'Blood Pressure')}
            value="120/80"
            unit="mmHg"
            status="good"
            isPlaceholder={true}
            statusLabel={t('dashboard:optimal', 'Optimal')}
            description={t('dashboard:bpDesc', 'Measured within recommended resting levels.')}
          />
          <DashboardMetricCard
            title={t('dashboard:activityLevel', 'Daily Movement')}
            value="30"
            unit="mins"
            status="good"
            isPlaceholder={true}
            statusLabel={t('dashboard:onTrack', 'On Track')}
            description={t('dashboard:activityDesc', 'Active aerobic target completed today.')}
          />
        </div>
      </section>

      {/* 4. Recent Activity & Empty State */}
      <section className="mb-8" aria-labelledby="recent-activity-heading">
        <h3 id="recent-activity-heading" className="text-lg font-bold text-slate-900 mb-3">
          {t('dashboard:recentAssessments', 'Recent Assessments & Activity')}
        </h3>
        <div
          role="region"
          aria-live="polite"
          className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50"
        >
          <div className="text-3xl mb-3" aria-hidden="true">📋</div>
          <h4 className="text-base font-semibold mb-1 text-slate-800">
            {t('dashboard:noRecent', 'No recent health assessments')}
          </h4>
          <p className="text-sm max-w-sm text-slate-600 mb-4">
            {t('dashboard:promptAssess', 'You have not submitted any recent diagnostic assessments. Complete a risk evaluation to track your progress.')}
          </p>
          <Link
            to="/modules/framingham-risk"
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {t('dashboard:evaluateNow', 'Evaluate Risk Now')}
          </Link>
        </div>
      </section>

      {/* 5. Health Services & Modules */}
      <section aria-labelledby="all-modules-heading">
        <h3 id="all-modules-heading" className="text-lg font-bold text-slate-900 mb-3">
          {t('dashboard:exploreModules', 'Health Services & Modules')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/modules/framingham-risk"
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-400 transition-all"
          >
            <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              FR
            </div>
            <h4 className="font-semibold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
              {t('dashboard:framinghamCardTitle', 'Framingham Risk')}
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {t('dashboard:framinghamCardDesc', 'Calculate 10-year cardiovascular risk scores.')}
            </p>
          </Link>

          <Link
            to="/modules/heart-risk"
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-400 transition-all"
          >
            <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              HR
            </div>
            <h4 className="font-semibold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
              {t('modules:heartRisk', 'Heart Risk')}
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {t('modules:cardioRiskAssessmentDescription', 'Evaluate cardiovascular risk conditions.')}
            </p>
          </Link>

          <Link
            to="/modules/prescription"
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-400 transition-all"
          >
            <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              Rx
            </div>
            <h4 className="font-semibold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
              {t('modules:prescription', 'Prescriptions')}
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {t('modules:medicalDescription', 'Manage and view active medical prescriptions.')}
            </p>
          </Link>

          <Link
            to="/modules/tba"
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-400 transition-all"
          >
            <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              CS
            </div>
            <h4 className="font-semibold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
              {t('modules:tba', 'Consultation')}
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {t('modules:tbaDescription', 'Connect with healthcare professionals.')}
            </p>
          </Link>
        </div>
      </section>
    </PageShell>
  );
};

export default Dashboard;