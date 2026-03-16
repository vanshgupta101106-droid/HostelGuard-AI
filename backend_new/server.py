#!/usr/bin/env python3

import os
import sys
import logging
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.features.feature_engineering import FeatureEngineer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="HostelGuard AI Risk Prediction API",
    description="API for predicting student risk levels in hostel environments",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and feature engineer
model = None
feature_engineer = None
feature_names = [
    'year', 'days_in_hostel', 'past_escalation_count', 'behavior_count_7d', 
    'behavior_count_30d', 'severe_behavior_count_30d', 'behavior_weighted_score_30d',
    'days_since_last_behavior', 'incident_count_30d', 'severe_incident_count_30d',
    'incident_trend_slope', 'complaint_count_30d', 'high_severity_complaint_count_30d',
    'complaint_growth_rate', 'avg_stress_4weeks', 'stress_trend_slope',
    'mood_instability_score', 'missed_survey_count', 'block_risk_score',
    'floor_risk_score', 'room_risk_score', 'roommate_avg_risk_score'
]

# Pydantic models for request/response
class StudentFeatures(BaseModel):
    """Model for student features input"""
    year: int = Field(..., ge=1, le=4, description="Student year (1-4)")
    days_in_hostel: int = Field(..., ge=1, description="Number of days in hostel")
    past_escalation_count: int = Field(..., ge=0, description="Number of past escalations")
    behavior_count_7d: int = Field(..., ge=0, description="Behavior incidents in last 7 days")
    behavior_count_30d: int = Field(..., ge=0, description="Behavior incidents in last 30 days")
    severe_behavior_count_30d: int = Field(..., ge=0, description="Severe behavior incidents in last 30 days")
    behavior_weighted_score_30d: float = Field(..., ge=0, description="Weighted behavior score")
    days_since_last_behavior: int = Field(..., ge=0, description="Days since last behavior incident")
    incident_count_30d: int = Field(..., ge=0, description="Total incidents in last 30 days")
    severe_incident_count_30d: int = Field(..., ge=0, description="Severe incidents in last 30 days")
    incident_trend_slope: float = Field(..., description="Incident trend slope")
    complaint_count_30d: int = Field(..., ge=0, description="Complaints in last 30 days")
    high_severity_complaint_count_30d: int = Field(..., ge=0, description="High severity complaints")
    complaint_growth_rate: float = Field(..., description="Complaint growth rate")
    avg_stress_4weeks: float = Field(..., ge=1, le=10, description="Average stress level (1-10)")
    stress_trend_slope: float = Field(..., description="Stress trend slope")
    mood_instability_score: float = Field(..., ge=0, description="Mood instability score")
    missed_survey_count: int = Field(..., ge=0, description="Number of missed surveys")
    block_risk_score: float = Field(..., ge=1, le=10, description="Block risk score (1-10)")
    floor_risk_score: float = Field(..., ge=1, le=10, description="Floor risk score (1-10)")
    room_risk_score: float = Field(..., ge=1, le=10, description="Room risk score (1-10)")
    roommate_avg_risk_score: float = Field(..., ge=1, le=10, description="Roommate average risk score (1-10)")

class PredictionRequest(BaseModel):
    """Model for prediction request"""
    student_id: str = Field(..., description="Unique student identifier")
    features: StudentFeatures = Field(..., description="Student features for risk prediction")

class BatchPredictionRequest(BaseModel):
    """Model for batch prediction request"""
    students: List[PredictionRequest] = Field(..., description="List of students for batch prediction")

class RiskPrediction(BaseModel):
    """Model for risk prediction response"""
    risk_level: str = Field(..., description="Predicted risk level (Low/Medium/High)")
    risk_score: float = Field(..., ge=0, le=100, description="Risk score (0-100)")
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence")
    probabilities: Dict[str, float] = Field(..., description="Class probabilities")

class PredictionResponse(BaseModel):
    """Model for prediction response"""
    student_id: str = Field(..., description="Student identifier")
    prediction: RiskPrediction = Field(..., description="Risk prediction results")
    timestamp: str = Field(..., description="Prediction timestamp")

