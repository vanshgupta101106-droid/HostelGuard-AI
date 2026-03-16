#!/usr/bin/env python3

import os
import sys
import logging

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.models.train_model import ModelTrainer

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Main training script"""
    logger.info("Starting student risk model training...")
    
    try:
        # Initialize trainer
        trainer = ModelTrainer()
        
        # Train and evaluate model
        results = trainer.train_and_evaluate(use_generated=True)
        
        logger.info("Training completed successfully!")
        
        # Print summary
        print("\n" + "="*50)
        print("TRAINING COMPLETED SUCCESSFULLY!")
        print("="*50)
        print(f"Test Accuracy: {results['accuracy']:.4f}")
        
        print("\nTop 10 Important Features:")
        for i, (feature, importance) in enumerate(
            list(results['feature_importance'].items())[:10]
        ):
            print(f"{i+1:2d}. {feature}: {importance:.4f}")
        
        print("\nModel and artifacts saved to models/ directory")
        print("Run 'python evaluate.py' to see detailed evaluation results")
        
    except Exception as e:
        logger.error(f"Training failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
