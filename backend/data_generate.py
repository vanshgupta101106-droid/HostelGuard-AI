import pandas as pd
import numpy as np

n = 1000
data = {
    'student_id': [f'S_{1000+i}' for i in range(n)],
    'year': np.random.randint(1, 5, n),
    'days_in_hostel': np.random.randint(30, 1200, n),
    'past_escalation_count': np.random.choice([0, 1, 2, 3, 5], n, p=[0.7, 0.15, 0.08, 0.05, 0.02]),
    'behavior_count_7d': np.random.poisson(0.4, n),
    'behavior_count_30d': np.random.poisson(1.8, n),
    'severe_behavior_count_30d': np.random.choice([0, 1, 2], n, p=[0.9, 0.08, 0.02]),
    'behavior_weighted_score_30d': np.round(np.random.gamma(2, 5, n), 2),
    'days_since_last_behavior': np.random.randint(0, 90, n),
    'incident_count_30d': np.random.poisson(0.5, n),
    'severe_incident_count_30d': np.random.choice([0, 1], n, p=[0.95, 0.05]),
    'incident_trend_slope': np.round(np.random.uniform(-1, 1, n), 3),
    'complaint_count_30d': np.random.randint(0, 8, n),
    'high_severity_complaint_count_30d': np.random.randint(0, 3, n),
    'complaint_growth_rate': np.round(np.random.uniform(0, 1, n), 2),
    'avg_stress_4weeks': np.round(np.random.uniform(1, 10, n), 1),
    'stress_trend_slope': np.round(np.random.uniform(-0.5, 0.5, n), 3),
    'mood_instability_score': np.round(np.random.uniform(1, 10, n), 1),
    'missed_survey_count': np.random.randint(0, 6, n),
    'block_risk_score': np.round(np.random.uniform(1, 5, n), 2),
    'floor_risk_score': np.round(np.random.uniform(1, 5, n), 2),
    'room_risk_score': np.round(np.random.uniform(1, 5, n), 2),
    'roommate_avg_risk_score': np.round(np.random.uniform(1, 5, n), 2)
}

df = pd.DataFrame(data)
df.to_csv('test_student_data.csv', index=False)
print("File 'test_student_data.csv' created with 1000 records.")