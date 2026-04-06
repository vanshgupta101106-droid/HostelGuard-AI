#!/usr/bin/env python3
"""
Student Risk Model Training Script

This script trains a machine learning model to predict student risk levels
based on behavioral and academic indicators. The trained model is used by
the HostelGuard AI system for risk assessment and monitoring.
"""

import os
import sys
import logging

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Import the model trainer class
from src.models.train_model import ModelTrainer

# Configure logging to display timestamp, logger name, level, and message
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """
    Main training function.
    
    This function orchestrates the entire training pipeline:
    1. Initializes the model trainer
    2. Trains and evaluates the model on generated data
    3. Displays training results and feature importance
    4. Saves the trained model and artifacts
    """
    logger.info("Starting student risk model training...")
    
    try:
        # Initialize the ModelTrainer instance
        trainer = ModelTrainer()
        
        # Train the model using synthetic generated data
        # Returns a dictionary containing accuracy metrics and feature importance scores
        results = trainer.train_and_evaluate(use_generated=True)
        
        logger.info("Training completed successfully!")
        
        # Print training summary to console
        print("\n" + "="*50)
        print("TRAINING COMPLETED SUCCESSFULLY!")
        print("="*50)
        # Display overall model accuracy on test set
        print(f"Test Accuracy: {results['accuracy']:.4f}")
        
        # Display the top 10 most important features influencing predictions
        print("\nTop 10 Important Features:")
        for i, (feature, importance) in enumerate(
            list(results['feature_importance'].items())[:10]
        ):
            print(f"{i+1:2d}. {feature}: {importance:.4f}")
        
        # Provide next steps for user
        print("\nModel and artifacts saved to models/ directory")
        print("Run 'python evaluate.py' to see detailed evaluation results")
        
    except Exception as e:
        # Log any errors that occur during training
        logger.error(f"Training failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
