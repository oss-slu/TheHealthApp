"""
Health Risk Calculator Module

Implements a simplified Framingham Risk Score calculation for 10-year
cardiovascular disease risk estimation. This is a rule-based model
that considers key risk factors.

Reference: Wilson et al., "Prediction of Coronary Heart Disease Using 
Risk Factor Categories" Circulation. 1998;97:1837-1847
"""

import math
from typing import Tuple

from .models import (
    GenderEnum,
    BloodPressureTreatmentEnum,
    SmokingStatusEnum,
    DiabetesStatusEnum,
    RiskCategoryEnum,
    HealthRiskInput,
    HealthRiskOutput,
    RiskFactorBreakdown,
)


# Framingham coefficient tables (calibrated for realistic 10-year CVD risk)
# Based on simplified Framingham Risk Score methodology
# Target risk ranges:
# - 30yo, normal values: ~1-2% risk
# - 50yo male, normal values: ~5-8% risk
# - 55yo male, smoker with high cholesterol/BP: ~20-25% risk
# - 65yo with diabetes and multiple risk factors: ~30-40% risk

MALE_COEFFICIENTS = {
    "age_base": 30,
    "age_coefficient": 0.4,
    "cholesterol_ratio_base": 3.5,
    "cholesterol_ratio_coefficient": 2.0,
    "sbp_base": 110,
    "sbp_coefficient": 0.15,
    "sbp_treatment_multiplier": 1.3,
    "smoking_current": 6.0,
    "smoking_former": 1.5,
    "diabetes_yes": 5.0,
    "diabetes_pre": 2.0,
    "baseline_risk": 1.0,
}

FEMALE_COEFFICIENTS = {
    "age_base": 30,
    "age_coefficient": 0.3,
    "cholesterol_ratio_base": 3.5,
    "cholesterol_ratio_coefficient": 1.8,
    "sbp_base": 110,
    "sbp_coefficient": 0.12,
    "sbp_treatment_multiplier": 1.3,
    "smoking_current": 5.0,
    "smoking_former": 1.2,
    "diabetes_yes": 6.0,
    "diabetes_pre": 2.5,
    "baseline_risk": 0.5,
}

RISK_CATEGORY_THRESHOLDS = {
    "low": (0, 10),
    "moderate": (10, 20),
    "high": (20, 30),
    "very_high": (30, 100),
}

RISK_CATEGORY_DESCRIPTIONS = {
    RiskCategoryEnum.low: "Low risk - Your cardiovascular risk factors are well-controlled.",
    RiskCategoryEnum.moderate: "Moderate risk - Some risk factors need attention. Consider lifestyle modifications.",
    RiskCategoryEnum.high: "High risk - Multiple significant risk factors present. Medical consultation recommended.",
    RiskCategoryEnum.very_high: "Very high risk - Urgent medical attention recommended. Please consult a healthcare provider.",
}


def _calculate_age_factor(age: int, coefficients: dict) -> float:
    """
    Calculate age contribution to risk score.
    Risk increases exponentially with age above baseline.
    """
    age_diff = age - coefficients["age_base"]
    return max(0, age_diff * coefficients["age_coefficient"])


def _calculate_cholesterol_factor(
    total_chol: float, 
    hdl_chol: float, 
    coefficients: dict
) -> float:
    """
    Calculate cholesterol contribution to risk score.
    Uses total/HDL ratio - higher ratio = higher risk.
    """
    ratio = total_chol / hdl_chol
    ratio_diff = ratio - coefficients["cholesterol_ratio_base"]
    return max(0, ratio_diff * coefficients["cholesterol_ratio_coefficient"])


def _calculate_bp_factor(
    sbp: int, 
    on_treatment: bool, 
    coefficients: dict
) -> float:
    """
    Calculate blood pressure contribution to risk score.
    Being on treatment adds additional risk multiplier.
    """
    bp_diff = sbp - coefficients["sbp_base"]
    base_factor = max(0, bp_diff * coefficients["sbp_coefficient"])
    
    if on_treatment:
        return base_factor * coefficients["sbp_treatment_multiplier"]
    return base_factor


