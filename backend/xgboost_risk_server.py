import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from typing import Dict, List, Optional, Tuple

# Fix XGBoost compatibility issue by monkey-patching
import xgboost as xgb
original_xgb_classifier = xgb.XGBClassifier

class FixedXGBClassifier(original_xgb_classifier):
    def __init__(self, *args, **kwargs):
        # Remove use_label_encoder from kwargs if present
        if 'use_label_encoder' in kwargs:
            kwargs.pop('use_label_encoder')
        super().__init__(*args, **kwargs)
    
    def __setattr__(self, name, value):
        if name == 'use_label_encoder':
            return  # Don't set this attribute
        super().__setattr__(name, value)

# Replace the original class
xgb.XGBClassifier = FixedXGBClassifier

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables for model and feature names
model = None
feature_names = [
    'year', 'days_in_hostel', 'past_escalation_count', 'behavior_count_7d', 
    'behavior_count_30d', 'severe_behavior_count_30d', 'behavior_weighted_score_30d',
    'days_since_last_behavior', 'incident_count_30d', 'severe_incident_count_30d',
    'incident_trend_slope', 'complaint_count_30d', 'high_severity_complaint_count_30d',
    'complaint_growth_rate', 'avg_stress_4weeks', 'stress_trend_slope',
    'mood_instability_score', 'missed_survey_count', 'block_risk_score',
    'floor_risk_score', 'room_risk_score', 'roommate_avg_risk_score'
]

def load_model():
    """Load the trained XGBoost model"""
    global model
    try:
        model_path = os.path.join(
            os.path.dirname(__file__), 'xgboost_model.pkl'
        )
        logger.info(f"Loading model from: {model_path}")
        
        if os.path.exists(model_path):
            model = joblib.load(model_path)
            logger.info("Model loaded successfully!")
        else:
            logger.warning(f"Model file not found at {model_path}")
            raise FileNotFoundError(f"Model file not found at {model_path}")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise

def calculate_features(student_data: Dict) -> np.ndarray:
    """Calculate features for a student based on their data"""
    features = []
    
    # Extract features in the correct order
    for feature_name in feature_names:
        if feature_name in student_data:
            features.append(student_data[feature_name])
        else:
            # Use default values if feature not provided
            print("using default values")
            default_values = {
                'year': 1,
                'days_in_hostel': 180,
                'past_escalation_count': 0,
                'behavior_count_7d': 0,
                'behavior_count_30d': 0,
                'severe_behavior_count_30d': 0,
                'behavior_weighted_score_30d': 0,
                'days_since_last_behavior': 999,
                'incident_count_30d': 0,
                'severe_incident_count_30d': 0,
                'incident_trend_slope': 0,
                'complaint_count_30d': 0,
                'high_severity_complaint_count_30d': 0,
                'complaint_growth_rate': 0,
                'avg_stress_4weeks': 5,
                'stress_trend_slope': 0,
                'mood_instability_score': 0,
                'missed_survey_count': 0,
                'block_risk_score': 5,
                'floor_risk_score': 5,
                'room_risk_score': 5,
                'roommate_avg_risk_score': 5
            }
            features.append(default_values.get(feature_name, 0))
    
    return np.array(features).reshape(1, -1)

def predict_risk(features: np.ndarray) -> Tuple[int, Dict[str, float], float]:
    """Make prediction using the loaded model"""
    if model is None:
        raise ValueError("Model not loaded")
    
    # Get prediction
    prediction = model.predict(features)[0]
    
    # Get probabilities
    probabilities = model.predict_proba(features)[0]
    
    # Calculate risk score (0-100)
    # Weight Medium as 50 points, High as 100 points
    risk_score = probabilities[1] * 50 + probabilities[2] * 100
    
    # Create probability dictionary
    prob_dict = {
        'Low': float(probabilities[0]),
        'Medium': float(probabilities[1]),
        'High': float(probabilities[2])
    }
    
    return int(prediction), prob_dict, float(risk_score)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'features_count': len(feature_names)
    })

