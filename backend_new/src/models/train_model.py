# Import the standard 'os' module for internal file path operations and directory management.
import os

# Import the 'sys' module to interact with the Python search path and current runtime state.
import sys

# Import the 'logging' module to handle application logs and status messages.
import logging

# Import 'joblib' for efficient serialization and deserialization of large numerical objects like models.
import joblib

# Import 'json' for handling structured data exchange in JSON format.
import json

# Import 'yaml' for parsing and loading configuration files in YAML format.
import yaml

# Import 'numpy' as 'np' for high-performance numerical and array computing.
import numpy as np

# Import 'pandas' as 'pd' to provide powerful data structures like DataFrames for data analysis.
import pandas as pd

# Import typing hints to improve code readability and facilitate static analysis.
from typing import Dict, Tuple, Any

# Import scikit-learn utilities for splitting datasets and performing cross-validation.
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score

# Import scikit-learn metrics to evaluate the performance of the classification model.
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

# Import the XGBoost library for gradient-boosted decision tree algorithm support.
import xgboost as xgb

# Import 'optuna' for automated hyperparameter optimization using advanced sampling techniques.
import optuna

# Adjust the system path to include the root of the project so that 'src' submodules can be correctly referenced.
# 'os.path.join(..., '..', '..')' navigates two levels up from this script's directory.
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

# Import the internal 'FeatureEngineer' class to manage data transformations.
from src.features.feature_engineering import FeatureEngineer

# Import the internal 'DataGenerator' class to create synthetic training datasets.
from src.data.data_generator import DataGenerator

# Set the default logging level to INFO to track major script milestones.
logging.basicConfig(level=logging.INFO)

# Create a logger specific to this training module.
logger = logging.getLogger(__name__)

