#!/usr/bin/env python3
# Shebang line specifying the Python 3 interpreter for execution.

# Import 'os' for operating system interface tasks like path handling.
import os

# Import 'sys' to manipulate Python's runtime environment, such as the module search path.
import sys

# Import 'logging' to record system logs and diagnostic information.
import logging

# Import 'joblib' to load serialized Python objects, specifically the trained machine learning model.
import joblib

# Import 'numpy' for numerical computing and array operations.
import numpy as np

# Import 'pandas' for data manipulation and analysis using DataFrames.
import pandas as pd

# Import typing utilities for better code documentation and type checking.
from typing import Dict, List, Optional

# Import Pydantic's 'BaseModel' and 'Field' for robust data validation and schema definition.
from pydantic import BaseModel, Field

# Import 'FastAPI' and related utilities to build the web API.
from fastapi import FastAPI, HTTPException, status

# Import CORS middleware to allow the API to be called from different origins (e.g., a frontend application).
from fastapi.middleware.cors import CORSMiddleware

# Import 'uvicorn' to serve the FastAPI application.
import uvicorn

# Add the 'src' directory to the system path so that internal project modules can be imported.
# This builds the absolute path to the 'src' folder relative to this file's location.
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Import the 'FeatureEngineer' class from the project's internal feature engineering module.
from src.features.feature_engineering import FeatureEngineer

# Set up logging configuration to display info-level messages with a standardized timestamp and format.
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Initialize a logger instance for this specific module.
logger = logging.getLogger(__name__)

# Create the FastAPI application instance with descriptive metadata.
app = FastAPI(
    title="HostelGuard AI Risk Prediction API",
    description="API for predicting student risk levels in hostel environments",
    version="1.0.0"
)

# Configure Cross-Origin Resource Sharing (CORS) to allow requests from any source for development purposes.
app.add_middleware(
    CORSMiddleware,
    # Allow all domains to access the API.
    allow_origins=["*"],
    # Allow cookies and other credentials in cross-origin requests.
    allow_credentials=True,
    # Allow all HTTP methods (GET, POST, etc.).
    allow_methods=["*"],
    # Allow all HTTP headers.
    allow_headers=["*"],
)

# Declare global placeholders for the model and feature engineer objects to be loaded at startup.
model = None
feature_engineer = None

# Define the list of base features expected by the model for input transparency.
feature_names = [
    'year', 'days_in_hostel', 'past_escalation_count', 'behavior_count_7d', 
    'behavior_count_30d', 'severe_behavior_count_30d', 'behavior_weighted_score_30d',
    'days_since_last_behavior', 'incident_count_30d', 'severe_incident_count_30d',
    'incident_trend_slope', 'complaint_count_30d', 'high_severity_complaint_count_30d',
    'complaint_growth_rate', 'avg_stress_4weeks', 'stress_trend_slope',
    'mood_instability_score', 'missed_survey_count', 'block_risk_score',
    'floor_risk_score', 'room_risk_score', 'roommate_avg_risk_score'
]

# Define the Pydantic schema for individual student features to ensure data integrity during input.
class StudentFeatures(BaseModel):
    """Model for student features input"""
    # The year the student is currently in (1 to 4).
    year: int = Field(..., ge=1, le=4, description="Student year (1-4)")
    # Total days the student has spent in the hostel.
    days_in_hostel: int = Field(..., ge=1, description="Number of days in hostel")
    # Historical count of previous formal escalations.
    past_escalation_count: int = Field(..., ge=0, description="Number of past escalations")
    # Behavioral incidents recorded in the last week.
    behavior_count_7d: int = Field(..., ge=0, description="Behavior incidents in last 7 days")
    # Behavioral incidents recorded in the last month.
    behavior_count_30d: int = Field(..., ge=0, description="Behavior incidents in last 30 days")
    # Major behavioral incidents recorded in the last month.
    severe_behavior_count_30d: int = Field(..., ge=0, description="Severe behavior incidents in last 30 days")
    # A score that weights monthly behavior by severity.
    behavior_weighted_score_30d: float = Field(..., ge=0, description="Weighted behavior score")
    # Recency of the last behavior incident in days.
    days_since_last_behavior: int = Field(..., ge=0, description="Days since last behavior incident")
    # Total general incidents in the last 30 days.
    incident_count_30d: int = Field(..., ge=0, description="Total incidents in last 30 days")
    # Total severe general incidents in the last 30 days.
    severe_incident_count_30d: int = Field(..., ge=0, description="Severe incidents in last 30 days")
    # Calculated trend of incident occurrence (rising or falling).
    incident_trend_slope: float = Field(..., description="Incident trend slope")
    # Count of complaints filed in the last 30 days.
    complaint_count_30d: int = Field(..., ge=0, description="Complaints in last 30 days")
    # Count of critical complaints filed in the last 30 days.
    high_severity_complaint_count_30d: int = Field(..., ge=0, description="High severity complaints")
    # Rate of change in complaint volume.
    complaint_growth_rate: float = Field(..., description="Complaint growth rate")
    # Average self-reported stress level on a scale of 1 to 10.
    avg_stress_4weeks: float = Field(..., ge=1, le=10, description="Average stress level (1-10)")
    # Upward or downward trend in stress levels.
    stress_trend_slope: float = Field(..., description="Stress trend slope")
    # Calculated volatile mood score based on surveys.
    mood_instability_score: float = Field(..., ge=0, description="Mood instability score")
    # Total number of mandatory surveys the student missed.
    missed_survey_count: int = Field(..., ge=0, description="Number of missed surveys")
    # Aggregated risk score for the student's specific hostel block.
    block_risk_score: float = Field(..., ge=1, le=10, description="Block risk score (1-10)")
    # Aggregated risk score for the student's specific floor.
    floor_risk_score: float = Field(..., ge=1, le=10, description="Floor risk score (1-10)")
    # Aggregated risk score for the student's specific room.
    room_risk_score: float = Field(..., ge=1, le=10, description="Room risk score (1-10)")
    # Average risk score of the student's roommates.
    roommate_avg_risk_score: float = Field(..., ge=1, le=10, description="Roommate average risk score (1-10)")

