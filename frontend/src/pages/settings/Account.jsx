import React, { useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';
import { useUser } from '../../UserContext';
import apiClient from '../../apiClient';

const Account = () => {
  const { t } = useTranslation(['common']);
  const { user, refresh } = useUser() || {};
  const inputRef = useRef(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) return t('auth:photo') + ': Only PNG, JPEG or WEBP allowed.';
    if (file.size > maxSize) return 'File is too large. Maximum allowed size is 5MB.';
    return null;
  };

  const onFile = async (e) => {
    setErr(null);
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const v = validateFile(file);
    if (v) { setErr(v); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      await apiClient.updateCurrentUser(fd);
      await refresh();
    } catch (error) {
      setErr(error?.body?.message || error.message || 'Upload failed');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };
  return (
    <PageShell title="common:accountSettings">
      <div className="max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t("common:profileInformation",'Profile Information')}</h3>
          <div className="flex items-center space-x-4 mb-4">
            {user && user.photo ? (
              <img src={user.photo} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">U</div>
            )}
            <div>
              <button onClick={() => inputRef.current?.click()} className="px-3 py-1 border rounded text-sm bg-white">{t('auth:photo','Photo')}</button>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              {loading && <div className="text-xs text-gray-500">Updating...</div>}
              {err && <div className="text-xs text-red-600">{err}</div>}
            </div>
          </div>
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