class BatchPredictionResponse(BaseModel):
    """Model for batch prediction response"""
    predictions: Dict[str, RiskPrediction] = Field(..., description="Batch prediction results")
    total_processed: int = Field(..., description="Total number of students processed")
    timestamp: str = Field(..., description="Prediction timestamp")

def load_model():
    """Load the trained model and feature engineer"""
    global model, feature_engineer
    
    try:
        # Load model
        model_path = "models/xgboost_risk_model.pkl"
        scaler_path = "models/scaler.pkl"
        
        if not os.path.exists(model_path):
            logger.error(f"Model not found at {model_path}")
            return False
        
        if not os.path.exists(scaler_path):
            logger.error(f"Scaler not found at {scaler_path}")
            return False
        
        model = joblib.load(model_path)
        logger.info("Model loaded successfully")
        
        # Load feature engineer with scaler
        feature_engineer = FeatureEngineer()
        feature_engineer.scaler = joblib.load(scaler_path)
        logger.info("Feature engineer and scaler loaded successfully")
        
        return True
        
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return False

def preprocess_features(features: StudentFeatures) -> np.ndarray:
    """Preprocess student features for prediction"""
    # Convert to DataFrame
    features_dict = features.dict()
    df = pd.DataFrame([features_dict])
    
    # Apply feature engineering (without fitting)
    df_processed = feature_engineer.preprocess(df, fit_transformers=False)
    
    # Exact feature order that scaler expects (from check_scaler.py output)
    expected_feature_order = [
        'year', 'days_in_hostel', 'past_escalation_count', 'block_risk_score',
        'floor_risk_score', 'room_risk_score', 'roommate_avg_risk_score',
        'behavior_count_7d', 'behavior_count_30d', 'severe_behavior_count_30d',
        'days_since_last_behavior', 'behavior_weighted_score_30d',
        'incident_count_30d', 'severe_incident_count_30d', 'incident_trend_slope',
        'complaint_count_30d', 'high_severity_complaint_count_30d',
        'complaint_growth_rate', 'avg_stress_4weeks', 'stress_trend_slope',
        'mood_instability_score', 'missed_survey_count', 'behavior_incident_ratio',
        'stress_behavior_interaction', 'location_risk_combined', 'behavior_frequency',
        'severe_weighted_score', 'increasing_trend'
    ]
    
    # Extract feature data in the exact order the scaler expects
    feature_data = df_processed[expected_feature_order].values
    
    return feature_data

def calculate_risk_score(probabilities: np.ndarray) -> float:
    """Calculate risk score from probabilities"""
    # Weight Medium as 50 points, High as 100 points
    risk_score = probabilities[1] * 50 + probabilities[2] * 100
    return float(risk_score)

def calculate_confidence(probabilities: np.ndarray) -> float:
    """Calculate prediction confidence"""
    return float(np.max(probabilities))

@app.on_event("startup")
async def startup_event():
    """Initialize the API on startup"""
    logger.info("Starting HostelGuard AI API...")
    
    if not load_model():
        logger.error("Failed to load model. API will not function properly.")
        raise RuntimeError("Model loading failed")

@app.get("/", response_model=Dict)
async def root():
    """Root endpoint"""
    return {
        "message": "HostelGuard AI Risk Prediction API",
        "version": "1.0.0",
        "status": "active",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "batch_predict": "/batch_predict",
            "features": "/features",
            "docs": "/docs"
        }
    }

@app.get("/health", response_model=Dict)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "feature_engineer_loaded": feature_engineer is not None,
        "features_count": len(feature_names)
    }

