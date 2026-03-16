# 🏠 Hostel Student Risk Prediction System

## 📌 Overview

This project implements a **Student Risk Prediction System** using structured behavioral, incident, complaint, wellbeing, and environmental data.

The system:

1. Generates a structured **risk score**
2. Converts it into a **risk level (Low / Medium / High)**
3. Trains an **XGBoost multi-class classifier**
4. Predicts which students are at risk
5. Outputs risk probabilities for escalation decisions

---

## 🧠 System Flow

Raw Student Signals
↓
Feature Engineering
↓
Risk Score Generation
↓
Risk Level Labeling
↓
XGBoost Model Training
↓
Prediction & Probability Output
↓
Escalation Decision


---

## 📂 Input Features

The model uses the following student-level features:

### 👤 Profile Features
- year  
- days_in_hostel  
- past_escalation_count  

### 🔴 Behavior Features
- behavior_count_7d  
- behavior_count_30d  
- severe_behavior_count_30d  
- behavior_weighted_score_30d  
- days_since_last_behavior  

### 🟠 Incident Features
- incident_count_30d  
- severe_incident_count_30d  
- incident_trend_slope  

### 🟡 Complaint Features
- complaint_count_30d  
- high_severity_complaint_count_30d  
- complaint_growth_rate  

### 🟢 Wellbeing Features
- avg_stress_4weeks  
- stress_trend_slope  
- mood_instability_score  
- missed_survey_count  

### 🏢 Environmental Features
- block_risk_score  
- floor_risk_score  
- room_risk_score  
- roommate_avg_risk_score  

---

## 🔢 Step 1 — Risk Score Generation

Since no historical risk labels were available, a rule-based risk score is generated using weighted feature contributions.

Example concept:

risk_score =
severe_behavior_count_30d * weight

behavior_weighted_score_30d * weight

incident_count_30d * weight

complaint_count_30d * weight

avg_stress_4weeks * weight

environmental risk scores


This score represents cumulative behavioral and environmental risk exposure.

---

## 🏷 Step 2 — Risk Level Assignment

The continuous `risk_score` is converted into categories:

- Low Risk
- Medium Risk
- High Risk

Thresholds are determined using quantiles for balanced distribution.

---

## 🤖 Step 3 — Model Training (XGBoost)

The labeled dataset is used to train a multi-class XGBoost classifier.

### Objective

Features → Risk Level (Low / Medium / High)


### Model Configuration

- Objective: `multi:softprob`
- Number of classes: 3
- Gradient boosting decision trees
- Evaluation using precision, recall, and F1-score

The trained model is saved as:

xgboost_model.pkl


---

## 📊 Step 4 — Model Evaluation

Evaluation metrics include:

- Accuracy
- Precision
- Recall
- F1-score
- Confusion Matrix

Observed performance:

- ~91% accuracy
- Balanced classification across all classes
- No severe misclassification (High predicted as Low)

---

## 🔮 Step 5 — Risk Prediction

During prediction:

1. Load `xgboost_model.pkl`
2. Provide student feature values
3. Call:

model.predict()
model.predict_proba()


### Output

Predicted Class: 0 / 1 / 2
Probabilities: [Low, Medium, High]


Where:

- 0 = Low Risk
- 1 = Medium Risk
- 2 = High Risk

---

## 🚨 Escalation Logic

Risk probabilities are used for decision-making.

Example:

If High Probability > 0.75 → High Risk
If 0.40 – 0.75 → Medium Risk
Else → Low Risk


High-risk students may trigger:

- RISK_TICKET generation
- Warden notification
- Monitoring logs

---

## 🧠 What XGBoost Is Doing

Because risk labels were generated from a rule-based formula, XGBoost:

- Learns to approximate the formula
- Captures non-linear relationships
- Learns feature interactions
- Smooths rigid thresholds
- Produces probabilistic outputs

This transitions the system from fixed rules to adaptive machine learning.

---

## 🔁 Future Improvements

The system can be extended by:

- Using real historical escalation outcomes as labels
- Adding time-series modeling
- Integrating SHAP explainability
- Deploying as a REST API
- Automating daily batch scoring

---

## 📌 Current System Status

✔ Feature engineering complete  
✔ Risk scoring implemented  
✔ XGBoost model trained  
✔ Model evaluated and validated  
✔ Prediction pipeline working  
✔ Model artifact saved  

---

## 🎯 Conclusion

This project implements a structured, explainable, and scalable student risk prediction system using engineered behavioral and environmental signals combined with gradient boosting.

It provides a strong foundation that can evolve into a fully data-driven predictive safety system.