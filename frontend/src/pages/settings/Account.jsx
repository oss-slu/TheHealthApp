import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../hooks/useAuth.js';
import { showSuccessToast } from '../../lib/toast.js';

const Account = () => {
  const { t } = useTranslation(['common', 'auth', 'errors']);
  const { user, updateProfile, uploadProfilePhoto, initializing } = useAuth();
  const [form, setForm] = useState({ name: '', age: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        age: user.age || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const avatarContent = useMemo(() => {
    if (user?.photo_url) {
      return (
        <img
          src={user.photo_url}
          alt={user.name}
          className="h-16 w-16 rounded-full object-cover border"
        />
      );
    }
    const initials = user?.name
      ? user.name
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join('') || '👤'
      : '👤';
    return (
      <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-semibold">
        {initials}
      </div>
    );
  }, [user]);

  const translateError = (error) => {
    if (!error) return null;
    if (error.messageKey) {
      const translated = t(error.messageKey, { defaultValue: error.message });
      return translated || error.message;
    }
    return error.message || t('errors.generic');
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      await updateProfile({
        name: form.name.trim(),
        age: Number(form.age),
        phone: form.phone.trim(),
      });
      showSuccessToast('common:profileUpdated', t('common:profileUpdated', 'Profile updated.'));
    } catch (error) {
      setFormError(translateError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const onPhotoSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError(t('errors.invalidImageType', 'Please select a valid image file.'));
      return;
    }
    if (file.type === 'application/pdf') {
      setPhotoError(t('errors.invalidImageType', 'Please select a valid image file.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError(t('errors.imageTooLarge', 'Image must be smaller than 5MB.'));
      return;
    }

    setPhotoError(null);
    setUploadingPhoto(true);

    try {
      await uploadProfilePhoto(file);
      showSuccessToast('common:photoUpdated', t('common:photoUpdated', 'Profile photo updated.'));
    } catch (error) {
      setPhotoError(translateError(error));
    } finally {
      setUploadingPhoto(false);
      event.target.value = '';
    }
  };

  if (initializing) {
    return (
      <PageShell title="common:accountSettings">
        <div className="flex min-h-[50vh] items-center justify-center text-gray-600">{t('common:loading', 'Loading...')}</div>
      </PageShell>
    );
  }

  return (
    <PageShell title="common:accountSettings">
      <div className="max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <div className="flex items-center space-x-4">
            {avatarContent}
            <div>
              <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.username}</p>
              <label className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPhotoSelected}
                  disabled={uploadingPhoto}
                />
                {uploadingPhoto ? t('common:uploading', 'Uploading...') : t('common:changePhoto', 'Change photo')}
              </label>
              {photoError ? <p className="mt-1 text-xs text-red-600">{photoError}</p> : null}
            </div>
          </div>

          <form className="space-y-6" onSubmit={onSubmit}>
            {formError ? (
              <div className="rounded border border-red-300 bg-red-50 text-red-800 p-3">
                {formError}
              </div>
            ) : null}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t('common:fullName', 'Full name')}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={onChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                  {t('auth:age', 'Age')}
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={form.age}
                  onChange={onChange}
                  min="13"
                  max="120"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  {t('common:phone', 'Phone')}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
                disabled={submitting}
              >
                {submitting ? t('common:saving', 'Saving...') : t('common:saveChanges', 'Save changes')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default Account;
