import React from 'react';
import PageShell from '../../components/PageShell';

const TBA = () => {
  return (
    <PageShell title="Support & Assistance">
      <div className="max-w-4xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Get Support
            </h2>
            <p className="text-gray-600">
              Connect with healthcare professionals and get personalized support for your health needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat Support</h3>
              <p className="text-gray-600 mb-4">
                Get instant answers to your health questions from our AI assistant.
              </p>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Start Chat
              </button>
            </div>
            
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Call</h3>
              <p className="text-gray-600 mb-4">
                Schedule a video consultation with a healthcare professional.
              </p>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                Schedule Call
              </button>
            </div>
          </div>
          
          <div className="mt-8">
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
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default TBA;
