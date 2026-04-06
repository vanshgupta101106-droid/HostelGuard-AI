# Import the pandas library to enable powerful data manipulation and analysis using DataFrames.
import pandas as pd

# Import the numpy library for high-performance numerical computations and random number generation.
import numpy as np

# Import type hinting tools to clearly document the expected data structures in function signatures.
from typing import Dict, List, Tuple

# Import the logging module to record internal processes and track the generation status.
import logging

# Set up a logger instance specifically for this data generation module.
logger = logging.getLogger(__name__)

# The DataGenerator class is responsible for creating a realistic synthetic dataset for student risk simulation.
class DataGenerator:
    """Generates synthetic data for student risk prediction"""
    
    # Initialize the generator with the desired sample count and a fixed seed for reproducibility.
    def __init__(self, n_samples: int = 10000, random_state: int = 42):
        # Total number of synthetic student records to produce.
        self.n_samples = n_samples
        # Fixed state for the random number generator to ensure consistent output across runs.
        self.random_state = random_state
        # Apply the seed directly to numpy's global random state.
        np.random.seed(random_state)
        
        # Define the basic frequency distribution for each risk level (Low, Medium, High).
        self.risk_probabilities = [0.6, 0.3, 0.1]  # 60% Low, 30% Medium, 10% High
        
    # Method to create the non-behavioral, fundamental attributes of the student population.
    def generate_base_features(self) -> pd.DataFrame:
        """Generate base features for students"""
        # Create a dictionary containing various structural and environmental risk metrics.
        data = {
            # Randomly assign a student year (1-4) using a weighted distribution where younger students are more common.
            'year': np.random.choice([1, 2, 3, 4], self.n_samples, p=[0.3, 0.3, 0.25, 0.15]),
            # Uniformly distribute the number of days the student has lived in the hostel.
            'days_in_hostel': np.random.randint(1, 365, self.n_samples),
            # Use a Poisson distribution to model the count of past formal escalations.
            'past_escalation_count': np.random.poisson(0.5, self.n_samples),
            # Generate continuous risk scores for the specific hostel block, floor, and room.
            'block_risk_score': np.random.uniform(1, 10, self.n_samples),
            'floor_risk_score': np.random.uniform(1, 10, self.n_samples),
            'room_risk_score': np.random.uniform(1, 10, self.n_samples),
            # Assign an average risk score representing the student's roommates.
            'roommate_avg_risk_score': np.random.uniform(1, 10, self.n_samples)
        }
        # Convert the dictionary into a pandas DataFrame and return it.
        return pd.DataFrame(data)
    
    # Method to create behavioral data points that vary significantly based on the assigned risk level.
    def generate_behavioral_features(self, risk_levels: np.ndarray) -> pd.DataFrame:
        """Generate behavioral features based on risk levels"""
        # Dictionary to store the resulting columns.
        data = {}
        
        # Loop through each student's assigned risk category to generate corresponding behavioral histories.
        for i, risk in enumerate(risk_levels):
            # Branch logic to produce different statistical profiles for Low, Medium, and High risk students.
            if risk == 0:  # Profile for Low risk students (index 0).
                # Infrequent incidents modeled with small Poisson means.
                behavior_7d = np.random.poisson(0.1)
                behavior_30d = np.random.poisson(0.3)
                # Severe behavior is extremely rare for this group.
                severe_behavior_30d = 0 if np.random.random() > 0.05 else np.random.poisson(1)
                # Significant time since the last incident.
                days_since_last = np.random.randint(30, 365)
            elif risk == 1:  # Profile for Medium risk students (index 1).
                # Moderately frequent incidents.
                behavior_7d = np.random.poisson(0.5)
                behavior_30d = np.random.poisson(2)
                # Higher chance of seeing a severe behavior incident.
                severe_behavior_30d = 0 if np.random.random() > 0.2 else np.random.poisson(1)
                # Recency of last incident is closer than low risk.
                days_since_last = np.random.randint(7, 90)
            else:  # Profile for High risk students (index 2).
                # High frequency of incidents in both short and medium term.
                behavior_7d = np.random.poisson(2)
                behavior_30d = np.random.poisson(8)
                # Frequent severe behavior reports.
                severe_behavior_30d = np.random.poisson(2)
                # Very recent history of behavioral issues.
                days_since_last = np.random.randint(0, 30)
            
            # Initialize or append values to the results dictionary.
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
        
        # Derived feature: calculate a weighted score where severe behavior carries much more weight.
        data['behavior_weighted_score_30d'] = [
            b * 1 + sb * 3 for b, sb in zip(
                data['behavior_count_30d'], data['severe_behavior_count_30d']
            )
        ]
        
        # Return the final behavioral DataFrame.
        return pd.DataFrame(data)
    
    # Method to simulate general campus or hostel incidents associated with the student.
    def generate_incident_features(self, risk_levels: np.ndarray) -> pd.DataFrame:
        """Generate incident-related features based on risk levels"""
        # Placeholder dictionary.
        data = {}
        
        # Loop through each record to generate incident stats based on risk level.
        for i, risk in enumerate(risk_levels):
            if risk == 0:  # Low risk logic.
                # Very few incidents and usually a declining or stable trend.
                incident_30d = np.random.poisson(0.2)
                severe_incident_30d = 0
                trend_slope = np.random.normal(-0.1, 0.2)
            elif risk == 1:  # Medium risk logic.
                # Average number of incidents.
                incident_30d = np.random.poisson(1.5)
                # 30% chance of a severe incident being recorded.
                severe_incident_30d = 0 if np.random.random() > 0.3 else 1
                trend_slope = np.random.normal(0.0, 0.3)
            else:  # High risk logic.
                # Frequent and often severe incidents.
                incident_30d = np.random.poisson(5)
                severe_incident_30d = np.random.poisson(2)
                # Likely an upward (positive) trend in frequency.
                trend_slope = np.random.normal(0.2, 0.4)
            
            # Populate data frame dictionary.
            if i == 0:
                data['incident_count_30d'] = [incident_30d]
                data['severe_incident_count_30d'] = [severe_incident_30d]
                data['incident_trend_slope'] = [trend_slope]
            else:
                data['incident_count_30d'].append(incident_30d)
                data['severe_incident_count_30d'].append(severe_incident_30d)
                data['incident_trend_slope'].append(trend_slope)
        
        # Return as a DataFrame.
        return pd.DataFrame(data)
    
    # Method to generate formal complaints filed against the student by staff or peers.
    def generate_complaint_features(self, risk_levels: np.ndarray) -> pd.DataFrame:
        """Generate complaint-related features based on risk levels"""
        # Placeholder dictionary.
        data = {}
        
        # Iterative generation based on risk profiles.
        for i, risk in enumerate(risk_levels):
            if risk == 0:  # Low risk.
                # Almost no complaints.
                complaint_30d = np.random.poisson(0.1)
                high_severity_30d = 0
                growth_rate = np.random.normal(-0.05, 0.1)
            elif risk == 1:  # Medium risk.
                # Occasional complaints.
                complaint_30d = np.random.poisson(1)
                high_severity_30d = 0 if np.random.random() > 0.2 else 1
                growth_rate = np.random.normal(0.0, 0.15)
            else:  # High risk.
                # Multiple complaints with a notable growth rate.
                complaint_30d = np.random.poisson(3)
                high_severity_30d = np.random.poisson(1)
                growth_rate = np.random.normal(0.1, 0.2)
            
            # Record results.
            if i == 0:
                data['complaint_count_30d'] = [complaint_30d]
                data['high_severity_complaint_count_30d'] = [high_severity_30d]
                data['complaint_growth_rate'] = [growth_rate]
            else:
                data['complaint_count_30d'].append(complaint_30d)
                data['high_severity_complaint_count_30d'].append(high_severity_30d)
                data['complaint_growth_rate'].append(growth_rate)
        
        # Return as DataFrame.
        return pd.DataFrame(data)
    
    # Method to simulate self-reported wellbeing and survey compliance metrics.
    def generate_wellbeing_features(self, risk_levels: np.ndarray) -> pd.DataFrame:
        """Generate wellbeing and mental health features"""
        # Placeholder dictionary.
        data = {}
        
        # Profile-based generation loop.
        for i, risk in enumerate(risk_levels):
            if risk == 0:  # Low risk.
                # Low stress, stable mood, and high survey compliance.
                avg_stress = np.random.normal(3, 1)
                stress_trend = np.random.normal(-0.1, 0.2)
                mood_instability = np.random.exponential(1)
                missed_surveys = np.random.binomial(4, 0.1)
            elif risk == 1:  # Medium risk.
                # Moderate stress with occasional missed surveys.
                avg_stress = np.random.normal(5, 1.5)
                stress_trend = np.random.normal(0.0, 0.3)
                mood_instability = np.random.exponential(2)
                missed_surveys = np.random.binomial(4, 0.3)
            else:  # High risk.
                # High stress levels, volatile mood, and frequent non-compliance with surveys.
                avg_stress = np.random.normal(7, 2)
                stress_trend = np.random.normal(0.2, 0.4)
                mood_instability = np.random.exponential(3)
                missed_surveys = np.random.binomial(4, 0.6)
            
            # Enforce strict boundaries on the simulated metrics to keep them within realistic ranges.
            avg_stress = np.clip(avg_stress, 1, 10)
            stress_trend = np.clip(stress_trend, -1, 1)
            mood_instability = np.clip(mood_instability, 0, 10)
            
            # Log the student-specific metadata.
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
        
        # Return resulting DataFrame.
        return pd.DataFrame(data)
    
    # Utility method to randomly assign a ground-truth risk level to each record based on preset probabilities.
    def generate_risk_levels(self) -> np.ndarray:
        """Generate risk levels based on defined probabilities"""
        # Choose from index 0 (Low), 1 (Medium), or 2 (High).
        return np.random.choice(3, self.n_samples, p=self.risk_probabilities)
    
    # Master method that orchestrates all individual feature generation steps into a single complete dataset.
    def generate_dataset(self) -> pd.DataFrame:
        """Generate complete dataset"""
        # Log the start of the heavy lifting.
        logger.info(f"Generating dataset with {self.n_samples} samples")
        
        # Step 1: Establish the labels first so that features can be generated relative to them.
        risk_levels = self.generate_risk_levels()
        
        # Step 2: Call each feature generating method to build the component DataFrames.
        base_df = self.generate_base_features()
        behavior_df = self.generate_behavioral_features(risk_levels)
        incident_df = self.generate_incident_features(risk_levels)
        complaint_df = self.generate_complaint_features(risk_levels)
        wellbeing_df = self.generate_wellbeing_features(risk_levels)
        
        # Step 3: Merge all horizontally into a single large table.
        final_df = pd.concat([
            base_df, behavior_df, incident_df, complaint_df, wellbeing_df
        ], axis=1)
        
        # Step 4: Add descriptive risk level strings based on the original numeric assignments.
        risk_labels = ['Low', 'Medium', 'High']
        final_df['risk_level'] = [risk_labels[risk] for risk in risk_levels]
        
        # Step 5: Assign unique, formatted identifiers to each synthetic student record.
        final_df['student_id'] = [f'STU_{i:06d}' for i in range(self.n_samples)]
        
        # Step 6: Finalize the column layout for standard data exports (IDs and labels first).
        columns = ['student_id', 'risk_level'] + [
            col for col in final_df.columns if col not in ['student_id', 'risk_level']
        ]
        final_df = final_df[columns]
        
        # Final status logging.
        logger.info(f"Dataset generated successfully. Shape: {final_df.shape}")
        # Print a summary of how many students ended up in each category.
        logger.info(f"Risk distribution: {final_df['risk_level'].value_counts().to_dict()}")
        
        # Return the finished dataset.
        return final_df
    
    # Utility method to save the final generated output to a physical CSV file.
    def save_dataset(self, df: pd.DataFrame, filepath: str):
        """Save dataset to file"""
        # Write to disk, omitting the noisy pandas index.
        df.to_csv(filepath, index=False)
        # Log destination.
        logger.info(f"Dataset saved to {filepath}")
    
    # Method to generate exactly one realistic student profile for edge-case testing or debugging.
    def generate_realistic_sample(self, risk_level: str = 'Medium') -> Dict:
        """Generate a single realistic sample for testing"""
        # Map the incoming string label to its internal numeric integer.
        risk_mapping = {'Low': 0, 'Medium': 1, 'High': 2}
        risk = risk_mapping[risk_level]
        
        # Return a manually tuned dictionary representing a "typical" student for that risk category.
        if risk == 0:  # Manual profile for Low risk.
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
        elif risk == 1:  # Manual profile for Medium risk.
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
        else:  # Manual profile for High risk.
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