@app.get("/features", response_model=Dict)
async def get_features():
    """Get the list of required features"""
    return {
        "features": feature_names,
        "descriptions": {
            "year": "Student year (1-4)",
            "days_in_hostel": "Number of days student has been in hostel",
            "past_escalation_count": "Number of past escalations",
            "behavior_count_7d": "Behavior incidents in last 7 days",
            "behavior_count_30d": "Behavior incidents in last 30 days",
            "severe_behavior_count_30d": "Severe behavior incidents in last 30 days",
            "behavior_weighted_score_30d": "Weighted behavior score (severity-weighted)",
            "days_since_last_behavior": "Days since last behavior incident",
            "incident_count_30d": "Total incidents in last 30 days",
            "severe_incident_count_30d": "Severe incidents in last 30 days",
            "incident_trend_slope": "Trend slope for incidents (positive = increasing)",
            "complaint_count_30d": "Complaints in last 30 days",
            "high_severity_complaint_count_30d": "High severity complaints in last 30 days",
            "complaint_growth_rate": "Complaint growth rate",
            "avg_stress_4weeks": "Average stress level over 4 weeks (1-10)",
            "stress_trend_slope": "Stress trend slope",
            "mood_instability_score": "Mood instability score",
            "missed_survey_count": "Number of missed wellbeing surveys",
            "block_risk_score": "Block-level risk score (1-10)",
            "floor_risk_score": "Floor-level risk score (1-10)",
            "room_risk_score": "Room-level risk score (1-10)",
            "roommate_avg_risk_score": "Average roommate risk score (1-10)"
        }
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_risk(request: PredictionRequest):
    """Predict risk for a single student"""
    try:
        # Preprocess features
        features_array = preprocess_features(request.features)
        
        # Make prediction
        prediction = model.predict(features_array)[0]
        probabilities = model.predict_proba(features_array)[0]
        
        # Map prediction to risk level
        risk_levels = ['Low', 'Medium', 'High']
        risk_level = risk_levels[prediction]
        
        # Calculate additional metrics
        risk_score = calculate_risk_score(probabilities)
        confidence = calculate_confidence(probabilities)
        
        # Create probability dictionary
        prob_dict = {
            'Low': float(probabilities[0]),
            'Medium': float(probabilities[1]),
            'High': float(probabilities[2])
        }
        
        # Create response
        response = PredictionResponse(
            student_id=request.student_id,
            prediction=RiskPrediction(
                risk_level=risk_level,
                risk_score=round(risk_score, 2),
                confidence=round(confidence, 4),
                probabilities={k: round(v, 4) for k, v in prob_dict.items()}
            ),
            timestamp=pd.Timestamp.now().isoformat()
        )
        
        logger.info(f"Prediction made for student {request.student_id}: {risk_level}")
        return response
        
    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@app.post("/batch_predict", response_model=BatchPredictionResponse)
async def batch_predict_risk(request: BatchPredictionRequest):
    """Predict risk for multiple students"""
    try:
        predictions = {}
        
        for student_request in request.students:
            try:
                # Preprocess features
                features_array = preprocess_features(student_request.features)
                
                # Make prediction
                prediction = model.predict(features_array)[0]
                probabilities = model.predict_proba(features_array)[0]
                
                # Map prediction to risk level
                risk_levels = ['Low', 'Medium', 'High']
                risk_level = risk_levels[prediction]
                
                # Calculate additional metrics
                risk_score = calculate_risk_score(probabilities)
                confidence = calculate_confidence(probabilities)
                
                # Create probability dictionary
                prob_dict = {
                    'Low': float(probabilities[0]),
                    'Medium': float(probabilities[1]),
                    'High': float(probabilities[2])
                }
                
                # Store prediction
                predictions[student_request.student_id] = RiskPrediction(
                    risk_level=risk_level,
                    risk_score=round(risk_score, 2),
                    confidence=round(confidence, 4),
                    probabilities={k: round(v, 4) for k, v in prob_dict.items()}
                )
                
            except Exception as e:
                logger.error(f"Error processing student {student_request.student_id}: {e}")
                # Continue processing other students
                continue
        
        # Create response
        response = BatchPredictionResponse(
            predictions=predictions,
            total_processed=len(predictions),
            timestamp=pd.Timestamp.now().isoformat()
        )
        
        logger.info(f"Batch prediction completed for {len(predictions)} students")
        return response
        
    except Exception as e:
        logger.error(f"Error in batch prediction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction failed: {str(e)}"
        )

@app.get("/model_info", response_model=Dict)
async def get_model_info():
    """Get model information"""
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded"
        )
    
    # Get actual feature count from model
    actual_feature_count = model.n_features_in_
    
    return {
        "model_type": "XGBoost Classifier",
        "num_features": actual_feature_count,
        "num_classes": 3,
        "classes": ["Low", "Medium", "High"],
        "base_features": len(feature_names),
        "note": "Additional features created during feature engineering"
    }

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
