# XGBoost Risk Prediction System

This system uses your trained XGBoost model to calculate student risk levels based on the 23 features you specified.

## Features Used by the Model

The model is trained on the following 23 features:

1. **year** - Student year (1-4)
2. **days_in_hostel** - Number of days student has been in hostel
3. **past_escalation_count** - Number of past escalations
4. **behavior_count_7d** - Behavior incidents in last 7 days
5. **behavior_count_30d** - Behavior incidents in last 30 days
6. **severe_behavior_count_30d** - Severe behavior incidents in last 30 days
7. **behavior_weighted_score_30d** - Weighted behavior score (severity-weighted)
8. **days_since_last_behavior** - Days since last behavior incident
9. **incident_count_30d** - Total incidents in last 30 days
10. **severe_incident_count_30d** - Severe incidents in last 30 days
11. **incident_trend_slope** - Trend slope for incidents (positive = increasing)
12. **complaint_count_30d** - Complaints in last 30 days
13. **high_severity_complaint_count_30d** - High severity complaints in last 30 days
14. **complaint_growth_rate** - Complaint growth rate
15. **avg_stress_4weeks** - Average stress level over 4 weeks (1-10)
16. **stress_trend_slope** - Stress trend slope
17. **mood_instability_score** - Mood instability score
18. **missed_survey_count** - Number of missed wellbeing surveys
19. **block_risk_score** - Block-level risk score
20. **floor_risk_score** - Floor-level risk score
21. **room_risk_score** - Room-level risk score
22. **roommate_avg_risk_score** - Average roommate risk score
23. **risk_score** - Overall risk score (calculated)
24. **risk_level** - Risk level (Low/Medium/High) - This is the target variable

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Risk Prediction Server

```bash
python xgboost_risk_server.py
```

The server will start on `http://localhost:5000`

### 3. Test the API

Run the test script to verify everything is working:

```bash
python test_risk_prediction.py
```

## API Endpoints

### Health Check
```
GET /health
```

Returns the server status and whether the model is loaded.

### Get Features
```
GET /features
```

Returns the list of all required features and their descriptions.

### Single Prediction
```
POST /predict
Content-Type: application/json

{
  "student_id": "S_1000",
  "features": {
    "year": 2,
    "days_in_hostel": 677,
    "past_escalation_count": 0,
    "behavior_count_7d": 1,
    "behavior_count_30d": 1,
    "severe_behavior_count_30d": 0,
    "behavior_weighted_score_30d": 0.078,
    "days_since_last_behavior": 61,
    "incident_count_30d": 0,
    "severe_incident_count_30d": 0,
    "incident_trend_slope": -0.603,
    "complaint_count_30d": 0.857,
    "high_severity_complaint_count_30d": 0,
    "complaint_growth_rate": 0.87,
    "avg_stress_4weeks": 0.156,
    "stress_trend_slope": -0.093,
    "mood_instability_score": 2.4,
    "missed_survey_count": 4,
    "block_risk_score": 0.812,
    "floor_risk_score": 1.9,
    "room_risk_score": 0.767,
    "roommate_avg_risk_score": 3.95
  }
}
```

### Batch Prediction
```
POST /batch_predict
Content-Type: application/json

{
  "students": [
    {
      "student_id": "S_1000",
      "features": { ... }
    },
    {
      "student_id": "S_1001", 
      "features": { ... }
    }
  ]
}
```

## Response Format

### Single Prediction Response
```json
{
  "student_id": "S_1000",
  "prediction": {
    "risk_level": "Medium",
    "risk_score": 45.67,
    "probabilities": {
      "Low": 25.5,
      "Medium": 60.2,
      "High": 14.3
    }
  },
  "features_used": ["year", "days_in_hostel", ...],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Batch Prediction Response
```json
{
  "predictions": {
    "S_1000": {
      "risk_level": "Medium",
      "risk_score": 45.67,
      "probabilities": {
        "Low": 25.5,
        "Medium": 60.2,
        "High": 14.3
      }
    },
    "S_1001": {
      "risk_level": "Low",
      "risk_score": 12.34,
      "probabilities": {
        "Low": 85.2,
        "Medium": 12.1,
        "High": 2.7
      }
    }
  },
  "total_processed": 2,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Risk Levels

- **Low**: Risk score < 40
- **Medium**: Risk score 40-70  
- **High**: Risk score ≥ 70

## Integration with Frontend

The frontend can call this API to get real-time risk predictions. The TypeScript service in `../hostel-risk-system/lib/services/xgboost-risk.service.ts` provides a client-side interface, but for production use, you should call the Python backend API directly.

## Model Information

- **Model Type**: XGBoost Classifier
- **Classes**: 3 (Low, Medium, High)
- **Features**: 23
- **Model File**: `../hostel-risk-system/model/xgboost_model.pkl`

## Notes

1. The server will automatically create a mock model if your trained model file is not found
2. All features are normalized internally before prediction
3. The server includes CORS support for frontend integration
4. Risk scores are calculated as weighted probabilities: `Medium * 50 + High * 100`
5. The server logs all predictions for debugging and monitoring

## Example Usage

```python
import requests

# Single prediction
response = requests.post('http://localhost:5000/predict', json={
    'student_id': 'S_1000',
    'features': {
        'year': 2,
        'days_in_hostel': 677,
        # ... other features
    }
})

result = response.json()
print(f"Risk Level: {result['prediction']['risk_level']}")
print(f"Risk Score: {result['prediction']['risk_score']}")
```
