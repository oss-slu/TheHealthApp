import React from 'react';

import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';

const NotFound = () => {

  return (
    <PageShell title="Page Not Found">
      <div className="text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </PageShell>
  );
};

export default NotFound;
