from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
from typing import List, Dict, Any

# --- 1. CONFIGURATION ---

# The 10 features the model was trained 
MODEL_FEATURE_COLUMNS = [
    'Age', 'Gender', 'High_BP', 'High_Cholesterol',
    'Smoking', 'Family_History', 'Chronic_Stress',
    'Shortness_of_Breath', 'Pain_Arms_Jaw_Back', 'Cold_Sweats_Nausea'
]

# --- 2. MODEL AND DATA LOADING ---
app = FastAPI(title="Heart Risk API", description="Provides Heart Risk Prediction and Personalized Tips")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


try:
    clf = joblib.load("heart_model.pkl")
except FileNotFoundError:
    print("FATAL ERROR: heart_model.pkl not found. Run train_model.py first.")
    clf = None

# --- 3. PYDANTIC MODELS (Data Validation) ---
class HeartRiskInput(BaseModel):
    Age: float
    Gender: int
    High_BP: int
    High_Cholesterol: int
    Smoking: int
    Family_History: int
    Chronic_Stress: int
    Shortness_of_Breath: int
    Pain_Arms_Jaw_Back: int
    Cold_Sweats_Nausea: int

class TipCategory(BaseModel):
    title: str
    points: List[str]

class PredictionResponse(BaseModel):
    risk_level: str
    advice: str
    probability: float
    urgent_warning: str
    personalized_tips: List[TipCategory]
    general_tips: List[str]

# --- 4. HELPER FUNCTIONS --- 
def generate_personalized_tips(mapped_inputs: List[float], risk_level: str) -> Dict[str, Any]:
    
    input_dict = dict(zip(MODEL_FEATURE_COLUMNS, mapped_inputs))
    tips_output = {
        "urgent_warning": "",
        "personalized_tips": [],
        "general_tips": []
    }
    
    # --- P1: ACUTE WARNINGS (Highest Priority) ---
    has_acute_symptoms = (
        input_dict.get('Shortness_of_Breath') == 1 or 
        input_dict.get('Pain_Arms_Jaw_Back') == 1 or 
        input_dict.get('Cold_Sweats_Nausea') == 1
    )

    if has_acute_symptoms:
        # 1. Check for High Risk + Symptoms (Most Urgent)
        if risk_level == "High Risk":
            tips_output["urgent_warning"] = "URGENT: Symptoms reported with a High Risk profile need immediate medical assessment. Contact a doctor now."
            return tips_output # Return immediately
        
        # 2. Check for Medium Risk + Symptoms (Your new logic)
        elif risk_level == "Medium Risk":
            tips_output["urgent_warning"] = "RECOMMENDED: Symptoms reported need a medical assessment. Please contact a doctor as soon as possible to review your profile."
            return tips_output

    # --- P2: PERSONALIZED TIPS (Your logic) ---
    if input_dict.get('Smoking') == 1:
        tips_output["personalized_tips"].append({
            "title": "QUIT SMOKING",
            "points": [
                "1. Drink more water to flush toxins.",
                "2. Add vitamin C daily to support your lungs."
            ]
        })
        
    if input_dict.get('High_BP') == 1:
        tips_output["personalized_tips"].append({
            "title": "BLOOD PRESSURE MANAGEMENT",
            "points": [
                "1. Cut down salt to help lower pressure.",
                "2. Check your BP regularly to stay on track."
            ]
        })
    
    if input_dict.get('High_Cholesterol') == 1:
        tips_output["personalized_tips"].append({
            "title": "CHOLESTEROL MANAGEMENT",
            "points": [
                "1. Eat more fiber (oats, fruits) to reduce bad fats.",
                "2. Avoid fried foods to keep levels stable."
            ]
        })
    
    if input_dict.get('Chronic_Stress') == 1:
        tips_output["personalized_tips"].append({
            "title": "MENTAL HEALTH",
            "points": [
                "1. Dedicate time daily for relaxation, mindfulness, or deep breathing.",
                "2. Ensure you get 7-9 hours of quality sleep daily."
            ]
        })

    if input_dict.get('Family_History') == 1:
        tips_output["personalized_tips"].append({
            "title": "FAMILY HISTORY",
            "points": [
                "1. Get routine checkups to catch issues early.",
                "2. Maintain a healthy weight to reduce risk."
            ]
        })

    # --- P3: GENERAL/FALLBACK TIPS ---
    if not tips_output["personalized_tips"]: 
        if risk_level == "Low Risk":
            tips_output["general_tips"].append("Maintain your healthy profile by aiming for at least 150 minutes of weekly activity.")
            tips_output["general_tips"].append("Continue eating a balanced diet low in processed foods and added sugars.")
        else:
            tips_output["general_tips"].append("Schedule a full check-up with a healthcare provider to identify unseen risk factors.")
            tips_output["general_tips"].append("Aim for at least 30 minutes of moderate activity (like brisk walking) most days of the week.")
    else:
        tips_output["general_tips"].append("Walk 30 minutes daily or aim for 150 minutes of moderate activity per week.")

    return tips_output


# --- 5. API PREDICTION ENDPOINT ---

@app.post("/predict", response_model=PredictionResponse)
def predict_risk(data: HeartRiskInput):
    """
    Receives 10 inputs, runs prediction, and returns a JSON response
    with risk level and structured, personalized health tips.
    """
    if clf is None:
        return {"error": "Model not loaded"} 

    mapped_inputs = [data.dict()[feature] for feature in MODEL_FEATURE_COLUMNS]
    df_pred = pd.DataFrame([mapped_inputs], columns=MODEL_FEATURE_COLUMNS)
    proba_of_risk = clf.predict_proba(df_pred)[0][1]


    
    if proba_of_risk < 0.20:
        risk_level = "Low Risk"
        advice = "Your overall risk profile is low. Great job! Review your personalized tips for maintenance."
    elif proba_of_risk < 0.50:
        risk_level = "Medium Risk"
        advice = "Your overall risk profile is medium. This indicates some risk factors should be addressed. We recommend reviewing your tips and scheduling a professional assessment with your doctor."
    else:
        risk_level = "High Risk"
        advice = "Your overall risk profile is high. Please seek immediate medical advice or consult a doctor."

    # 5. Generate Personalized Tips based on input profile
    tips_data = generate_personalized_tips(mapped_inputs, risk_level)

    # 6. Return the full structured JSON response
    return {
        "risk_level": risk_level,
        "advice": advice,
        "probability": proba_of_risk,
        "urgent_warning": tips_data["urgent_warning"],
        "personalized_tips": tips_data["personalized_tips"],
        "general_tips": tips_data["general_tips"]
    }


# ----- Code to serve  Frontend UI -----
app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
async def read_index():
    return FileResponse('frontend/index.html')