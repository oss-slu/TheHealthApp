import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import joblib
import numpy as np

# Define the 10 Features 
FEATURE_COLUMNS = [
    'Age', 'Gender', 'High_BP', 'High_Cholesterol',
    'Smoking', 'Family_History', 'Chronic_Stress',
    'Shortness_of_Breath', 'Pain_Arms_Jaw_Back', 'Cold_Sweats_Nausea'
]
TARGET_COLUMN = 'Heart_Risk'

# Load and Prepare Data 
try:
    df = pd.read_csv('heart_risk.csv')
except FileNotFoundError:
    print("Error: 'heart_risk.csv' not found. Please ensure the file is in the project directory.")
    exit()

try:
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
except KeyError as e:
    print(f"Error: One of the required columns is missing from the CSV: {e}")
    exit()

# Split into training+validation (80%) and final test set (20%)
X_train_val, X_test, y_train_val, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Initialize Models and Perform Cross-Validation
rf = RandomForestClassifier(random_state=42)
lr = LogisticRegression(max_iter=1000, random_state=42)

# Perform 5-fold cross-validation on the training+validation set
print("--- Starting 5-Fold Cross-Validation ---")
cv_scores_rf = cross_val_score(rf, X_train_val, y_train_val, cv=5)
cv_scores_lr = cross_val_score(lr, X_train_val, y_train_val, cv=5)

rf_cv_mean = cv_scores_rf.mean()
lr_cv_mean = cv_scores_lr.mean()

print(f"Random Forest CV Accuracy: {rf_cv_mean:.4f} ± {cv_scores_rf.std():.4f}")
print(f"Logistic Regression CV Accuracy: {lr_cv_mean:.4f} ± {cv_scores_lr.std():.4f}")

# Select and Finalize the Best Model 
if rf_cv_mean > lr_cv_mean:
    best_model = rf
    best_model_name = "Random Forest"
    best_model_acc = rf_cv_mean
else:
    best_model = lr
    best_model_name = "Logistic Regression"
    best_model_acc = lr_cv_mean

# Retrain the best model on the ENTIRE training+validation set
best_model.fit(X_train_val, y_train_val)

# Evaluate the final chosen model on the unseen test set
final_test_acc = accuracy_score(y_test, best_model.predict(X_test))

# Save the Best Model and Report 
MODEL_FILENAME = "heart_model.pkl"
joblib.dump(best_model, MODEL_FILENAME)

print("\n--- Final Model Selection and Evaluation ---")
print(f"Best Model Selected (based on CV): {best_model_name}")
print(f"Final Model Test Accuracy (on 20% unseen data): {final_test_acc:.4f}")
print(f"✅ Saved final model ({best_model_name}) to {MODEL_FILENAME}.")