import React from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';

const Home = () => {
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
            </p>
            <Link
              to="/modules/heart-risk"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Start Assessment
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Prescription Management</h3>
            <p className="text-gray-600 mb-4">
              Keep track of your medications and get reminders.
            </p>
            <Link
              to="/modules/prescription"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Manage Prescriptions
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Get Support</h3>
            <p className="text-gray-600 mb-4">
              Connect with healthcare professionals for personalized support.
            </p>
            <Link
              to="/modules/tba"
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Get Support
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Home;
