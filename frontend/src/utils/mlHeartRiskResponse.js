/**
 * Normalizes ML heart-risk API JSON. Returns null if the payload is empty or missing a risk level.
 */
export function parseMlHeartRiskResponse(data) {
  if (!data || typeof data !== 'object') return null;

  const riskLevel = data.risk_level;
  if (riskLevel == null || String(riskLevel).trim() === '') {
    return null;
  }

  const tips = data.personalized_tips;
  const safeTips = Array.isArray(tips)
    ? tips.filter(
        (tip) =>
          tip &&
          typeof tip === 'object' &&
          typeof tip.title === 'string' &&
          Array.isArray(tip.points) &&
          tip.points.every((p) => typeof p === 'string'),
      )
    : [];

  const general = data.general_tips;
  const safeGeneral = Array.isArray(general) ? general.filter((x) => typeof x === 'string') : [];

  return {
    risk_level: String(riskLevel),
    advice: typeof data.advice === 'string' ? data.advice : '',
    probability: typeof data.probability === 'number' && Number.isFinite(data.probability) ? data.probability : undefined,
    urgent_warning: typeof data.urgent_warning === 'string' ? data.urgent_warning : '',
    personalized_tips: safeTips,
    general_tips: safeGeneral,
  };
}
