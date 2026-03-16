#!/usr/bin/env python3

import os
import sys
import logging
import pandas as pd
import numpy as np

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.models.train_model import ModelTrainer
from src.evaluation.evaluate_model import ModelEvaluator

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Main evaluation script"""
    logger.info("Starting model evaluation...")
    
    try:
        # Check if model exists
        model_path = "models/xgboost_risk_model.pkl"
        scaler_path = "models/scaler.pkl"
        
        if not os.path.exists(model_path):
            logger.error(f"Model not found at {model_path}")
            logger.info("Please run 'python train.py' first to train the model")
            sys.exit(1)
        
        # Initialize evaluator
        evaluator = ModelEvaluator(model_path, scaler_path)
        
        # Generate test data for evaluation
        logger.info("Generating test data...")
        trainer = ModelTrainer()
        (X_train, X_test, y_train, y_test), feature_names = trainer.prepare_data(
            use_generated=True
        )
        
        # Perform comprehensive evaluation
        logger.info("Performing comprehensive evaluation...")
        results = evaluator.comprehensive_evaluation(
            X_test, y_test, feature_names,
            save_plots=True,
            save_results=True,
            output_dir="evaluation_results"
        )
        
        logger.info("Evaluation completed successfully!")
        logger.info("Results saved to evaluation_results/ directory")
        
    except Exception as e:
        logger.error(f"Evaluation failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
