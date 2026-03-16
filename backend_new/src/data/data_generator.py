import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)

class DataGenerator:
    """Generates synthetic data for student risk prediction"""
    
    def __init__(self, n_samples: int = 10000, random_state: int = 42):
        self.n_samples = n_samples
        self.random_state = random_state
        np.random.seed(random_state)
        
        # Define risk level probabilities
        self.risk_probabilities = [0.6, 0.3, 0.1]  # Low, Medium, High
        
    def generate_base_features(self) -> pd.DataFrame:
        """Generate base features for students"""
        data = {
            'year': np.random.choice([1, 2, 3, 4], self.n_samples, p=[0.3, 0.3, 0.25, 0.15]),
            'days_in_hostel': np.random.randint(1, 365, self.n_samples),
            'past_escalation_count': np.random.poisson(0.5, self.n_samples),
            'block_risk_score': np.random.uniform(1, 10, self.n_samples),
            'floor_risk_score': np.random.uniform(1, 10, self.n_samples),
            'room_risk_score': np.random.uniform(1, 10, self.n_samples),
            'roommate_avg_risk_score': np.random.uniform(1, 10, self.n_samples)
        }
        return pd.DataFrame(data)
    
    def generate_behavioral_features(self, risk_levels: np.ndarray) -> pd.DataFrame:
        """Generate behavioral features based on risk levels"""
        data = {}
        
        for i, risk in enumerate(risk_levels):
            if risk == 0:  # Low risk
                behavior_7d = np.random.poisson(0.1)
                behavior_30d = np.random.poisson(0.3)
                severe_behavior_30d = 0 if np.random.random() > 0.05 else np.random.poisson(1)
                days_since_last = np.random.randint(30, 365)
            elif risk == 1:  # Medium risk
                behavior_7d = np.random.poisson(0.5)
                behavior_30d = np.random.poisson(2)
                severe_behavior_30d = 0 if np.random.random() > 0.2 else np.random.poisson(1)
                days_since_last = np.random.randint(7, 90)
            else:  # High risk
                behavior_7d = np.random.poisson(2)
                behavior_30d = np.random.poisson(8)
                severe_behavior_30d = np.random.poisson(2)
                days_since_last = np.random.randint(0, 30)
            
            if i == 0:
                data['behavior_count_7d'] = [behavior_7d]
                data['behavior_count_30d'] = [behavior_30d]
                data['severe_behavior_count_30d'] = [severe_behavior_30d]
                data['days_since_last_behavior'] = [days_since_last]
            else:
                data['behavior_count_7d'].append(behavior_7d)
                data['behavior_count_30d'].append(behavior_30d)
                data['severe_behavior_count_30d'].append(severe_behavior_30d)
                data['days_since_last_behavior'].append(days_since_last)
        
        # Calculate weighted behavior score
        data['behavior_weighted_score_30d'] = [
            b * 1 + sb * 3 for b, sb in zip(
                data['behavior_count_30d'], data['severe_behavior_count_30d']
            )
        ]
        
        return pd.DataFrame(data)
    
    def generate_incident_features(self, risk_levels: np.ndarray) -> pd.DataFrame:
        """Generate incident-related features based on risk levels"""
        data = {}
        
        for i, risk in enumerate(risk_levels):
            if risk == 0:  # Low risk
                incident_30d = np.random.poisson(0.2)
                severe_incident_30d = 0
                trend_slope = np.random.normal(-0.1, 0.2)
            elif risk == 1:  # Medium risk
                incident_30d = np.random.poisson(1.5)
                severe_incident_30d = 0 if np.random.random() > 0.3 else 1
                trend_slope = np.random.normal(0.0, 0.3)
            else:  # High risk
                incident_30d = np.random.poisson(5)
                severe_incident_30d = np.random.poisson(2)
                trend_slope = np.random.normal(0.2, 0.4)
            
            if i == 0:
                data['incident_count_30d'] = [incident_30d]
                data['severe_incident_count_30d'] = [severe_incident_30d]
                data['incident_trend_slope'] = [trend_slope]
            else:
                data['incident_count_30d'].append(incident_30d)
                data['severe_incident_count_30d'].append(severe_incident_30d)
                data['incident_trend_slope'].append(trend_slope)
        
        return pd.DataFrame(data)
    
    def generate_complaint_features(self, risk_levels: np.ndarray) -> pd.DataFrame:
        """Generate complaint-related features based on risk levels"""
        data = {}
        
        for i, risk in enumerate(risk_levels):
            if risk == 0:  # Low risk
                complaint_30d = np.random.poisson(0.1)
                high_severity_30d = 0
                growth_rate = np.random.normal(-0.05, 0.1)
            elif risk == 1:  # Medium risk
                complaint_30d = np.random.poisson(1)
                high_severity_30d = 0 if np.random.random() > 0.2 else 1
                growth_rate = np.random.normal(0.0, 0.15)
            else:  # High risk
                complaint_30d = np.random.poisson(3)
                high_severity_30d = np.random.poisson(1)
                growth_rate = np.random.normal(0.1, 0.2)
            
            if i == 0:
                data['complaint_count_30d'] = [complaint_30d]
                data['high_severity_complaint_count_30d'] = [high_severity_30d]
                data['complaint_growth_rate'] = [growth_rate]
            else:
                data['complaint_count_30d'].append(complaint_30d)
                data['high_severity_complaint_count_30d'].append(high_severity_30d)
                data['complaint_growth_rate'].append(growth_rate)
        
        return pd.DataFrame(data)
    
    def generate_wellbeing_features(self, risk_levels: np.ndarray) -> pd.DataFrame:
        """Generate wellbeing and mental health features"""
        data = {}
        
        for i, risk in enumerate(risk_levels):
            if risk == 0:  # Low risk
                avg_stress = np.random.normal(3, 1)
                stress_trend = np.random.normal(-0.1, 0.2)
                mood_instability = np.random.exponential(1)
                missed_surveys = np.random.binomial(4, 0.1)
            elif risk == 1:  # Medium risk
                avg_stress = np.random.normal(5, 1.5)
                stress_trend = np.random.normal(0.0, 0.3)
                mood_instability = np.random.exponential(2)
                missed_surveys = np.random.binomial(4, 0.3)
            else:  # High risk
                avg_stress = np.random.normal(7, 2)
                stress_trend = np.random.normal(0.2, 0.4)
                mood_instability = np.random.exponential(3)
                missed_surveys = np.random.binomial(4, 0.6)
            
            # Clamp values to reasonable ranges
            avg_stress = np.clip(avg_stress, 1, 10)
            stress_trend = np.clip(stress_trend, -1, 1)
            mood_instability = np.clip(mood_instability, 0, 10)
            
            if i == 0:
                data['avg_stress_4weeks'] = [avg_stress]
                data['stress_trend_slope'] = [stress_trend]
                data['mood_instability_score'] = [mood_instability]
                data['missed_survey_count'] = [missed_surveys]
            else:
                data['avg_stress_4weeks'].append(avg_stress)
                data['stress_trend_slope'].append(stress_trend)
                data['mood_instability_score'].append(mood_instability)
                data['missed_survey_count'].append(missed_surveys)
        
        return pd.DataFrame(data)
    
    def generate_risk_levels(self) -> np.ndarray:
        """Generate risk levels based on defined probabilities"""
        return np.random.choice(3, self.n_samples, p=self.risk_probabilities)
    
    def generate_dataset(self) -> pd.DataFrame:
        """Generate complete dataset"""
        logger.info(f"Generating dataset with {self.n_samples} samples")
        
        # Generate risk levels first
        risk_levels = self.generate_risk_levels()
        
        # Generate all feature sets
        base_df = self.generate_base_features()
        behavior_df = self.generate_behavioral_features(risk_levels)
        incident_df = self.generate_incident_features(risk_levels)
        complaint_df = self.generate_complaint_features(risk_levels)
        wellbeing_df = self.generate_wellbeing_features(risk_levels)
        
        # Combine all dataframes
        final_df = pd.concat([
            base_df, behavior_df, incident_df, complaint_df, wellbeing_df
        ], axis=1)
        
        # Add risk level labels
        risk_labels = ['Low', 'Medium', 'High']
        final_df['risk_level'] = [risk_labels[risk] for risk in risk_levels]
        
        # Add student IDs
        final_df['student_id'] = [f'STU_{i:06d}' for i in range(self.n_samples)]
        
        # Reorder columns
        columns = ['student_id', 'risk_level'] + [
            col for col in final_df.columns if col not in ['student_id', 'risk_level']
        ]
        final_df = final_df[columns]
        
        logger.info(f"Dataset generated successfully. Shape: {final_df.shape}")
        logger.info(f"Risk distribution: {final_df['risk_level'].value_counts().to_dict()}")
        
        return final_df
    
    def save_dataset(self, df: pd.DataFrame, filepath: str):
        """Save dataset to file"""
        df.to_csv(filepath, index=False)
        logger.info(f"Dataset saved to {filepath}")
    
    def generate_realistic_sample(self, risk_level: str = 'Medium') -> Dict:
        """Generate a single realistic sample for testing"""
        risk_mapping = {'Low': 0, 'Medium': 1, 'High': 2}
        risk = risk_mapping[risk_level]
        
        if risk == 0:  # Low risk
            return {
                'year': np.random.choice([1, 2]),
                'days_in_hostel': np.random.randint(100, 300),
                'past_escalation_count': 0,
                'behavior_count_7d': 0,
                'behavior_count_30d': np.random.poisson(0.5),
                'severe_behavior_count_30d': 0,
                'behavior_weighted_score_30d': 0,
                'days_since_last_behavior': np.random.randint(60, 365),
                'incident_count_30d': np.random.poisson(0.2),
                'severe_incident_count_30d': 0,
                'incident_trend_slope': np.random.normal(-0.1, 0.1),
                'complaint_count_30d': np.random.poisson(0.1),
                'high_severity_complaint_count_30d': 0,
                'complaint_growth_rate': np.random.normal(-0.05, 0.05),
                'avg_stress_4weeks': np.random.normal(3, 0.5),
                'stress_trend_slope': np.random.normal(-0.1, 0.1),
                'mood_instability_score': np.random.exponential(0.5),
                'missed_survey_count': np.random.binomial(4, 0.1),
                'block_risk_score': np.random.uniform(2, 5),
                'floor_risk_score': np.random.uniform(2, 5),
                'room_risk_score': np.random.uniform(2, 5),
                'roommate_avg_risk_score': np.random.uniform(2, 5)
            }
        elif risk == 1:  # Medium risk
            return {
                'year': np.random.choice([2, 3]),
                'days_in_hostel': np.random.randint(50, 250),
                'past_escalation_count': np.random.poisson(1),
                'behavior_count_7d': np.random.poisson(0.5),
                'behavior_count_30d': np.random.poisson(2),
                'severe_behavior_count_30d': np.random.binomial(1, 0.2),
                'behavior_weighted_score_30d': np.random.poisson(3),
                'days_since_last_behavior': np.random.randint(14, 60),
                'incident_count_30d': np.random.poisson(1.5),
                'severe_incident_count_30d': np.random.binomial(1, 0.3),
                'incident_trend_slope': np.random.normal(0, 0.2),
                'complaint_count_30d': np.random.poisson(1),
                'high_severity_complaint_count_30d': np.random.binomial(1, 0.2),
                'complaint_growth_rate': np.random.normal(0, 0.1),
                'avg_stress_4weeks': np.random.normal(5, 1),
                'stress_trend_slope': np.random.normal(0, 0.2),
                'mood_instability_score': np.random.exponential(2),
                'missed_survey_count': np.random.binomial(4, 0.3),
                'block_risk_score': np.random.uniform(4, 7),
                'floor_risk_score': np.random.uniform(4, 7),
                'room_risk_score': np.random.uniform(4, 7),
                'roommate_avg_risk_score': np.random.uniform(4, 7)
            }
        else:  # High risk
            return {
                'year': np.random.choice([3, 4]),
                'days_in_hostel': np.random.randint(1, 200),
                'past_escalation_count': np.random.poisson(3),
                'behavior_count_7d': np.random.poisson(2),
                'behavior_count_30d': np.random.poisson(8),
                'severe_behavior_count_30d': np.random.poisson(2),
                'behavior_weighted_score_30d': np.random.poisson(15),
                'days_since_last_behavior': np.random.randint(0, 14),
                'incident_count_30d': np.random.poisson(5),
                'severe_incident_count_30d': np.random.poisson(2),
                'incident_trend_slope': np.random.normal(0.2, 0.3),
                'complaint_count_30d': np.random.poisson(3),
                'high_severity_complaint_count_30d': np.random.poisson(1),
                'complaint_growth_rate': np.random.normal(0.1, 0.15),
                'avg_stress_4weeks': np.random.normal(7, 1.5),
                'stress_trend_slope': np.random.normal(0.2, 0.3),
                'mood_instability_score': np.random.exponential(3),
                'missed_survey_count': np.random.binomial(4, 0.6),
                'block_risk_score': np.random.uniform(6, 10),
                'floor_risk_score': np.random.uniform(6, 10),
                'room_risk_score': np.random.uniform(6, 10),
                'roommate_avg_risk_score': np.random.uniform(6, 10)
            }
