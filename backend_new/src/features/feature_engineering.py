import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from sklearn.preprocessing import StandardScaler, LabelEncoder
import logging

logger = logging.getLogger(__name__)

class FeatureEngineer:
    """Handles feature engineering for student risk prediction"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_names = [
            'year', 'days_in_hostel', 'past_escalation_count', 'behavior_count_7d', 
            'behavior_count_30d', 'severe_behavior_count_30d', 'behavior_weighted_score_30d',
            'days_since_last_behavior', 'incident_count_30d', 'severe_incident_count_30d',
            'incident_trend_slope', 'complaint_count_30d', 'high_severity_complaint_count_30d',
            'complaint_growth_rate', 'avg_stress_4weeks', 'stress_trend_slope',
            'mood_instability_score', 'missed_survey_count', 'block_risk_score',
            'floor_risk_score', 'room_risk_score', 'roommate_avg_risk_score'
        ]
        
    def create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create interaction features between existing features"""
        df = df.copy()
        
        # Behavior and incident interactions
        df['behavior_incident_ratio'] = np.where(
            df['incident_count_30d'] > 0,
            df['behavior_count_30d'] / df['incident_count_30d'],
            df['behavior_count_30d']
        )
        
        # Stress and behavior interaction
        df['stress_behavior_interaction'] = df['avg_stress_4weeks'] * df['behavior_count_30d']
        
        # Risk score interactions
        df['location_risk_combined'] = (
            df['block_risk_score'] + df['floor_risk_score'] + df['room_risk_score']
        ) / 3
        
        # Time-based features
        df['behavior_frequency'] = np.where(
            df['days_in_hostel'] > 0,
            df['behavior_count_30d'] / (df['days_in_hostel'] / 30),
            0
        )
        
        # Severity weighted features
        df['severe_weighted_score'] = (
            df['severe_behavior_count_30d'] * 3 +
            df['severe_incident_count_30d'] * 2 +
            df['high_severity_complaint_count_30d'] * 1.5
        )
        
        return df
    
    def create_polynomial_features(self, df: pd.DataFrame, degree: int = 2) -> pd.DataFrame:
        """Create polynomial features for key numerical variables"""
        from sklearn.preprocessing import PolynomialFeatures
        
        numerical_cols = [
            'behavior_count_30d', 'incident_count_30d', 'complaint_count_30d',
            'avg_stress_4weeks', 'mood_instability_score'
        ]
        
        poly = PolynomialFeatures(degree=degree, include_only_interactions=True)
        poly_features = poly.fit_transform(df[numerical_cols])
        
        feature_names = poly.get_feature_names_out(numerical_cols)
        poly_df = pd.DataFrame(poly_features, columns=feature_names, index=df.index)
        
        # Remove original features to avoid duplication
        poly_df = poly_df.drop(columns=numerical_cols, errors='ignore')
        
        return pd.concat([df, poly_df], axis=1)
    
    def create_rolling_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create rolling window features if temporal data is available"""
        # This would be used if we have time-series data
        # For now, we'll create proxy rolling features
        df = df.copy()
        
        # Create trend indicators
        df['increasing_trend'] = (
            (df['incident_trend_slope'] > 0) |
            (df['complaint_growth_rate'] > 0) |
            (df['stress_trend_slope'] > 0)
        ).astype(int)
        
        return df
    
    def handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the dataset"""
        df = df.copy()
        
        # For numerical features, use median imputation
        numerical_features = df.select_dtypes(include=[np.number]).columns
        for col in numerical_features:
            if df[col].isnull().any():
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val)
                logger.info(f"Filled missing values in {col} with median: {median_val}")
        
        # For categorical features, use mode imputation
        categorical_features = df.select_dtypes(include=['object']).columns
        for col in categorical_features:
            if df[col].isnull().any():
                mode_val = df[col].mode()[0] if not df[col].mode().empty else 'Unknown'
                df[col] = df[col].fillna(mode_val)
                logger.info(f"Filled missing values in {col} with mode: {mode_val}")
        
        return df
    
    def encode_categorical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Encode categorical features"""
        df = df.copy()
        
        # Convert year to integer instead of category for XGBoost compatibility
        if 'year' in df.columns:
            df['year'] = df['year'].astype('int64')
        
        return df
    
    def scale_features(self, df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        """Scale numerical features"""
        df = df.copy()
        
        numerical_features = df.select_dtypes(include=[np.number]).columns
        numerical_features = [col for col in numerical_features 
                          if col not in ['risk_level', 'risk_level_encoded']]
        
        # If scaler has feature_names_in_, use that order
        if hasattr(self.scaler, 'feature_names_in_'):
            expected_features = list(self.scaler.feature_names_in_)
            
            # Check if all expected features are present
            missing_features = set(expected_features) - set(numerical_features)
            if missing_features:
                logger.warning(f"Missing features for scaling: {missing_features}")
                # Add missing features with default values
                for feature in missing_features:
                    df[feature] = 0
            
            # Reorder features to match scaler's expected order
            numerical_features = expected_features
        
        if fit:
            df[numerical_features] = self.scaler.fit_transform(df[numerical_features])
        else:
            df[numerical_features] = self.scaler.transform(df[numerical_features])
        
        return df
    
    def encode_target(self, df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        """Encode target variable"""
        df = df.copy()
        
        if 'risk_level' in df.columns:
            if fit:
                df['risk_level_encoded'] = self.label_encoder.fit_transform(df['risk_level'])
            else:
                df['risk_level_encoded'] = self.label_encoder.transform(df['risk_level'])
        
        return df
    
    def preprocess(self, df: pd.DataFrame, fit_transformers: bool = True) -> pd.DataFrame:
        """Complete preprocessing pipeline"""
        logger.info("Starting feature engineering pipeline")
        
        # Handle missing values
        df = self.handle_missing_values(df)
        
        # Create interaction features
        df = self.create_interaction_features(df)
        
        # Create rolling features
        df = self.create_rolling_features(df)
        
        # Encode categorical features
        df = self.encode_categorical_features(df)
        
        # Encode target if present
        if 'risk_level' in df.columns:
            df = self.encode_target(df, fit=fit_transformers)
        
        # Scale features
        if fit_transformers:
            df = self.scale_features(df, fit=True)
        else:
            df = self.scale_features(df, fit=False)
        
        logger.info(f"Feature engineering completed. Final shape: {df.shape}")
        return df
    
    def get_feature_names(self) -> List[str]:
        """Get list of feature names after engineering"""
        return self.feature_names