# Define the central class responsible for orchestrating the end-to-equal XGBoost training workflow.
class ModelTrainer:
    """Handles training of XGBoost model for student risk prediction"""
    
    # The constructor initializes the trainer with configuration settings and utility classes.
    def __init__(self, config_path: str = "config/config.yaml"):
        # Load the configuration dictionary from the specified YAML file path.
        self.config = self.load_config(config_path)
        # Instantiate the feature engineering helper.
        self.feature_engineer = FeatureEngineer()
        # Placeholder for the final trained model.
        self.model = None
        # Placeholder for the best set of hyperparameters found during tuning.
        self.best_params = None
        
    # Method to safely read and parse a YAML configuration file.
    def load_config(self, config_path: str) -> Dict:
        """Load configuration from YAML file"""
        try:
            # Open the file in read mode.
            with open(config_path, 'r') as file:
                # Use safe_load to convert YAML text into a standard Python dictionary.
                config = yaml.safe_load(file)
            # Log the successful loading of configurations.
            logger.info(f"Configuration loaded from {config_path}")
            # Return the resulting configuration dictionary.
            return config
        # Catch and report any issues encountered during file reading.
        except Exception as e:
            # Log the error details.
            logger.error(f"Error loading config: {e}")
            # Reraise the exception as the config is critical for execution.
            raise
    
    # Method to acquire and preprocess the data needed for training and testing.
    def prepare_data(self, use_generated: bool = True, 
                    data_path: str = None) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Prepare training and testing data"""
        # Determine if data should be created on-the-fly or loaded from a file.
        if use_generated:
            # Proceed with synthetic data generation if requested.
            logger.info("Generating synthetic data...")
            # Initialize the generator with a fixed seed for reproducibility.
            generator = DataGenerator(n_samples=10000, random_state=42)
            # Produce the full synthetic dataset.
            df = generator.generate_dataset()
        else:
            # Otherwise, read existing data from a CSV file.
            logger.info(f"Loading data from {data_path}")
            df = pd.read_csv(data_path)
        
        # Apply normalization, scaling, and feature creation via the feature engineer.
        # 'fit_transformers=True' tells it to learn parameters like mean/std from this data.
        df_processed = self.feature_engineer.preprocess(df, fit_transformers=True)
        
        # Identify the relevant feature columns, excluding IDs and target labels.
        feature_cols = [col for col in df_processed.columns 
                       if col not in ['student_id', 'risk_level', 
                                     'risk_level_encoded']]
        
        # Select the independent variables (X).
        X = df_processed[feature_cols]
        # Select the dependent variable (y) representing the risk category.
        y = df_processed['risk_level_encoded']
        
        # Divide the dataset into training and testing subsets.
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            # Set the percentage of data used for testing from the config.
            test_size=self.config['model']['test_size'],
            # Use a constant seed to ensure matching splits across runs.
            random_state=self.config['model']['random_state'],
            # Use stratify to ensure class distribution remains balanced between splits.
            stratify=y
        )
        
        # Log the final dimensions of the prepared datasets.
        logger.info(f"Data prepared. Train shape: {X_train.shape}, "
                   f"Test shape: {X_test.shape}")
        
        # Return the split data and the list of feature names.
        return (X_train, X_test, y_train, y_test), feature_cols
    
    # Internal method used by Optuna to evaluate a single set of hyperparameters.
    def objective(self, trial: optuna.Trial, X_train: pd.DataFrame, 
                 y_train: pd.Series, X_val: pd.DataFrame, 
                 y_val: pd.Series) -> float:
        """Optuna objective function for hyperparameter tuning"""
        
        # Define the search space for various XGBoost parameters.
        param = {
            # Core problem type (e.g., multi-class classification).
            'objective': self.config['xgboost_params']['objective'],
            # Method for tracking internal model performance.
            'eval_metric': self.config['xgboost_params']['eval_metric'],
            # Number of unique classes in the target label.
            'num_class': self.config['xgboost_params']['num_class'],
            # Using histogram-based tree splitting for faster training.
            'tree_method': 'hist',
            # L2 regularization term (logarithmically sampled).
            'lambda': trial.suggest_loguniform('lambda', 1e-3, 10.0),
            # L1 regularization term (logarithmically sampled).
            'alpha': trial.suggest_loguniform('alpha', 1e-3, 10.0),
            # Fraction of columns sampled for each tree.
            'colsample_bytree': trial.suggest_categorical(
                'colsample_bytree', [0.6, 0.7, 0.8, 0.9, 1.0]
            ),
            # Fraction of rows sampled for each boosting round.
            'subsample': trial.suggest_categorical(
                'subsample', [0.6, 0.7, 0.8, 0.9, 1.0]
            ),
            # Learning rate controller (shrinkage).
            'learning_rate': trial.suggest_loguniform(
                'learning_rate', 1e-3, 0.3
            ),
            # Total number of boosting iterations.
            'n_estimators': trial.suggest_int('n_estimators', 100, 1000),
            # Maximum depth of individual decision trees.
            'max_depth': trial.suggest_int('max_depth', 3, 12),
            # Minimum sum of instance weight needed in a child.
            'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
            # Minimum loss reduction required for a split.
            'gamma': trial.suggest_loguniform('gamma', 1e-3, 10.0),
            # Method for managing tree growth structure.
            'grow_policy': trial.suggest_categorical(
                'grow_policy', ['depthwise', 'lossguide']
            ),
            # Maintain consistency with the global random state.
            'random_state': self.config['model']['random_state']
        }
        
        # Initialize the classifier with the trial parameters.
        model = xgb.XGBClassifier(**param)
        
        # Train the model while observing its performance on a held-out validation set.
        model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            # Hide detailed logging for each boosting round to keep output clean.
            verbose=False
        )
        
        # Generate predictions for the validation split.
        y_pred = model.predict(X_val)
        # Calculate accuracy on the validation split.
        accuracy = accuracy_score(y_val, y_pred)
        
        # Return the accuracy score; Optuna aims to maximize this value.
        return accuracy
    
    # Method to manage the overall hyperparameter search process.
    def hyperparameter_tuning(self, X_train: pd.DataFrame, y_train: pd.Series) -> Dict:
        """Perform hyperparameter tuning with Optuna"""
        # Log the start of the tuning process.
        logger.info("Starting hyperparameter tuning...")
        
        # Create a smaller internal split to use for evaluating different trials.
        X_train_part, X_val, y_train_part, y_val = train_test_split(
            X_train, y_train,
            test_size=0.2,
            random_state=self.config['model']['random_state'],
            stratify=y_train
        )
        
        # Initialize an Optuna study aiming to maximize the objective function.
        study = optuna.create_study(
            direction='maximize',
            # Use TPE (Tree-structured Parzen Estimator) for efficient sampling.
            sampler=optuna.samplers.TPESampler(seed=42)
        )
        
        # Start the optimization process.
        study.optimize(
            # Call the objective function for each trial loop.
            lambda trial: self.objective(trial, X_train_part, y_train_part, X_val, y_val),
            # Limit the number of trials as defined in the config.
            n_trials=self.config['training']['n_trials'],
            # Set a hard time limit to prevent indefinite searching.
            timeout=1800,
            # Display a progress bar in the terminal.
            show_progress_bar=True
        )
        
        # Get the configuration from the best trial.
        best_params = study.best_params
        # Log the winning parameters.
        logger.info(f"Best parameters found: {best_params}")
        # Log the highest accuracy reached during the search.
        logger.info(f"Best validation accuracy: {study.best_value:.4f}")
        
        # Return the optimal settings.
        return best_params
    
    # Method to train the definitive version of the model.
    def train_model(self, X_train: pd.DataFrame, y_train: pd.Series,
                   tune_hyperparameters: bool = True) -> xgb.XGBClassifier:
        """Train the XGBoost model"""
        
        # Decide whether to hunt for optimal parameters or use the defaults from the config.
        if tune_hyperparameters:
            # Invoke the tuning logic.
            best_params = self.hyperparameter_tuning(X_train, y_train)
            # Store the resulting parameters in the instance state.
            self.best_params = best_params
        else:
            # Fall back to base parameters.
            best_params = self.config['xgboost_params']
            self.best_params = best_params
        
        # Merge best parameters with mandatory static configurations.
        best_params.update({
            'objective': self.config['xgboost_params']['objective'],
            'eval_metric': self.config['xgboost_params']['eval_metric'],
            'num_class': self.config['xgboost_params']['num_class'],
            'random_state': self.config['model']['random_state']
        })
        
        # Log the step of building the final model instance.
        logger.info("Training final model with best parameters...")
        
        # Create the classifier object with the merged parameter set.
        self.model = xgb.XGBClassifier(**best_params)
        
        # Set up a cross-validation strategy for performance verification.
        cv = StratifiedKFold(
            n_splits=self.config['training']['cross_validation_folds'],
            shuffle=True,
            random_state=self.config['model']['random_state']
        )
        
        # Fit the model on the complete training set.
        self.model.fit(X_train, y_train, verbose=True)
        
        # Run cross-validation to get a stable estimate of the model's accuracy.
        cv_scores = cross_val_score(
            self.model, X_train, y_train,
            cv=cv, scoring='accuracy', n_jobs=-1
        )
        
        # Log the average cross-validation accuracy and its standard deviation.
        logger.info(f"Cross-validation accuracy: {cv_scores.mean():.4f} "
                   f"(±{cv_scores.std():.4f})")
        
        # Return the trained model object.
        return self.model
    
    # Method to perform a post-training evaluation on a distinct test dataset.
    def evaluate_model(self, X_test: pd.DataFrame, y_test: pd.Series,
                      feature_names: list) -> Dict:
        """Evaluate the trained model"""
        # Ensure that the model has actually been trained before evaluating.
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        # Log the start of evaluation.
        logger.info("Evaluating model...")
        
        # Generate discrete class predictions for the test set.
        y_pred = self.model.predict(X_test)
        # Generate raw probability scores for each class.
        y_pred_proba = self.model.predict_proba(X_test)
        
        # Calculate the base accuracy percentage.
        accuracy = accuracy_score(y_test, y_pred)
        # Compile a detailed report including precision, recall, and f1-score per class.
        report = classification_report(y_test, y_pred, output_dict=True)
        # Create a confusion matrix to visualize prediction errors.
        cm = confusion_matrix(y_test, y_pred)
        
        # Map feature names to their relative importance scores according to the trees.
        feature_importance = dict(zip(feature_names, self.model.feature_importances_))
        # Sort the features by importance in descending order.
        sorted_importance = dict(
            sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        )
        
        # Aggregate all metrics into a final results dictionary.
        results = {
            'accuracy': accuracy,
            'classification_report': report,
            'confusion_matrix': cm.tolist(),
            'feature_importance': sorted_importance,
            'predictions': {
                'y_true': y_test.tolist(),
                'y_pred': y_pred.tolist(),
                'y_pred_proba': y_pred_proba.tolist()
            }
        }
        
        # Log the final accuracy achieved on the test board.
        logger.info(f"Test accuracy: {accuracy:.4f}")
        
        # Return the complete results set.
        return results
    
    # Method to persist the trained model and its associated metadata to disk.
    def save_model(self, model_path: str = None, scaler_path: str = None,
                   results_path: str = None, feature_names: list = None):
        """Save trained model and artifacts"""
        # Fatal error if attempting to save a non-existent model.
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        # Populate file paths from instance configuration if not explicitly provided.
        if model_path is None:
            model_path = self.config['paths']['model_file']
        if scaler_path is None:
            scaler_path = self.config['paths']['scaler_file']
        if results_path is None:
            results_path = self.config['paths']['feature_importance']
        
        # Ensure that the destination directories exist on the filesystem.
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        os.makedirs(os.path.dirname(scaler_path), exist_ok=True)
        os.makedirs(os.path.dirname(results_path), exist_ok=True)
        
        # Save the XGBoost classifier object to a binary file.
        joblib.dump(self.model, model_path)
        # Log the location where the model was saved.
        logger.info(f"Model saved to {model_path}")
        
        # Save the fitted scaler so data can be reliably processed during inference.
        joblib.dump(self.feature_engineer.scaler, scaler_path)
        # Log the scaler's storage location.
        logger.info(f"Scaler saved to {scaler_path}")
        
        # If feature names are provided, export the importance rankings to a JSON file.
        if feature_names:
            feature_importance = dict(
                zip(feature_names, self.model.feature_importances_)
            )
            # Open the file for writing.
            with open(results_path, 'w') as f:
                # Use JSON format for compatibility and readability.
                json.dump(feature_importance, f, indent=2)
            # Log the successful export.
            logger.info(f"Feature importance saved to {results_path}")
        
        # If hyperparameter tuning was used, save the winning parameters.
        if self.best_params:
            params_path = os.path.join(
                os.path.dirname(model_path), 'best_params.json'
            )
            # Open the parameters file for writing.
            with open(params_path, 'w') as f:
                # Write the parameter dictionary as a JSON object.
                json.dump(self.best_params, f, indent=2)
            # Log the parameter storage path.
            logger.info(f"Best parameters saved to {params_path}")
    
    # High-level wrapper method that runs the entire ML pipeline from data to saved model.
    def train_and_evaluate(self, use_generated: bool = True,
                          data_path: str = None) -> Dict:
        """Complete training and evaluation pipeline"""
        # Log the initiation of the full sequence.
        logger.info("Starting complete training pipeline...")
        
        # Step 1: Collect and clean data.
        (X_train, X_test, y_train, y_test), feature_names = self.prepare_data(
            use_generated, data_path
        )
        
        # Step 2: Fit the model, optionally tuning its parameters.
        self.train_model(
            X_train, y_train,
            tune_hyperparameters=self.config['training']['hyperparameter_tuning']
        )
        
        # Step 3: Run performance tests on the test split.
        results = self.evaluate_model(X_test, y_test, feature_names)
        
        # Step 4: Persist everything to files for future usage.
        self.save_model(feature_names=feature_names)
        
        # Log the successful completion of the entire pipeline.
        logger.info("Training pipeline completed successfully!")
        
        # Return combined evaluation metrics.
        return results


# Global entrance point for when the script is run directly.
def main():
    """Main training function"""
    # Create an instance of the ModelTrainer class.
    trainer = ModelTrainer()
    
    # Kick off the combined training and evaluation sequence.
    results = trainer.train_and_evaluate(use_generated=True)
    
    # Print a summary report to the terminal.
    print("\n" + "="*50)
    print("TRAINING RESULTS")
    print("="*50)
    # Output the final test accuracy.
    print(f"Test Accuracy: {results['accuracy']:.4f}")
    # Print the specific metrics for each risk class.
    print("\nClassification Report:")
    for class_name, metrics in results['classification_report'].items():
        # Iterate over individual metrics like precision and recall if metrics is a dictionary.
        if isinstance(metrics, dict):
            print(f"{class_name}:")
            for metric, value in metrics.items():
                print(f"  {metric}: {value:.4f}")
    
    # Print the top 10 most influential features identified by the model.
    print("\nTop 10 Feature Importance:")
    for i, (feature, importance) in enumerate(
        list(results['feature_importance'].items())[:10]
    ):
        # Format the output for clear reading.
        print(f"{i+1}. {feature}: {importance:.4f}")


# Standard entry condition for execution as a standalone script.
if __name__ == "__main__":
    # Call the main logic.
    main()
