export const usernameRegex = /^[A-Za-z][A-Za-z0-9._]{2,19}$/;
// Password must contain uppercase letter, digit, minimum 8 characters
export const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export const hasConsecutiveSpecialChars = (value) => /[._]{2}/.test(value);

export const normalizeUsername = (value = '') => value.trim();

export const validateUsername = (value) => {
  const normalized = normalizeUsername(value);
  if (!normalized) {
    return false;
  }
  if (!usernameRegex.test(normalized)) {
    return false;
  }
  if (hasConsecutiveSpecialChars(normalized)) {
    return false;
  }
  return true;
};

export const evaluatePassword = (value = '') => ({
  length: value.length >= 8,
  hasUppercase: /[A-Z]/.test(value),
  hasNumber: /\d/.test(value),
});

export const validatePassword = (value) => {
  if (!value || value.length < 8) {
    return false;
  }
  const checks = evaluatePassword(value);
  return checks.hasUppercase && checks.hasNumber;
};

export const isValidDateOfBirth = (value) => {
  if (!value) return false;
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 13 && age <= 120;
};

export const formatDateForInput = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};
