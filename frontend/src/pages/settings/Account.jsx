import React from 'react';
<<<<<<< HEAD
import PageShell from '../../components/PageShell';

const Account = () => {
  return (
    <PageShell title="Account Settings">
      <div className="max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
=======
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
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
                </label>
                <input
                  type="text"
                  id="firstName"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
<<<<<<< HEAD
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
=======
                <label htmlFor="commom:lastName" className="block text-sm font-medium text-gray-700">
                  {t('common:lastName', 'Last Name')}
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
                </label>
                <input
                  type="text"
                  id="lastName"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
<<<<<<< HEAD
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
=======
              <label htmlFor="commom:email" className="block text-sm font-medium text-gray-700">
                {t('common:email', 'Email')}
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
<<<<<<< HEAD
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
=======
              <label htmlFor="commom:phone" className="block text-sm font-medium text-gray-700">
                {t('common:phone', 'Phone')}
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
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
<<<<<<< HEAD
                Save Changes
=======
                {t('common:saveChanges', 'Save Changes')}
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default Account;
