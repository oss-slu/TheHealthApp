import React from 'react';

import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';

const Account = () => {
  const { t } = useTranslation(['common']);
  return (
    <PageShell title="common:accountSettings">
      <div className="max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t("common:profileInformation",'Profile Information')}</h3>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="commom:firstName" className="block text-sm font-medium text-gray-700">
                  {t('common:firstName', 'First Name')}

                </label>
                <input
                  type="text"
                  id="firstName"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>

                <label htmlFor="commom:lastName" className="block text-sm font-medium text-gray-700">
                  {t('common:lastName', 'Last Name')}

                </label>
                <input
                  type="text"
                  id="lastName"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>

              <label htmlFor="commom:email" className="block text-sm font-medium text-gray-700">
                {t('common:email', 'Email')}

              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>

              <label htmlFor="commom:phone" className="block text-sm font-medium text-gray-700">
                {t('common:phone', 'Phone')}

              </label>
              <input
                type="tel"
                id="phone"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >

                {t('common:saveChanges', 'Save Changes')}

              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default Account;