def _calculate_smoking_factor(
    smoking_status: SmokingStatusEnum, 
    coefficients: dict
) -> float:
    """Calculate smoking contribution to risk score."""
    if smoking_status == SmokingStatusEnum.current:
        return coefficients["smoking_current"]
    elif smoking_status == SmokingStatusEnum.former:
        return coefficients["smoking_former"]
    return 0.0


def _calculate_diabetes_factor(
    diabetes_status: DiabetesStatusEnum, 
    coefficients: dict
) -> float:
    """Calculate diabetes contribution to risk score."""
    if diabetes_status == DiabetesStatusEnum.yes:
        return coefficients["diabetes_yes"]
    elif diabetes_status == DiabetesStatusEnum.prediabetes:
        return coefficients["diabetes_pre"]
    return 0.0


def _get_risk_category(risk_score: float) -> RiskCategoryEnum:
    """Determine risk category based on score."""
    if risk_score < RISK_CATEGORY_THRESHOLDS["low"][1]:
        return RiskCategoryEnum.low
    elif risk_score < RISK_CATEGORY_THRESHOLDS["moderate"][1]:
        return RiskCategoryEnum.moderate
    elif risk_score < RISK_CATEGORY_THRESHOLDS["high"][1]:
        return RiskCategoryEnum.high
    return RiskCategoryEnum.very_high


def _generate_recommendations(
    input_data: HealthRiskInput,
    factor_breakdown: RiskFactorBreakdown
) -> list[str]:
    """Generate personalized recommendations based on risk factors."""
    recommendations = []
    
    # Cholesterol recommendations
    cholesterol_ratio = input_data.total_cholesterol / input_data.hdl_cholesterol
    if cholesterol_ratio > 5:
        recommendations.append(
            "Your cholesterol ratio is elevated. Consider dietary changes such as "
            "reducing saturated fats and increasing fiber intake."
        )
    elif cholesterol_ratio > 4:
        recommendations.append(
            "Your cholesterol levels could be improved. Focus on heart-healthy foods "
            "like fish, nuts, and olive oil."
        )
    
    # Blood pressure recommendations
    if input_data.systolic_blood_pressure >= 140:
        recommendations.append(
            "Your blood pressure is elevated. Regular monitoring, reducing sodium intake, "
            "and stress management can help."
        )
    elif input_data.systolic_blood_pressure >= 130:
        recommendations.append(
            "Your blood pressure is slightly elevated. Consider lifestyle modifications "
            "such as regular exercise and limiting alcohol."
        )
    
    # Smoking recommendations
    if input_data.smoking_status == SmokingStatusEnum.current:
        recommendations.append(
            "Smoking significantly increases cardiovascular risk. Quitting smoking "
            "is one of the most impactful changes you can make for your heart health."
        )
    elif input_data.smoking_status == SmokingStatusEnum.former:
        recommendations.append(
            "Great job quitting smoking! Your cardiovascular risk continues to decrease "
            "over time. Stay smoke-free for continued benefits."
        )
    
    # Diabetes recommendations
    if input_data.diabetes_status == DiabetesStatusEnum.yes:
        recommendations.append(
            "Managing diabetes is crucial for heart health. Work with your healthcare "
            "provider to maintain good blood sugar control."
        )
    elif input_data.diabetes_status == DiabetesStatusEnum.prediabetes:
        recommendations.append(
            "Prediabetes can often be reversed with lifestyle changes. Focus on weight "
            "management, regular physical activity, and a balanced diet."
        )
    
    # Age-based recommendations
    if input_data.age >= 50:
        recommendations.append(
            "Regular cardiovascular check-ups become increasingly important with age. "
            "Discuss screening schedules with your healthcare provider."
        )
    
    # General recommendations if risk is elevated
    if len(recommendations) == 0:
        recommendations.append(
            "Maintain your healthy lifestyle! Regular exercise, a balanced diet, "
            "and avoiding tobacco help keep your cardiovascular risk low."
        )
    
    # Always add exercise recommendation if not already covered
    if not any("exercise" in r.lower() for r in recommendations):
        recommendations.append(
            "Aim for at least 150 minutes of moderate aerobic activity or "
            "75 minutes of vigorous activity per week."
        )
    
    return recommendations


