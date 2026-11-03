/**
 * Semantic health status color mappings and helper
 */
export const HEALTH_STATUS_STYLES = {
  good: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  critical: 'bg-rose-50 text-rose-800 border-rose-200',
  neutral: 'bg-slate-50 text-slate-700 border-slate-200',
};

export const getHealthStatusClass = (status = 'neutral') => {
  return HEALTH_STATUS_STYLES[status] || HEALTH_STATUS_STYLES.neutral;
};