# Define the schema for a single prediction request.
class PredictionRequest(BaseModel):
    """Model for prediction request"""
    # Unique identifier representing the student.
    student_id: str = Field(..., description="Unique student identifier")
    # Nested feature set as defined in StudentFeatures.
    features: StudentFeatures = Field(..., description="Student features for risk prediction")

# Define the schema for processing multiple student predictions at once.
class BatchPredictionRequest(BaseModel):
    """Model for batch prediction request"""
    # A list containing multiple prediction requests.
    students: List[PredictionRequest] = Field(..., description="List of students for batch prediction")

# Define the detailed response schema for a risk prediction.
class RiskPrediction(BaseModel):
    """Model for risk prediction response"""
    # The categorical result: Low, Medium, or High.
    risk_level: str = Field(..., description="Predicted risk level (Low/Medium/High)")
    # A numerical score from 0 to 100 indicating intensity.
    risk_score: float = Field(..., ge=0, le=100, description="Risk score (0-100)")
    # The statistical confidence level of the prediction (0 to 1).
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence")
    # A dictionary showing the probability breakdown for each risk category.
    probabilities: Dict[str, float] = Field(..., description="Class probabilities")

# Define the overall response wrapper for a single prediction.
class PredictionResponse(BaseModel):
    """Model for prediction response"""
    # The student ID associated with this prediction.
    student_id: str = Field(..., description="Student identifier")
    # The actual prediction data.
    prediction: RiskPrediction = Field(..., description="Risk prediction results")
    # When the prediction was generated.
    timestamp: str = Field(..., description="Prediction timestamp")

# Define the overall response wrapper for batch predictions.
class BatchPredictionResponse(BaseModel):
    """Model for batch prediction response"""
    # A dictionary mapping student IDs to their individual risk predictions.
    predictions: Dict[str, RiskPrediction] = Field(..., description="Batch prediction results")
    # Counter for how many students were successfully processed.
    total_processed: int = Field(..., description="Total number of students processed")
    # Combined timestamp for the batch result.
    timestamp: str = Field(..., description="Prediction timestamp")

# Function to load the ML model and its accompanying preprocessor from disk.
def load_model():
    """Load the trained model and feature engineer"""
    # Indicate usage of global variables declared earlier.
    global model, feature_engineer
    
    try:
        # Define relative file paths for the saved model and scaler.
        model_path = "models/xgboost_risk_model.pkl"
        scaler_path = "models/scaler.pkl"
        
        # Verify if the model file exists on the filesystem.
        if not os.path.exists(model_path):
            # Log an error if the model is missing.
            logger.error(f"Model not found at {model_path}")
            return False
        
        # Verify if the scaler file exists on the filesystem.
        if not os.path.exists(scaler_path):
            # Log an error if the scaler is missing.
            logger.error(f"Scaler not found at {scaler_path}")
            return False
        
        # Load the XGBoost model using joblib.
        model = joblib.load(model_path)
        # Log that the model was successfully brought into memory.
        logger.info("Model loaded successfully")
        
        # Initialize the feature engineering component.
        feature_engineer = FeatureEngineer()
        # Load and attach the previously fitted scaler to the feature engineer.
        feature_engineer.scaler = joblib.load(scaler_path)
        # Log the successful setup of the processing pipeline.
        logger.info("Feature engineer and scaler loaded successfully")
        
        # Return True to indicate a successful initialization.
        return True
        
    # Catch any issues encountered during the file loading process.
    except Exception as e:
        # Log the specific exception message.
        logger.error(f"Error loading model: {e}")
        # Return False to signify a failure in setup.
        return False