@app.route('/predict', methods=['POST'])
def predict_student_risk():
    """Predict risk for a single student"""
    try:
        data = request.get_json()
        print(data)
        
        student_id = data['student_id']
        student_features = data.get('features', {})
        
        # Calculate features
        features = calculate_features(student_features)
        
        # Make prediction
        prediction, probabilities, risk_score = predict_risk(features)
        
        # Map prediction to risk level
        risk_levels = ['Low', 'Medium', 'High']
        risk_level = risk_levels[prediction]
        
        return jsonify({
            'student_id': student_id,
            'prediction': {
                'risk_level': risk_level,
                'risk_score': round(risk_score, 2),
                'probabilities': {
                    'Low': round(probabilities['Low'] * 100, 2),
                    'Medium': round(probabilities['Medium'] * 100, 2),
                    'High': round(probabilities['High'] * 100, 2)
                }
            },
            'features_used': feature_names,
            'timestamp': pd.Timestamp.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict_risk():
    """Predict risk for multiple students"""
    try:
        data = request.get_json()
        
        if not data or 'students' not in data:
            return jsonify({'error': 'students array is required'}), 400
        
        students = data['students']
        if not isinstance(students, list):
            return jsonify({'error': 'students must be an array'}), 400
        
        results = {}
        
        for student in students:
            try:
                student_id = student.get('student_id')
                if not student_id:
                    continue
                
                student_features = student.get('features', {})
                
                # Calculate features
                features = calculate_features(student_features)
                
                # Make prediction
                prediction, probabilities, risk_score = predict_risk(features)
                
                # Map prediction to risk level
                risk_levels = ['Low', 'Medium', 'High']
                risk_level = risk_levels[prediction]
                
                results[student_id] = {
                    'risk_level': risk_level,
                    'risk_score': round(risk_score, 2),
                    'probabilities': {
                        'Low': round(probabilities['Low'] * 100, 2),
                        'Medium': round(probabilities['Medium'] * 100, 2),
                        'High': round(probabilities['High'] * 100, 2)
                    }
                }
                
            except Exception as e:
                logger.error(f"Error processing student {student.get('student_id', 'unknown')}: {e}")
                results[student.get('student_id', 'unknown')] = {'error': str(e)}
        
        return jsonify({
            'predictions': results,
            'total_processed': len(results),
            'timestamp': pd.Timestamp.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in batch prediction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/features', methods=['GET'])
def get_features():
    """Get the list of required features"""
    return jsonify({
        'features': feature_names,
        'description': {
            'year': 'Student year (1-4)',
            'days_in_hostel': 'Number of days student has been in hostel',
            'past_escalation_count': 'Number of past escalations',
            'behavior_count_7d': 'Behavior incidents in last 7 days',
            'behavior_count_30d': 'Behavior incidents in last 30 days',
            'severe_behavior_count_30d': 'Severe behavior incidents in last 30 days',
            'behavior_weighted_score_30d': 'Weighted behavior score (severity-weighted)',
            'days_since_last_behavior': 'Days since last behavior incident',
            'incident_count_30d': 'Total incidents in last 30 days',
            'severe_incident_count_30d': 'Severe incidents in last 30 days',
            'incident_trend_slope': 'Trend slope for incidents (positive = increasing)',
            'complaint_count_30d': 'Complaints in last 30 days',
            'high_severity_complaint_count_30d': 'High severity complaints in last 30 days',
            'complaint_growth_rate': 'Complaint growth rate',
            'avg_stress_4weeks': 'Average stress level over 4 weeks (1-10)',
            'stress_trend_slope': 'Stress trend slope',
            'mood_instability_score': 'Mood instability score',
            'missed_survey_count': 'Number of missed wellbeing surveys',
            'block_risk_score': 'Block-level risk score',
            'floor_risk_score': 'Floor-level risk score',
            'room_risk_score': 'Room-level risk score',
            'roommate_avg_risk_score': 'Average roommate risk score'
        }
    })

if __name__ == '__main__':
    load_model()
    app.run(host='0.0.0.0', port=5000, debug=True)
