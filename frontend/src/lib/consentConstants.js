/** Must match backend `CURRENT_CONSENT_VERSION` (backend/src/models.py). */
export const CURRENT_CONSENT_VERSION = 'v1.0';

/** Aligns with backend `user_has_valid_consent` for post-login navigation. */
export function userHasValidHealthConsent(user) {
  if (!user) return false;
  return Boolean(
    user.consent_given &&
      user.data_usage === true &&
      (user.consent_version || '') === CURRENT_CONSENT_VERSION,
  );
}