# Function to transform raw Pydantic input into a format ready for the model.
def preprocess_features(features: StudentFeatures) -> np.ndarray:
    """Preprocess student features for prediction"""
    # Convert the validated Pydantic model into a standard Python dictionary.
    features_dict = features.dict()
    # Wrap the dictionary in a pandas DataFrame to facilitate processing.
    df = pd.DataFrame([features_dict])
    
    # Use the feature engineer to perform transformations (like creating interactive features).
    # 'fit_transformers=False' ensures we don't recalculate statistics, only apply existing ones.
    df_processed = feature_engineer.preprocess(df, fit_transformers=False)
    
    # Define the precise column order required by the model and its pre-fitted components.
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
    
    # Reorder the DataFrame columns to match the expected structure and extract the raw values as a numpy array.
    feature_data = df_processed[expected_feature_order].values
    
    # Return the processed numerical data.
    return feature_data

# Function to derive a user-friendly 0-100 score from the raw class probabilities.
def calculate_risk_score(probabilities: np.ndarray) -> float:
    """Calculate risk score from probabilities"""
    # Assign weights to risk classes: 'Low' (index 0) is 0, 'Medium' (index 1) is 50, 'High' (index 2) is 100.
    risk_score = probabilities[1] * 50 + probabilities[2] * 100
    # Return the weighted sum as the final risk score.
    return float(risk_score)

# Function to extract the highest probability as a measure of prediction confidence.
def calculate_confidence(probabilities: np.ndarray) -> float:
    """Calculate prediction confidence"""
    # Pick the maximum value from the probabilities array.
    return float(np.max(probabilities))

# Event handler that runs automatically when the FastAPI server starts up.
@app.on_event("startup")
async def startup_event():
    """Initialize the API on startup"""
    # Log that the API service initialization is beginning.
    logger.info("Starting HostelGuard AI API...")
    
    # Attempt to load the model; if it fails, prevent the server from functioning.
    if not load_model():
        # Log the fatal error.
        logger.error("Failed to load model. API will not function properly.")
        # Raise a runtime error to halt the application startup.
        raise RuntimeError("Model loading failed")

# Root API endpoint providing basic information and available routes.
@app.get("/", response_model=Dict)
async def root():
    """Root endpoint"""
    # Return a JSON object with metadata about the API.
    return {
        "message": "HostelGuard AI Risk Prediction API",
        "version": "1.0.0",
        "status": "active",
        # List of key functional endpoints for easy discovery.
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "batch_predict": "/batch_predict",
            "features": "/features",
            "docs": "/docs"
        }
    }

# Endpoint to check the current operational status of the service and model.
@app.get("/health", response_model=Dict)
async def health_check():
    """Health check endpoint"""
    # Return connectivity and component health flags.
    return {
        "status": "healthy",
        # Boolean showing if the model is ready in memory.
        "model_loaded": model is not None,
        # Boolean showing if the feature engineer is ready.
        "feature_engineer_loaded": feature_engineer is not None,
        # Count of features defined in the API.
        "features_count": len(feature_names)
    }

# Endpoint providing documentation on the required fields for predictions.
@app.get("/features", response_model=Dict)
async def get_features():
    """Get the list of required features"""
    # Return the feature list and human-readable descriptions of what each field represents.
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

