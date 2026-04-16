/**
 * Validates the backend HealthRiskOutput shape (see backend HealthRiskOutput / SuccessResponse).
 * Returns a normalized object or null — never fabricates or guesses missing values.
 */
export function parseHealthRiskAssessment(data) {
  if (!data || typeof data !== 'object') return null;

  const riskScore = Number(data.risk_score);
  if (!Number.isFinite(riskScore) || riskScore < 0 || riskScore > 100) return null;

  const cat = data.risk_category;
  if (cat == null || String(cat).trim() === '') return null;

  if (typeof data.risk_category_description !== 'string') return null;

  const fb = data.factor_breakdown;
  if (!fb || typeof fb !== 'object') return null;

  const factors = [
    'age_factor',
    'cholesterol_factor',
    'blood_pressure_factor',
    'smoking_factor',
    'diabetes_factor',
  ];
  const normalizedBreakdown = {};
  for (const key of factors) {
    const n = Number(fb[key]);
    if (!Number.isFinite(n)) return null;
    normalizedBreakdown[key] = n;
  }

  if (!Array.isArray(data.recommendations)) return null;
  if (!data.recommendations.every((item) => typeof item === 'string')) return null;

  if (typeof data.disclaimer !== 'string') return null;

  return {
    risk_score: riskScore,
    risk_category: cat,
    risk_category_description: data.risk_category_description,
    factor_breakdown: normalizedBreakdown,
    recommendations: data.recommendations,
    disclaimer: data.disclaimer,
  };
}
