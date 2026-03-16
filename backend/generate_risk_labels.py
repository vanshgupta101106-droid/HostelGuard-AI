import pandas as pd
import numpy as np

# Load your feature file
df = pd.read_csv("backend/test_student_data.csv")

# ----------------------------
# 1️⃣ Normalize Key Features
# ----------------------------

# Prevent large scale dominance
features_to_normalize = [
    "behavior_weighted_score_30d",
    "incident_count_30d",
    "complaint_count_30d",
    "avg_stress_4weeks",
    "block_risk_score",
    "room_risk_score"
]

for col in features_to_normalize:
    df[col] = (df[col] - df[col].min()) / (df[col].max() - df[col].min() + 1e-6)

# ----------------------------
# 2️⃣ Risk Score Formula
# ----------------------------

risk_score = (
    df["severe_behavior_count_30d"] * 4 +
    df["behavior_weighted_score_30d"] * 3 +
    df["incident_count_30d"] * 3 +
    df["severe_incident_count_30d"] * 4 +
    df["complaint_count_30d"] * 2 +
    df["avg_stress_4weeks"] * 3 +
    df["stress_trend_slope"] * 2 +
    df["room_risk_score"] * 2 +
    df["block_risk_score"] * 1 +
    df["roommate_avg_risk_score"] * 2 +
    df["past_escalation_count"] * 4
)

df["risk_score"] = risk_score

# ----------------------------
# 3️⃣ Convert to Risk Level
# ----------------------------

# Use quantiles for smart distribution
low_threshold = df["risk_score"].quantile(0.4)
high_threshold = df["risk_score"].quantile(0.75)

def assign_risk(score):
    if score < low_threshold:
        return "Low"
    elif score < high_threshold:
        return "Medium"
    else:
        return "High"

df["risk_level"] = df["risk_score"].apply(assign_risk)

# Save new file
df.to_csv("student_features_with_labels.csv", index=False)

print("Risk labels generated successfully.")
print(df[["student_id", "risk_score", "risk_level"]].head())
