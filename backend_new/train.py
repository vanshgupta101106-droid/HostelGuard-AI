# !/usr/bin/env python3
# Standard shebang line to ensure the script runs with the Python 3 interpreter.

# Import the 'os' module for operating system-level interactions such as path management.
import os

# Import the 'sys' module to access system-specific parameters and functions, such as the module search path.
import sys

# Import the 'logging' module to record events and errors during the script's execution.
import logging

# Set up the source path so that internal project modules in the 'src' directory can be imported correctly.
# 'os.path.dirname(__file__)' gets the directory containing this script.
# 'os.path.join(..., 'src')' builds the absolute path to the 'src' folder.
# 'sys.path.append(...)' adds this path to the system's list of searchable module locations.
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Import the 'ModelTrainer' class from the custom 'src.models.train_model' module to handle machine learning training.
from src.models.train_model import ModelTrainer

# Configure the global logging settings.
logging.basicConfig(
    # Set the logging level to INFO so that standard informational messages are captured.
    level=logging.INFO,
    # Define a custom log format including timestamps, logger name, severity level, and the message content.
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Initialize a logger instance for the current module to track output.
logger = logging.getLogger(__name__)

# Define the main function which contains the primary logic for the training workflow.
def main():
    # Documentation string describing the purpose of the main function.
    """Main training script"""
    
    # Log an initial message indicating that the training process for the student risk model is starting.
    logger.info("Starting student risk model training...")
    
    # Use a try block to handle any runtime exceptions gracefully without crashing the whole application.
    try:
        # Instantiate the ModelTrainer class to create a trainer object.
        trainer = ModelTrainer()
        
        # Execute the model training and evaluation process.
        # 'use_generated=True' specifies that synthetic or augmented data should be included if available.
        results = trainer.train_and_evaluate(use_generated=True)
        
        # Log a success message confirming the training process completed successfully.
        logger.info("Training completed successfully!")
        
        # Print a visual separator to clearly define the beginning of the summary output.
        print("\n" + "="*50)
        
        # Print a header indicating that the training status is complete.
        print("TRAINING COMPLETED SUCCESSFULLY!")
        
        # Print another visual separator for cleanly formatted terminal output.
        print("="*50)
        
        # Display the final test accuracy of the model, rounded to four decimal places.
        print(f"Test Accuracy: {results['accuracy']:.4f}")
        
        # Print a header for the list showing which data features were most influential in the model's predictions.
        print("\nTop 10 Important Features:")
        
        # Loop through the results to display the top 10 most significant features based on their calculated importance.
        # 'enumerate' provides a counter starting at 0 for ranking purposes.
        for i, (feature, importance) in enumerate(
            # Extract the feature importance dictionary, convert its key-value pairs to a list, and slice the first 10 entries.
            list(results['feature_importance'].items())[:10]
        ):
            # Print each feature's rank (i+1), its name, and its importance score formatted to four decimals.
            print(f"{i+1:2d}. {feature}: {importance:.4f}")
        
        # Inform the user that the final model file and related processing artifacts have been saved.
        print("\nModel and artifacts saved to models/ directory")
        
        # Provide instructions on how to run the separate evaluation script for deeper analysis.
        print("Run 'python evaluate.py' to see detailed evaluation results")
        
    # Catch any exceptions that occur within the try block.
    except Exception as e:
        # Log the specific exception message at the ERROR level to indicate a critical failure.
        logger.error(f"Training failed: {e}")
        
        # Exit the script with a status code of 1 to signal to the operating system that the execution failed.
        sys.exit(1)

# Check if this script is being executed directly (as the main module) rather than being imported.
if __name__ == "__main__":
    # Call the main function to trigger the execution of the training pipeline.
    main()
