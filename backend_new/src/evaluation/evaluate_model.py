import os
import sys
import logging
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    roc_curve, precision_recall_curve
)
import joblib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelEvaluator:
    """Comprehensive model evaluation for student risk prediction"""
    
    def __init__(self, model_path: str, scaler_path: str = None):
        self.model = joblib.load(model_path)
        if scaler_path:
            self.scaler = joblib.load(scaler_path)
        else:
            self.scaler = None
        
        self.class_names = ['Low', 'Medium', 'High']
        self.results = {}
    
    def evaluate_basic_metrics(self, y_true: np.ndarray, y_pred: np.ndarray,
                              y_pred_proba: np.ndarray) -> Dict:
        """Calculate basic classification metrics"""
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision_macro': precision_score(y_true, y_pred, average='macro'),
            'precision_weighted': precision_score(y_true, y_pred, average='weighted'),
            'recall_macro': recall_score(y_true, y_pred, average='macro'),
            'recall_weighted': recall_score(y_true, y_pred, average='weighted'),
            'f1_macro': f1_score(y_true, y_pred, average='macro'),
            'f1_weighted': f1_score(y_true, y_pred, average='weighted')
        }
        
        # Per-class metrics
        precision_per_class = precision_score(y_true, y_pred, average=None)
        recall_per_class = recall_score(y_true, y_pred, average=None)
        f1_per_class = f1_score(y_true, y_pred, average=None)
        
        for i, class_name in enumerate(self.class_names):
            metrics[f'precision_{class_name}'] = precision_per_class[i]
            metrics[f'recall_{class_name}'] = recall_per_class[i]
            metrics[f'f1_{class_name}'] = f1_per_class[i]
        
        return metrics
    
    def calculate_confusion_matrix(self, y_true: np.ndarray,
                                  y_pred: np.ndarray) -> np.ndarray:
        """Calculate confusion matrix"""
        return confusion_matrix(y_true, y_pred)
    
    def calculate_roc_auc(self, y_true: np.ndarray,
                          y_pred_proba: np.ndarray) -> Dict:
        """Calculate ROC AUC for multi-class classification"""
        roc_auc_scores = {}
        
        # One-vs-Rest ROC AUC
        try:
            roc_auc_ovr = roc_auc_score(y_true, y_pred_proba, multi_class='ovr')
            roc_auc_scores['roc_auc_ovr'] = roc_auc_ovr
        except Exception as e:
            logger.warning(f"Could not calculate ROC AUC OVR: {e}")
        
        try:
            roc_auc_ovo = roc_auc_score(y_true, y_pred_proba, multi_class='ovo')
            roc_auc_scores['roc_auc_ovo'] = roc_auc_ovo
        except Exception as e:
            logger.warning(f"Could not calculate ROC AUC OVO: {e}")
        
        return roc_auc_scores
    
    def analyze_feature_importance(self, feature_names: List[str]) -> Dict:
        """Analyze feature importance"""
        if hasattr(self.model, 'feature_importances_'):
            importance_scores = self.model.feature_importances_
            feature_importance = dict(zip(feature_names, importance_scores))
            
            # Sort by importance
            sorted_importance = dict(
                sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
            )
            
            return {
                'feature_importance': sorted_importance,
                'top_10_features': dict(list(sorted_importance.items())[:10])
            }
        else:
            logger.warning("Model does not have feature_importances_ attribute")
            return {}
    
    def analyze_prediction_confidence(self, y_pred_proba: np.ndarray) -> Dict:
        """Analyze prediction confidence distribution"""
        max_proba = np.max(y_pred_proba, axis=1)
        
        confidence_analysis = {
            'mean_confidence': np.mean(max_proba),
            'std_confidence': np.std(max_proba),
            'median_confidence': np.median(max_proba),
            'min_confidence': np.min(max_proba),
            'max_confidence': np.max(max_proba),
            'high_confidence_ratio': np.mean(max_proba > 0.8),
            'low_confidence_ratio': np.mean(max_proba < 0.5)
        }
        
        return confidence_analysis
    
    def analyze_class_distribution(self, y_true: np.ndarray,
                                  y_pred: np.ndarray) -> Dict:
        """Analyze class distribution in predictions vs actual"""
        actual_distribution = np.bincount(y_true)
        predicted_distribution = np.bincount(y_pred)
        
        analysis = {
            'actual_distribution': {
                self.class_names[i]: int(actual_distribution[i])
                for i in range(len(self.class_names))
            },
            'predicted_distribution': {
                self.class_names[i]: int(predicted_distribution[i])
                for i in range(len(self.class_names))
            }
        }
        
        return analysis
    
    def generate_classification_report(self, y_true: np.ndarray,
                                     y_pred: np.ndarray) -> Dict:
        """Generate detailed classification report"""
        report = classification_report(y_true, y_pred, target_names=self.class_names,
                                      output_dict=True)
        return report
    
    def create_evaluation_plots(self, y_true: np.ndarray, y_pred: np.ndarray,
                               y_pred_proba: np.ndarray, feature_names: List[str],
                               save_dir: str = "plots"):
        """Create and save evaluation plots"""
        os.makedirs(save_dir, exist_ok=True)
        
        # 1. Confusion Matrix
        cm = self.calculate_confusion_matrix(y_true, y_pred)
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=self.class_names, yticklabels=self.class_names)
        plt.title('Confusion Matrix')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        plt.savefig(os.path.join(save_dir, 'confusion_matrix.png'), dpi=300)
        plt.close()
        
        # 2. Feature Importance
        if hasattr(self.model, 'feature_importances_'):
            importance_scores = self.model.feature_importances_
            feature_importance = dict(zip(feature_names, importance_scores))
            top_features = dict(list(sorted(feature_importance.items(),
                                          key=lambda x: x[1], reverse=True))[:15])
            
            plt.figure(figsize=(10, 8))
            features = list(top_features.keys())
            importances = list(top_features.values())
            
            plt.barh(features, importances)
            plt.title('Top 15 Feature Importance')
            plt.xlabel('Importance Score')
            plt.tight_layout()
            plt.savefig(os.path.join(save_dir, 'feature_importance.png'), dpi=300)
            plt.close()
        
        # 3. Prediction Confidence Distribution
        max_proba = np.max(y_pred_proba, axis=1)
        plt.figure(figsize=(10, 6))
        plt.hist(max_proba, bins=30, alpha=0.7, edgecolor='black')
        plt.title('Prediction Confidence Distribution')
        plt.xlabel('Maximum Prediction Probability')
        plt.ylabel('Frequency')
        plt.axvline(np.mean(max_proba), color='red', linestyle='--',
                   label=f'Mean: {np.mean(max_proba):.3f}')
        plt.legend()
        plt.tight_layout()
        plt.savefig(os.path.join(save_dir, 'confidence_distribution.png'), dpi=300)
        plt.close()
        
        # 4. Class Distribution Comparison
        actual_dist = np.bincount(y_true)
        pred_dist = np.bincount(y_pred)
        
        x = np.arange(len(self.class_names))
        width = 0.35
        
        plt.figure(figsize=(8, 6))
        plt.bar(x - width/2, actual_dist, width, label='Actual', alpha=0.7)
        plt.bar(x + width/2, pred_dist, width, label='Predicted', alpha=0.7)
        plt.xlabel('Risk Level')
        plt.ylabel('Count')
        plt.title('Actual vs Predicted Class Distribution')
        plt.xticks(x, self.class_names)
        plt.legend()
        plt.tight_layout()
        plt.savefig(os.path.join(save_dir, 'class_distribution.png'), dpi=300)
        plt.close()
        
        logger.info(f"Evaluation plots saved to {save_dir}")
    
    def convert_numpy_types(self, obj):
        """Convert numpy types to native Python types for JSON serialization"""
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {key: self.convert_numpy_types(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self.convert_numpy_types(item) for item in obj]
        else:
            return obj
    
    def comprehensive_evaluation(self, X_test: pd.DataFrame, y_test: np.ndarray,
                                 feature_names: List[str],
                                 save_plots: bool = True,
                                 save_results: bool = True,
                                 output_dir: str = "evaluation_results") -> Dict:
        """Perform comprehensive model evaluation"""
        logger.info("Starting comprehensive model evaluation...")
        
        # Make predictions
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)
        
        # Calculate all metrics
        basic_metrics = self.evaluate_basic_metrics(y_test, y_pred, y_pred_proba)
        confusion_mat = self.calculate_confusion_matrix(y_test, y_pred)
        roc_auc_scores = self.calculate_roc_auc(y_test, y_pred_proba)
        feature_importance = self.analyze_feature_importance(feature_names)
        confidence_analysis = self.analyze_prediction_confidence(y_pred_proba)
        class_distribution = self.analyze_class_distribution(y_test, y_pred)
        classification_rep = self.generate_classification_report(y_test, y_pred)
        
        # Compile results
        self.results = {
            'basic_metrics': basic_metrics,
            'confusion_matrix': confusion_mat.tolist(),
            'roc_auc_scores': roc_auc_scores,
            'feature_importance': feature_importance,
            'confidence_analysis': confidence_analysis,
            'class_distribution': class_distribution,
            'classification_report': classification_rep
        }
        
        # Create plots
        if save_plots:
            plots_dir = os.path.join(output_dir, 'plots')
            self.create_evaluation_plots(y_test, y_pred, y_pred_proba,
                                        feature_names, plots_dir)
        
        # Save results
        if save_results:
            os.makedirs(output_dir, exist_ok=True)
            results_path = os.path.join(output_dir, 'evaluation_results.json')
            # Convert numpy types to JSON-serializable types
            json_results = self.convert_numpy_types(self.results)
            with open(results_path, 'w') as f:
                json.dump(json_results, f, indent=2)
            logger.info(f"Evaluation results saved to {results_path}")
        
        # Print summary
        self.print_evaluation_summary()
        
        return self.results
    
    def print_evaluation_summary(self):
        """Print a summary of evaluation results"""
        if not self.results:
            print("No evaluation results available. Run comprehensive_evaluation first.")
            return
        
        print("\n" + "="*60)
        print("MODEL EVALUATION SUMMARY")
        print("="*60)
        
        # Basic metrics
        metrics = self.results['basic_metrics']
        print(f"Overall Accuracy: {metrics['accuracy']:.4f}")
        print(f"Weighted F1 Score: {metrics['f1_weighted']:.4f}")
        print(f"Macro F1 Score: {metrics['f1_macro']:.4f}")
        
        print("\nPer-Class Performance:")
        for class_name in self.class_names:
            precision = metrics[f'precision_{class_name}']
            recall = metrics[f'recall_{class_name}']
            f1 = metrics[f'f1_{class_name}']
            print(f"{class_name:8} - Precision: {precision:.4f}, "
                  f"Recall: {recall:.4f}, F1: {f1:.4f}")
        
        # ROC AUC
        if 'roc_auc_scores' in self.results and self.results['roc_auc_scores']:
            roc_scores = self.results['roc_auc_scores']
            print(f"\nROC AUC (One-vs-Rest): {roc_scores.get('roc_auc_ovr', 'N/A')}")
            print(f"ROC AUC (One-vs-One): {roc_scores.get('roc_auc_ovo', 'N/A')}")
        
        # Confidence analysis
        confidence = self.results['confidence_analysis']
        print(f"\nPrediction Confidence:")
        print(f"Mean Confidence: {confidence['mean_confidence']:.4f}")
        print(f"High Confidence Ratio (>0.8): {confidence['high_confidence_ratio']:.4f}")
        print(f"Low Confidence Ratio (<0.5): {confidence['low_confidence_ratio']:.4f}")
        
        # Top features
        if 'feature_importance' in self.results and 'top_10_features' in self.results['feature_importance']:
            print(f"\nTop 5 Important Features:")
            for i, (feature, importance) in enumerate(
                list(self.results['feature_importance']['top_10_features'].items())[:5]
            ):
                print(f"{i+1}. {feature}: {importance:.4f}")
        
        print("="*60)
    
    def compare_models(self, other_evaluators: List['ModelEvaluator'],
                      X_test: pd.DataFrame, y_test: np.ndarray,
                      model_names: List[str] = None) -> pd.DataFrame:
        """Compare multiple models side by side"""
        if model_names is None:
            model_names = [f"Model_{i+1}" for i in range(len(other_evaluators) + 1)]
        
        comparison_results = []
        
        # Evaluate current model
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)
        metrics = self.evaluate_basic_metrics(y_test, y_pred, y_pred_proba)
        metrics['model_name'] = model_names[0]
        comparison_results.append(metrics)
        
        # Evaluate other models
        for i, evaluator in enumerate(other_evaluators):
            y_pred = evaluator.model.predict(X_test)
            y_pred_proba = evaluator.model.predict_proba(X_test)
            metrics = evaluator.evaluate_basic_metrics(y_test, y_pred, y_pred_proba)
            metrics['model_name'] = model_names[i + 1]
            comparison_results.append(metrics)
        
        comparison_df = pd.DataFrame(comparison_results)
        
        # Reorder columns
        cols = ['model_name'] + [col for col in comparison_df.columns if col != 'model_name']
        comparison_df = comparison_df[cols]
        
        return comparison_df


def main():
    """Example usage of ModelEvaluator"""
    # This would be used after training a model
    pass


if __name__ == "__main__":
    main()
