# Import pandas for high-level data structures like DataFrames, ideal for tabular feature manipulation.
import pandas as pd

# Import numpy for low-level numerical calculations, such as vector-based mathematical operations.
import numpy as np

# Import typing hints for improved documentation and readability of the codebase.
from typing import Dict, List, Optional

# Import scikit-learn's standard tools for feature scaling and label encoding.
from sklearn.preprocessing import StandardScaler, LabelEncoder

# Import the logging library to track the data flow and any issues during processing.
import logging

# Initialize a custom logger for this feature engineering module.
logger = logging.getLogger(__name__)

# The FeatureEngineer class encapsulates all logic related to transforming raw data into a model-ready format.
class FeatureEngineer:
    """Handles feature engineering for student risk prediction"""
    
    # The constructor initializes the necessary transformers and a list of expected base features.
    def __init__(self):
        # StandardScaler removes the mean and scales data to unit variance.
        self.scaler = StandardScaler()
        # LabelEncoder converts categorical labels into a range of integers (0, 1, 2, ...).
        self.label_encoder = LabelEncoder()
        # Define the canonical list of input features that the model expects to see first.
        self.feature_names = [
            'year', 'days_in_hostel', 'past_escalation_count', 'behavior_count_7d', 
            'behavior_count_30d', 'severe_behavior_count_30d', 'behavior_weighted_score_30d',
            'days_since_last_behavior', 'incident_count_30d', 'severe_incident_count_30d',
            'incident_trend_slope', 'complaint_count_30d', 'high_severity_complaint_count_30d',
            'complaint_growth_rate', 'avg_stress_4weeks', 'stress_trend_slope',
            'mood_instability_score', 'missed_survey_count', 'block_risk_score',
            'floor_risk_score', 'room_risk_score', 'roommate_avg_risk_score'
        ]
        
    # This method computes new data columns by mixing existing features to reveal hidden patterns.
    def create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create interaction features between existing features"""
        # Create a local copy of the DataFrame to prevent side effects on the original data.
        df = df.copy()
        
        # Calculate the ratio of behavioral incidents relative to total incidents.
        # Use np.where to prevent division-by-zero errors.
        df['behavior_incident_ratio'] = np.where(
            df['incident_count_30d'] > 0,
            df['behavior_count_30d'] / df['incident_count_30d'],
            df['behavior_count_30d']
        )
        
        # Capture the combined effect of high stress and frequent behavioral events.
        df['stress_behavior_interaction'] = df['avg_stress_4weeks'] * df['behavior_count_30d']
        
        # Aggregate location-based risk signals into a single average score.
        df['location_risk_combined'] = (
            df['block_risk_score'] + df['floor_risk_score'] + df['room_risk_score']
        ) / 3
        
        # Normalize behavioral counts by the student's total tenure to detect unusual frequencies.
        df['behavior_frequency'] = np.where(
            df['days_in_hostel'] > 0,
            df['behavior_count_30d'] / (df['days_in_hostel'] / 30),
            0
        )
        
        # Create a single metric that disproportionately weights more severe incidents.
        df['severe_weighted_score'] = (
            df['severe_behavior_count_30d'] * 3 +
            df['severe_incident_count_30d'] * 2 +
            df['high_severity_complaint_count_30d'] * 1.5
        )
        
        # Return the enhanced DataFrame.
        return df
    
    # Method to potentially capture non-linear relationships using polynomial terms (e.g., squaring a feature).
    def create_polynomial_features(self, df: pd.DataFrame, degree: int = 2) -> pd.DataFrame:
        """Create polynomial features for key numerical variables"""
        # Locally import PolynomialFeatures to reduce overhead if not used elsewhere.
        from sklearn.preprocessing import PolynomialFeatures
        
        # List the critical numerical variables where non-linear patterns often exist.
        numerical_cols = [
            'behavior_count_30d', 'incident_count_30d', 'complaint_count_30d',
            'avg_stress_4weeks', 'mood_instability_score'
        ]
        
        # Configure the tool to create interaction terms between these variables.
        poly = PolynomialFeatures(degree=degree, include_only_interactions=True)
        # Apply the transformation to the selected columns.
        poly_features = poly.fit_transform(df[numerical_cols])
        
        # Retrieve the automatically generated names for the new features.
        feature_names = poly.get_feature_names_out(numerical_cols)
        # Wrap the new values in a DataFrame with matching index.
        poly_df = pd.DataFrame(poly_features, columns=feature_names, index=df.index)
        
        # Drop the original columns from this small frame so they aren't doubled up when joining.
        poly_df = poly_df.drop(columns=numerical_cols, errors='ignore')
        
        # Concatenate the new polynomial features horizontally to the main DataFrame.
        return pd.concat([df, poly_df], axis=1)
    
    # Method to identify and mark records that show worsening metrics over time.
    def create_rolling_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create rolling window features if temporal data is available"""
        # Create a local copy to modify.
        df = df.copy()
        
        # Generate a binary flag indicating if any major risk indicators are currently trending upward.
        df['increasing_trend'] = (
            (df['incident_trend_slope'] > 0) |
            (df['complaint_growth_rate'] > 0) |
            (df['stress_trend_slope'] > 0)
        ).astype(int)
        
        # Return the modified dataset.
        return df
    
    # Critical step to ensure the model doesn't fail due to missing data (null/NaN values).
    def handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the dataset"""
        # Create a local copy.
        df = df.copy()
        
        # Iterate over all columns containing numeric data.
        numerical_features = df.select_dtypes(include=[np.number]).columns
        for col in numerical_features:
            # If any null values exist in the column...
            if df[col].isnull().any():
                # Select the median value to fill gaps (it's robust against outliers).
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val)
                # Log which column was modified for transparency.
                logger.info(f"Filled missing values in {col} with median: {median_val}")
        
        # Iterate over all columns containing text (categorical) data.
        categorical_features = df.select_dtypes(include=['object']).columns
        for col in categorical_features:
            # If any null values exist...
            if df[col].isnull().any():
                # Select the most frequent value (mode), or default to 'Unknown'.
                mode_val = df[col].mode()[0] if not df[col].mode().empty else 'Unknown'
                df[col] = df[col].fillna(mode_val)
                # Log the change.
                logger.info(f"Filled missing values in {col} with mode: {mode_val}")
        
        # Return the cleaned DataFrame.
        return df
    
    # Function to prepare categorical strings for the model's consumption.
    def encode_categorical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Encode categorical features"""
        # Local copy modification.
        df = df.copy()
        
        # For the 'year' field, force it to a formal integer type for numerical stability.
        if 'year' in df.columns:
            df['year'] = df['year'].astype('int64')
        
        # Return the updated frame.
        return df
    
    # Ensures all features have a similar statistical range, helping the gradient descent process.
    def scale_features(self, df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        """Scale numerical features"""
        # Local copy modification.
        df = df.copy()
        
        # Filter down to just the numerical inputs, excluding target labels.
        numerical_features = df.select_dtypes(include=[np.number]).columns
        numerical_features = [col for col in numerical_features 
                          if col not in ['risk_level', 'risk_level_encoded']]
        
        # Handle production scenarios where we need to match the feature list of the trained model.
        if hasattr(self.scaler, 'feature_names_in_'):
            expected_features = list(self.scaler.feature_names_in_)
            
            # Detect any missing columns.
            missing_features = set(expected_features) - set(numerical_features)
            if missing_features:
                # Log a warning for unexpected missing data.
                logger.warning(f"Missing features for scaling: {missing_features}")
                # Create placeholder columns with neutral values (0) to allow transformation to proceed.
                for feature in missing_features:
                    df[feature] = 0
            
            # Rearrange the columns to strictly follow the order the scaler was originally trained on.
            numerical_features = expected_features
        
        # Perform the actual mathematical scaling.
        if fit:
            # Learn the mean/std and then scale (used during training).
            df[numerical_features] = self.scaler.fit_transform(df[numerical_features])
        else:
            # Only use pre-learned mean/std to scale (used during inference).
            df[numerical_features] = self.scaler.transform(df[numerical_features])
        
        # Return the normalized data.
        return df
    
    # Converts the textual 'risk_level' column (Low/High/etc.) into numeric values (0, 1, 2).
    def encode_target(self, df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        """Encode target variable"""
        # Local copy.
        df = df.copy()
        
        # Only process if the risk_level column is present (not present in inference mode).
        if 'risk_level' in df.columns:
            if fit:
                # Assign integers based on alphabetical or occurrence order.
                df['risk_level_encoded'] = self.label_encoder.fit_transform(df['risk_level'])
            else:
                # Use existing assignment rules.
                df['risk_level_encoded'] = self.label_encoder.transform(df['risk_level'])
        
        # Return frame with new encoded target.
        return df
    
    # This is the master function that strings together all individual steps into a single cleanup operation.
    def preprocess(self, df: pd.DataFrame, fit_transformers: bool = True) -> pd.DataFrame:
        """Complete preprocessing pipeline"""
        # Notify that the sequence is beginning.
        logger.info("Starting feature engineering pipeline")
        
        # Step 1: Clean missing data.
        df = self.handle_missing_values(df)
        
        # Step 2: Extract deeper meaning through feature cross-products.
        df = self.create_interaction_features(df)
        
        # Step 3: Flag momentum and trend patterns.
        df = self.create_rolling_features(df)
        
        # Step 4: Ensure all data types are model-compatible.
        df = self.encode_categorical_features(df)
        
        # Step 5: Encode the target label (only happens on training data).
        if 'risk_level' in df.columns:
            df = self.encode_target(df, fit=fit_transformers)
        
        # Step 6: Normalize numerical ranges across all inputs.
        if fit_transformers:
            df = self.scale_features(df, fit=True)
        else:
            df = self.scale_features(df, fit=False)
        
        # Final success log with resulting dataset dimensions.
        logger.info(f"Feature engineering completed. Final shape: {df.shape}")
        # Return the final, model-ready dataset.
        return df
    
    # Utility method to access the current list of primary feature names.
    def get_feature_names(self) -> List[str]:
        """Get list of feature names after engineering"""
        return self.feature_names