def calculate_health_risk(input_data: HealthRiskInput) -> HealthRiskOutput:
    """
    Calculate 10-year cardiovascular disease risk using a simplified
    Framingham Risk Score model.
    
    Args:
        input_data: Validated health risk input parameters
        
    Returns:
        HealthRiskOutput with risk score, category, breakdown, and recommendations
    """
    # Select coefficients based on gender
    coefficients = (
        MALE_COEFFICIENTS 
        if input_data.gender == GenderEnum.male 
        else FEMALE_COEFFICIENTS
    )
    
    # Calculate individual risk factors (additive percentage contributions)
    age_factor = _calculate_age_factor(input_data.age, coefficients)
    
    cholesterol_factor = _calculate_cholesterol_factor(
        input_data.total_cholesterol,
        input_data.hdl_cholesterol,
        coefficients
    )
    
    on_treatment = input_data.blood_pressure_treatment == BloodPressureTreatmentEnum.yes
    bp_factor = _calculate_bp_factor(
        input_data.systolic_blood_pressure,
        on_treatment,
        coefficients
    )
    
    smoking_factor = _calculate_smoking_factor(
        input_data.smoking_status, 
        coefficients
    )
    
    diabetes_factor = _calculate_diabetes_factor(
        input_data.diabetes_status, 
        coefficients
    )
    
    # Calculate total risk score as sum of factors plus baseline
    # Each factor contributes directly to percentage risk
    raw_risk = (
        coefficients["baseline_risk"] +
        age_factor +
        cholesterol_factor +
        bp_factor +
        smoking_factor +
        diabetes_factor
    )
    
    # Apply multiplicative effects for combined risk factors
    # Multiple risk factors compound the risk
    num_major_risk_factors = sum([
        smoking_factor > 0,
        diabetes_factor > 0.3,
        cholesterol_factor > 0.3,
        bp_factor > 0.3,
    ])
    
    if num_major_risk_factors >= 3:
        raw_risk *= 1.3
    elif num_major_risk_factors >= 2:
        raw_risk *= 1.15
    
    # Convert to final percentage and clamp
    risk_score = round(raw_risk, 1)
    risk_score = max(0.5, min(95.0, risk_score))
    
    # Determine category
    risk_category = _get_risk_category(risk_score)
    
    # Create factor breakdown (normalized for display as percentages)
    total_factor = age_factor + cholesterol_factor + bp_factor + smoking_factor + diabetes_factor
    if total_factor <= 0:
        total_factor = 1  # Prevent division by zero
        
    factor_breakdown = RiskFactorBreakdown(
        age_factor=round(max(0, age_factor / total_factor * 100), 1),
        cholesterol_factor=round(max(0, cholesterol_factor / total_factor * 100), 1),
        blood_pressure_factor=round(max(0, bp_factor / total_factor * 100), 1),
        smoking_factor=round(max(0, smoking_factor / total_factor * 100), 1),
        diabetes_factor=round(max(0, diabetes_factor / total_factor * 100), 1),
    )
    
    # Generate recommendations
    recommendations = _generate_recommendations(input_data, factor_breakdown)
    
    return HealthRiskOutput(
        risk_score=risk_score,
        risk_category=risk_category,
        risk_category_description=RISK_CATEGORY_DESCRIPTIONS[risk_category],
        factor_breakdown=factor_breakdown,
        recommendations=recommendations,
    )
