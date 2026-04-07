#!/usr/bin/env python3
# Standard shebang line specifying that this script should be executed using the Python 3 interpreter.

# Importing the 'os' module to perform system-level tasks such as file path manipulation and checking file existence.
import os

# Importing the 'sys' module to interact with the Python runtime, such as modifying the module search path or exiting the script.
import sys

# Importing the 'logging' module to handle diagnostic messaging and track script progress.
import logging

# Importing 'pandas' as 'pd' to handle structured data, though not directly used in this script, it's often a dependency for ML.
import pandas as pd

# Importing 'numpy' as 'np' for numerical computing and array operations, similar to pandas.
import numpy as np

# Setting up the project structure by adding the 'src' directory to the Python system path.
# 'os.path.dirname(__file__)' locates the current script's folder.
# 'os.path.join(..., 'src')' creates the absolute path to the 'src' directory.
# 'sys.path.append(...)' adds this path to 'sys.path' so Python can find and import internal modules.
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Importing 'ModelTrainer' from the 'src.models.train_model' module to reuse its data preparation logic.
from src.models.train_model import ModelTrainer

# Importing 'ModelEvaluator' from 'src.evaluation.evaluate_model' to perform model-specific performance assessments.
from src.evaluation.evaluate_model import ModelEvaluator

# Setting the global logging configuration to provide structured output.
logging.basicConfig(
    # Set logging level to INFO for capturing important progress messages.
    level=logging.INFO,
    # Define a consistent format for logs, including timestamps, logger name, severity, and the message.
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Creating a logger instance specifically for this script to manage diagnostic output.
logger = logging.getLogger(__name__)

# Defining the main entry point function for the model evaluation process.
def main():
    # A short docstring describing the main task of this script.
    """Main evaluation script"""
    
    # Logging a message to indicate that the evaluation phase has started.
    logger.info("Starting model evaluation...")
    
    # Using a try-except block to gracefully handle any unexpected errors during script execution.
    try:
        # Define the location where the trained XGBoost model is expected to be saved.
        model_path = "models/xgboost_risk_model.pkl"
        
        # Define the location where the feature scaler (normalization/standardization) is expected to be saved.
        scaler_path = "models/scaler.pkl"
        
        # Check if the model file exists before proceeding; evaluation cannot happen without it.
        if not os.path.exists(model_path):
            # Log an error message indicating the model file was not found.
            logger.error(f"Model not found at {model_path}")
            
            # Suggest the logical next step (running the training script) to the user.
            logger.info("Please run 'python train.py' first to train the model")
            
            # Exit the script with an error status code since the dependency is missing.
            sys.exit(1)
        
        # Initialize the ModelEvaluator with the saved model and scaler to prepare for testing.
        evaluator = ModelEvaluator(model_path, scaler_path)
        
        # Log a status message indicating the generation of test data.
        logger.info("Generating test data...")
        
        # Create an instance of the ModelTrainer to leverage its data preprocessing functions.
        trainer = ModelTrainer()
        
        # Call 'prepare_data' to retrieve the test features (X_test) and actual labels (y_test).
        # 'use_generated=True' ensures that the same data generation logic is used as in the training phase.
        (X_train, X_test, y_train, y_test), feature_names = trainer.prepare_data(
            use_generated=True
        )
        
        # Log that the detailed performance analysis is starting.
        logger.info("Performing comprehensive evaluation...")
        
        # Run a full suite of metrics (accuracy, precision, recall, etc.) using the evaluator object.
        results = evaluator.comprehensive_evaluation(
            # Pass the input test data, the ground truth labels, and the names of the features being analyzed.
            X_test, y_test, feature_names,
            # Enabling this will generate visual charts like confusion matrices or ROC curves.
            save_plots=True,
            # Enabling this will export the numeric data to a formal report.
            save_results=True,
            # Specify the folder name where all evaluation artifacts will be written.
            output_dir="evaluation_results"
        )
        
        # Log a concluding success message for the evaluation phase.
        logger.info("Evaluation completed successfully!")
        
        # Inform the user specifically where the visual and text-based outputs are located.
        logger.info("Results saved to evaluation_results/ directory")
        
    # Catch any generic exception that might occur during the process.
    except Exception as e:
        # Log the specific error to help with troubleshooting.
        logger.error(f"Evaluation failed: {e}")
        
        # Exit with a non-zero status code to signal a failed run.
        sys.exit(1)

# Ensure the script only runs if it is executed directly, not when imported by another module.
if __name__ == "__main__":
    # Call the main evaluation logic.
    main()
