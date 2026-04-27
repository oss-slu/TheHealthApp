/**
 * Demo mode (VITE_DEMO_MODE) may only be used in non-production builds.
 * Production bundles always behave as if demo mode is off.
 */
export const isDemoMode = () => {
  if (import.meta.env.PROD) return false;
  const v = import.meta.env.VITE_DEMO_MODE;
  return v === '1' || v === 'true';
};

/** Fail fast if a production build was created with demo mode enabled. */
export const assertProductionDemoDisabled = () => {
  if (!import.meta.env.PROD) return;
  const v = import.meta.env.VITE_DEMO_MODE;
  if (v === '1' || v === 'true') {
    throw new Error(
      'VITE_DEMO_MODE must be 0 or unset in production. Rebuild with VITE_DEMO_MODE=0.',
    );
  }
};
