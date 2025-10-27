import { toast } from 'react-hot-toast';
import i18n from '../i18n';

const resolveMessage = (key, fallback) => {
  if (!key) return fallback;
  const translated = i18n.t(key);
  if (translated === key && fallback) return fallback;
  return translated;
};

export const showErrorToast = (key, fallback) => {
  toast.error(resolveMessage(key, fallback ?? i18n.t('errors.generic', 'Something went wrong.')));
};

export const showSuccessToast = (key, fallback) => {
  toast.success(resolveMessage(key, fallback ?? i18n.t('common:success', 'Success')));
};
