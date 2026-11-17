export const SUPPORTED_COUNTRY_CODES = [
  { code: '+1', country: 'US', min: 10, max: 10 },
  { code: '+34', country: 'ES', min: 9, max: 9 },
  { code: '+91', country: 'IN', min: 10, max: 10 },
  { code: '+86', country: 'CN', min: 11, max: 11 },
  { code: '+971', country: 'AE', min: 9, max: 9 },
];

export const COUNTRY_PHONE_RULES = SUPPORTED_COUNTRY_CODES.reduce((acc, curr) => {
  acc[curr.code] = { min: curr.min, max: curr.max, country: curr.country };
  return acc;
}, {});

// Sorted by prefix length descending to match longer prefixes first (e.g. +971 before single-digit prefixes)
export const SORTED_COUNTRY_PREFIXES = [...SUPPORTED_COUNTRY_CODES]
  .sort((a, b) => b.code.length - a.code.length)
  .map((c) => c.code);

/**
 * Parses, validates, and normalizes phone numbers.
 *
 * Supports:
 * - Local numbers with formatting characters (using the selected country code)
 * - Complete pasted E.164 international numbers starting with '+'
 * - Automatic prefix detection and validation against national lengths
 * - Safe fallback E.164 validation (10-15 digits) for unsupported international numbers
 *
 * @param {string} input - The phone number string input by the user.
 * @param {string} selectedCountryCode - Currently selected country code (e.g. '+1').
 * @returns {{
 *   isValid: boolean,
 *   canonical: string,
 *   countryCode: string,
 *   localDigits: string,
 *   isInternational: boolean,
 *   matchedSupportedCountry: boolean
 * }}
 */
export function parsePhoneNumber(input, selectedCountryCode = '+1') {
  if (typeof input !== 'string') {
    return {
      isValid: false,
      canonical: '',
      countryCode: selectedCountryCode,
      localDigits: '',
      isInternational: false,
      matchedSupportedCountry: false,
    };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return {
      isValid: false,
      canonical: '',
      countryCode: selectedCountryCode,
      localDigits: '',
      isInternational: false,
      matchedSupportedCountry: false,
    };
  }

  const isInternational = trimmed.startsWith('+');

  if (isInternational) {
    // Strip non-digits from the body after the initial '+'
    const cleanDigits = trimmed.slice(1).replace(/\D/g, '');
    const canonicalCandidate = `+${cleanDigits}`;

    // Find if it matches one of our supported country prefixes
    const matchedPrefix = SORTED_COUNTRY_PREFIXES.find((prefix) =>
      canonicalCandidate.startsWith(prefix)
    );

    if (matchedPrefix) {
      const localDigits = cleanDigits.slice(matchedPrefix.length - 1);
      const rule = COUNTRY_PHONE_RULES[matchedPrefix];
      const isValid = localDigits.length >= rule.min && localDigits.length <= rule.max;

      return {
        isValid,
        canonical: canonicalCandidate,
        countryCode: matchedPrefix,
        localDigits,
        isInternational: true,
        matchedSupportedCountry: true,
      };
    }

    // International number with unsupported prefix:
    // Safe standard E.164 rule: total digits between 10 and 15
    const isValid = cleanDigits.length >= 10 && cleanDigits.length <= 15;
    return {
      isValid,
      canonical: canonicalCandidate,
      countryCode: selectedCountryCode,
      localDigits: cleanDigits,
      isInternational: true,
      matchedSupportedCountry: false,
    };
  }

  // Local phone number:
  const localDigits = trimmed.replace(/\D/g, '');
  const activeRule = COUNTRY_PHONE_RULES[selectedCountryCode] || { min: 10, max: 10 };
  const isValid = localDigits.length >= activeRule.min && localDigits.length <= activeRule.max;
  const canonical = `${selectedCountryCode}${localDigits}`;

  return {
    isValid,
    canonical,
    countryCode: selectedCountryCode,
    localDigits,
    isInternational: false,
    matchedSupportedCountry: true,
  };
}
