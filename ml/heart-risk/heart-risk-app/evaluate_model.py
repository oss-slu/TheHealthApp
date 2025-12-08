import pandas as pd
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_curve, auc, classification_report, confusion_matrix
import matplotlib.pyplot as plt

# --- 1. Define the 10 Features (Must match train_model.py) ---
MODEL_FEATURE_COLUMNS = [
    'Age', 'Gender', 'High_BP', 'High_Cholesterol',
    'Smoking', 'Family_History', 'Chronic_Stress',
    'Shortness_of_Breath', 'Pain_Arms_Jaw_Back', 'Cold_Sweats_Nausea'
]
TARGET_COLUMN = 'Heart_Risk'

# --- 2. Load Data and Model ---
try:
    # Load the trained model
    model = joblib.load("heart_model.pkl")
    # Load the dataset
    df = pd.read_csv("heart_risk.csv")
except FileNotFoundError as e:
    print(f"Error: Required file not found: {e}")
    exit()

# Select only the 10 features the model was trained on
X = df[MODEL_FEATURE_COLUMNS]
y = df[TARGET_COLUMN]

# --- 3. Prepare Test Data (Must match the split ratio from training) ---
# NOTE: Using the same test_size=0.2 and random_state=42 as in train_model.py
X_train_val, X_test, y_train_val, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# --- 4. Evaluate Model Performance ---
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

# Print key metrics
print("\n--- Model Evaluation Report (on 20% Test Data) ---")
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['No Risk (0)', 'High Risk (1)']))
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))


# --- 5. Plot ROC Curve (as requested in original project file) ---
fpr, tpr, thresholds = roc_curve(y_test, y_proba)
roc_auc = auc(fpr, tpr)

plt.figure()
plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:.4f})')
plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('Receiver Operating Characteristic (ROC) Curve')
plt.legend(loc="lower right")
plt.savefig('roc_curve.png')
plt.close()

print("✅ Saved ROC curve to roc_curve.png")