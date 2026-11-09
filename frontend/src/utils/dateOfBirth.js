const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseDateOfBirth = (value) => {
  if (typeof value !== 'string') return null;

  const match = DATE_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  // Date.UTC normalizes invalid dates (for example, February 31). Reject them.
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
};

const datePartsFor = (value) => ({
  year: value.getFullYear(),
  month: value.getMonth() + 1,
  day: value.getDate(),
});

export const ageFromDateOfBirth = (dateOfBirth, today = new Date()) => {
  const birth = parseDateOfBirth(dateOfBirth);
  if (!birth || Number.isNaN(today.getTime())) return null;

  const current = datePartsFor(today);
  if (
    birth.year > current.year ||
    (birth.year === current.year && birth.month > current.month) ||
    (birth.year === current.year && birth.month === current.month && birth.day > current.day)
  ) {
    return null;
  }

  return current.year - birth.year - (
    current.month < birth.month ||
    (current.month === birth.month && current.day < birth.day)
  );
};

export const isValidDateOfBirth = (dateOfBirth, today = new Date()) => {
  const age = ageFromDateOfBirth(dateOfBirth, today);
  return age !== null && age >= 13 && age <= 120;
};

export const formatDateForInput = (value = new Date()) => {
  const { year, month, day } = datePartsFor(value);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};