# Main endpoint to predict risk for a single student profile.
@app.post("/predict", response_model=PredictionResponse)
async def predict_risk(request: PredictionRequest):
    """Predict risk for a single student"""
    try:
        # Convert incoming JSON data into a processed array for the model.
        features_array = preprocess_features(request.features)
        
        # Use the XGBoost model to get the most likely class index.
        prediction = model.predict(features_array)[0]
        # Get the full probability distribution across all three classes.
        probabilities = model.predict_proba(features_array)[0]
        
        # Mapping the numerical class (0, 1, 2) to its string representation.
        risk_levels = ['Low', 'Medium', 'High']
        risk_level = risk_levels[prediction]
        
        # Calculate human-readable risk intensity and prediction confidence.
        risk_score = calculate_risk_score(probabilities)
        confidence = calculate_confidence(probabilities)
        
        # Package the probabilities into a dictionary for the response.
        prob_dict = {
            'Low': float(probabilities[0]),
            'Medium': float(probabilities[1]),
            'High': float(probabilities[2])
        }
        
        # Construct the final response object conforming to PredictionResponse schema.
        response = PredictionResponse(
            student_id=request.student_id,
            prediction=RiskPrediction(
                risk_level=risk_level,
                risk_score=round(risk_score, 2),
                confidence=round(confidence, 4),
                probabilities={k: round(v, 4) for k, v in prob_dict.items()}
            ),
            # Add a current ISO-formatted timestamp.
            timestamp=pd.Timestamp.now().isoformat()
        )
        
        # Log that a successful prediction was made.
        logger.info(f"Prediction made for student {request.student_id}: {risk_level}")
        # Return the response to the caller.
        return response
        
    # Catch processing or logic errors during prediction.
    except Exception as e:
        # Log the server-side error.
        logger.error(f"Error in prediction: {e}")
        # Raise an HTTP 500 error to inform the client that something went wrong on our end.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

# Endpoint to handle multiple student predictions in a single request.
@app.post("/batch_predict", response_model=BatchPredictionResponse)
async def batch_predict_risk(request: BatchPredictionRequest):
    """Predict risk for multiple students"""
    try:
        # Dictionary to store results for each student.
        predictions = {}
        
        # Iterate through every student request in the batch.
        for student_request in request.students:
            try:
                # Process features for the current student.
                features_array = preprocess_features(student_request.features)
                
                # Perform the model prediction and probability calculation.
                prediction = model.predict(features_array)[0]
                probabilities = model.predict_proba(features_array)[0]
                
                # Map the numeric prediction back to a human-readable label.
                risk_levels = ['Low', 'Medium', 'High']
                risk_level = risk_levels[prediction]
                
                # Derived metrics for risk intensity and confidence.
                risk_score = calculate_risk_score(probabilities)
                confidence = calculate_confidence(probabilities)
                
                # Map probabilities to labels.
                prob_dict = {
                    'Low': float(probabilities[0]),
                    'Medium': float(probabilities[1]),
                    'High': float(probabilities[2])
                }
                
                # Insert the result into the batch dictionary keyed by student ID.
                predictions[student_request.student_id] = RiskPrediction(
                    risk_level=risk_level,
                    risk_score=round(risk_score, 2),
                    confidence=round(confidence, 4),
                    probabilities={k: round(v, 4) for k, v in prob_dict.items()}
                )
                
            # Handle failures for individual students within the batch without stopping the whole process.
            except Exception as e:
                # Log individual failure but let the loop proceed.
                logger.error(f"Error processing student {student_request.student_id}: {e}")
                continue
        
        # Wrap all collected predictions in a final batch response object.
        response = BatchPredictionResponse(
            predictions=predictions,
            total_processed=len(predictions),
            timestamp=pd.Timestamp.now().isoformat()
        )
        
        # Log completion statistics for the batch.
        logger.info(f"Batch prediction completed for {len(predictions)} students")
        # Return the compiled results.
        return response
        
    # Catch catastrophic errors impacting the overall batch procedure.
    except Exception as e:
        # Log the overall failure.
        logger.error(f"Error in batch prediction: {e}")
        # Raise an HTTP 500 error.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction failed: {str(e)}"
        )

# Endpoint to retrieve internal information about the loaded machine learning model.
@app.get("/model_info", response_model=Dict)
async def get_model_info():
    """Get model information"""
    # Ensure a model is actually loaded before trying to query its properties.
    if model is None:
        # If not, return a 503 service unavailable error.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded"
        )
    
    # Query the XGBoost model for the number of input features it was trained on.
    actual_feature_count = model.n_features_in_
    
    # Return descriptive metadata about the model's architecture and capabilities.
    return {
        "model_type": "XGBoost Classifier",
        "num_features": actual_feature_count,
        "num_classes": 3,
        "classes": ["Low", "Medium", "High"],
        "base_features": len(feature_names),
        "note": "Additional features created during feature engineering"
    }

# Block that executes if the script is run directly via command line.
if __name__ == "__main__":
    # Launch the uvicorn server to host the API.
    uvicorn.run(
        # Point to the app instance in the 'server' module.
        "server:app",
        # Listen on all network interfaces.
        host="0.0.0.0",
        # Use port 8000 for communication.
        port=8000,
        # Automatically restart the server if code changes are detected (useful for dev).
        reload=True,
        # Set the server logs to display INFO-level details.
        log_level="info"
    )
