import React from 'react';
<<<<<<< HEAD
import PageShell from '../../components/PageShell';

const TBA = () => {
  return (
    <PageShell title="Support & Assistance">
=======
import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';

const TBA = () => {
  const { t } = useTranslation(['modules']);
  return (
    <PageShell title="modules:tba">
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
      <div className="max-w-4xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
<<<<<<< HEAD
              Get Support
            </h2>
            <p className="text-gray-600">
              Connect with healthcare professionals and get personalized support for your health needs.
=======
              {t('modules:getSupport', 'Get Support')}
            </h2>
            <p className="text-gray-600">
              {t('modules:tbaDescription', 'Connect with healthcare professionals and get personalized support for your health needs.')}
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6">
<<<<<<< HEAD
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat Support</h3>
              <p className="text-gray-600 mb-4">
                Get instant answers to your health questions from our AI assistant.
              </p>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Start Chat
=======
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('modules:chatSupport','Chat Support')}</h3>
              <p className="text-gray-600 mb-4">
                {t('modules:chatDescriptions','Get instant answers to your health questions from our AI assistant.')}
              </p>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                {t('modules:startChat','Start Chat')}
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
              </button>
            </div>
            
            <div className="border rounded-lg p-6">
<<<<<<< HEAD
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Call</h3>
              <p className="text-gray-600 mb-4">
                Schedule a video consultation with a healthcare professional.
              </p>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                Schedule Call
=======
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('modules:videoCall','Video Call')}</h3>
              <p className="text-gray-600 mb-4">
                {t('modules:videoCallDescription', 'Schedule a video consultation with a healthcare professional.')}
              </p>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                {t('modules:scheduleCall', 'Schedule Call')}
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
              </button>
            </div>
          </div>
          
          <div className="mt-8">
<<<<<<< HEAD
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Resources</h3>
            <div className="space-y-2">
              <p className="text-gray-600">
                <strong>Emergency:</strong> Call 911 for immediate medical emergencies
              </p>
              <p className="text-gray-600">
                <strong>National Suicide Prevention Lifeline:</strong> 988
              </p>
              <p className="text-gray-600">
                <strong>Poison Control:</strong> 1-800-222-1222
=======
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('modules:emergencyResources', 'Emergency Resources')}</h3>
            <div className="space-y-2">
              <p className="text-gray-600">
                <strong>{t('modules:emergency', 'Emergency')}:</strong> {t('modules:call911', 'Call 911 for immediate medical emergencies')}
              </p>
              <p className="text-gray-600">
                <strong>{t('modules:nationalSuicidePreventionLifeline', 'National Suicide Prevention Lifeline')}:</strong> 988
              </p>
              <p className="text-gray-600">
                <strong>{t('modules:poisonControl', 'Poison Control')}:</strong> 1-800-222-1222
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default TBA;
