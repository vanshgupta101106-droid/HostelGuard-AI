import os
import sys
import logging
import joblib
import json
import yaml
import numpy as np
import pandas as pd
from typing import Dict, Tuple, Any
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import xgboost as xgb
import optuna

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from src.features.feature_engineering import FeatureEngineer
from src.data.data_generator import DataGenerator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelTrainer:
    """Handles training of XGBoost model for student risk prediction"""
    
    def __init__(self, config_path: str = "config/config.yaml"):
        self.config = self.load_config(config_path)
        self.feature_engineer = FeatureEngineer()
        self.model = None
        self.best_params = None
        
    def load_config(self, config_path: str) -> Dict:
        """Load configuration from YAML file"""
        try:
            with open(config_path, 'r') as file:
                config = yaml.safe_load(file)
            logger.info(f"Configuration loaded from {config_path}")
            return config
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            raise
    
    def prepare_data(self, use_generated: bool = True, 
                    data_path: str = None) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Prepare training and testing data"""
        if use_generated:
            logger.info("Generating synthetic data...")
            generator = DataGenerator(n_samples=10000, random_state=42)
            df = generator.generate_dataset()
        else:
            logger.info(f"Loading data from {data_path}")
            df = pd.read_csv(data_path)
        
        # Preprocess features
        df_processed = self.feature_engineer.preprocess(df, fit_transformers=True)
        
        # Separate features and target
        feature_cols = [col for col in df_processed.columns 
                       if col not in ['student_id', 'risk_level', 
                                    'risk_level_encoded']]
        
        X = df_processed[feature_cols]
        y = df_processed['risk_level_encoded']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=self.config['model']['test_size'],
            random_state=self.config['model']['random_state'],
            stratify=y
        )
        
        logger.info(f"Data prepared. Train shape: {X_train.shape}, "
                   f"Test shape: {X_test.shape}")
        
        return (X_train, X_test, y_train, y_test), feature_cols
    
    def objective(self, trial: optuna.Trial, X_train: pd.DataFrame, 
                 y_train: pd.Series, X_val: pd.DataFrame, 
                 y_val: pd.Series) -> float:
        """Optuna objective function for hyperparameter tuning"""
        
        param = {
            'objective': self.config['xgboost_params']['objective'],
            'eval_metric': self.config['xgboost_params']['eval_metric'],
            'num_class': self.config['xgboost_params']['num_class'],
            'tree_method': 'hist',
            'lambda': trial.suggest_loguniform('lambda', 1e-3, 10.0),
            'alpha': trial.suggest_loguniform('alpha', 1e-3, 10.0),
            'colsample_bytree': trial.suggest_categorical(
                'colsample_bytree', [0.6, 0.7, 0.8, 0.9, 1.0]
            ),
            'subsample': trial.suggest_categorical(
                'subsample', [0.6, 0.7, 0.8, 0.9, 1.0]
            ),
            'learning_rate': trial.suggest_loguniform(
                'learning_rate', 1e-3, 0.3
            ),
            'n_estimators': trial.suggest_int('n_estimators', 100, 1000),
            'max_depth': trial.suggest_int('max_depth', 3, 12),
            'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
            'gamma': trial.suggest_loguniform('gamma', 1e-3, 10.0),
            'grow_policy': trial.suggest_categorical(
                'grow_policy', ['depthwise', 'lossguide']
            ),
            'random_state': self.config['model']['random_state']
        }
        
        # Create model without pruning callback for compatibility
        model = xgb.XGBClassifier(**param)
        
        model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False
        )
        
        # Predict on validation set
        y_pred = model.predict(X_val)
        accuracy = accuracy_score(y_val, y_pred)
        
        return accuracy
    
    def hyperparameter_tuning(self, X_train: pd.DataFrame, y_train: pd.Series) -> Dict:
        """Perform hyperparameter tuning with Optuna"""
        logger.info("Starting hyperparameter tuning...")
        
        # Create validation split
        X_train_part, X_val, y_train_part, y_val = train_test_split(
            X_train, y_train,
            test_size=0.2,
            random_state=self.config['model']['random_state'],
            stratify=y_train
        )
        
        # Create study
        study = optuna.create_study(
            direction='maximize',
            sampler=optuna.samplers.TPESampler(seed=42)
        )
        
        # Optimize
        study.optimize(
            lambda trial: self.objective(trial, X_train_part, y_train_part, X_val, y_val),
            n_trials=self.config['training']['n_trials'],
            timeout=1800,  # 30 minutes timeout
            show_progress_bar=True
        )
        
        best_params = study.best_params
        logger.info(f"Best parameters found: {best_params}")
        logger.info(f"Best validation accuracy: {study.best_value:.4f}")
        
        return best_params
    
    def train_model(self, X_train: pd.DataFrame, y_train: pd.Series,
                   tune_hyperparameters: bool = True) -> xgb.XGBClassifier:
        """Train the XGBoost model"""
        
        if tune_hyperparameters:
            best_params = self.hyperparameter_tuning(X_train, y_train)
            self.best_params = best_params
        else:
            best_params = self.config['xgboost_params']
            self.best_params = best_params
        
        # Add fixed parameters
        best_params.update({
            'objective': self.config['xgboost_params']['objective'],
            'eval_metric': self.config['xgboost_params']['eval_metric'],
            'num_class': self.config['xgboost_params']['num_class'],
            'random_state': self.config['model']['random_state']
        })
        
        logger.info("Training final model with best parameters...")
        
        # Create and train model
        self.model = xgb.XGBClassifier(**best_params)
        
        # Use cross-validation for more robust training
        cv = StratifiedKFold(
            n_splits=self.config['training']['cross_validation_folds'],
            shuffle=True,
            random_state=self.config['model']['random_state']
        )
        
        # Train on full training data
        self.model.fit(X_train, y_train, verbose=True)
        
        # Cross-validation scores
        cv_scores = cross_val_score(
            self.model, X_train, y_train,
            cv=cv, scoring='accuracy', n_jobs=-1
        )
        
        logger.info(f"Cross-validation accuracy: {cv_scores.mean():.4f} "
                   f"(±{cv_scores.std():.4f})")
        
        return self.model
    
    def evaluate_model(self, X_test: pd.DataFrame, y_test: pd.Series,
                      feature_names: list) -> Dict:
        """Evaluate the trained model"""
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        logger.info("Evaluating model...")
        
        # Predictions
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)
        
        # Metrics
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, output_dict=True)
        cm = confusion_matrix(y_test, y_pred)
        
        # Feature importance
        feature_importance = dict(zip(feature_names, self.model.feature_importances_))
        sorted_importance = dict(
            sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        )
        
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
        
        logger.info(f"Test accuracy: {accuracy:.4f}")
        
        return results
    
    def save_model(self, model_path: str = None, scaler_path: str = None,
                   results_path: str = None, feature_names: list = None):
        """Save trained model and artifacts"""
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        # Default paths
        if model_path is None:
            model_path = self.config['paths']['model_file']
        if scaler_path is None:
            scaler_path = self.config['paths']['scaler_file']
        if results_path is None:
            results_path = self.config['paths']['feature_importance']
        
        # Create directories if they don't exist
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        os.makedirs(os.path.dirname(scaler_path), exist_ok=True)
        os.makedirs(os.path.dirname(results_path), exist_ok=True)
        
        # Save model
        joblib.dump(self.model, model_path)
        logger.info(f"Model saved to {model_path}")
        
        # Save scaler
        joblib.dump(self.feature_engineer.scaler, scaler_path)
        logger.info(f"Scaler saved to {scaler_path}")
        
        # Save feature importance
        if feature_names:
            feature_importance = dict(
                zip(feature_names, self.model.feature_importances_)
            )
            with open(results_path, 'w') as f:
                json.dump(feature_importance, f, indent=2)
            logger.info(f"Feature importance saved to {results_path}")
        
        # Save best parameters
        if self.best_params:
            params_path = os.path.join(
                os.path.dirname(model_path), 'best_params.json'
            )
            with open(params_path, 'w') as f:
                json.dump(self.best_params, f, indent=2)
            logger.info(f"Best parameters saved to {params_path}")
    
    def train_and_evaluate(self, use_generated: bool = True,
                          data_path: str = None) -> Dict:
        """Complete training and evaluation pipeline"""
        logger.info("Starting complete training pipeline...")
        
        # Prepare data
        (X_train, X_test, y_train, y_test), feature_names = self.prepare_data(
            use_generated, data_path
        )
        
        # Train model
        self.train_model(
            X_train, y_train,
            tune_hyperparameters=self.config['training']['hyperparameter_tuning']
        )
        
        # Evaluate model
        results = self.evaluate_model(X_test, y_test, feature_names)
        
        # Save model and artifacts
        self.save_model(feature_names=feature_names)
        
        logger.info("Training pipeline completed successfully!")
        
        return results


def main():
    """Main training function"""
    trainer = ModelTrainer()
    
    # Train and evaluate
    results = trainer.train_and_evaluate(use_generated=True)
    
    # Print results
    print("\n" + "="*50)
    print("TRAINING RESULTS")
    print("="*50)
    print(f"Test Accuracy: {results['accuracy']:.4f}")
    print("\nClassification Report:")
    for class_name, metrics in results['classification_report'].items():
        if isinstance(metrics, dict):
            print(f"{class_name}:")
            for metric, value in metrics.items():
                print(f"  {metric}: {value:.4f}")
    
    print("\nTop 10 Feature Importance:")
    for i, (feature, importance) in enumerate(
        list(results['feature_importance'].items())[:10]
    ):
        print(f"{i+1}. {feature}: {importance:.4f}")


if __name__ == "__main__":
    main()
