const HEALTH_STATUS_CLASSES = {
  good: 'border-health-good bg-health-good/10 text-emerald-950',
  warning: 'border-health-warning bg-health-warning/10 text-amber-950',
  critical: 'border-health-critical bg-health-critical/10 text-red-950',
  neutral: 'border-slate-400 bg-slate-100 text-slate-800',
};

export function getHealthStatusClasses(status) {
  return HEALTH_STATUS_CLASSES[status] || HEALTH_STATUS_CLASSES.neutral;
}
