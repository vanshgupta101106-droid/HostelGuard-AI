import os
import json
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
import joblib
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import matplotlib.pyplot as plt
import seaborn as sns

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelMonitor:
    """Monitor model performance and detect drift"""
    
    def __init__(self, model_path: str, scaler_path: str = None,
                 reference_data_path: str = None):
        self.model = joblib.load(model_path)
        if scaler_path:
            self.scaler = joblib.load(scaler_path)
        else:
            self.scaler = None
        
        self.reference_stats = {}
        self.performance_history = []
        self.drift_threshold = 0.1  # 10% change threshold
        
        if reference_data_path:
            self.load_reference_data(reference_data_path)
    
    def load_reference_data(self, data_path: str):
        """Load reference data for drift detection"""
        try:
            ref_data = pd.read_csv(data_path)
            self.reference_stats = self.calculate_data_statistics(ref_data)
            logger.info(f"Reference data loaded from {data_path}")
        except Exception as e:
            logger.error(f"Error loading reference data: {e}")
    
    def calculate_data_statistics(self, data: pd.DataFrame) -> Dict:
        """Calculate statistics for drift detection"""
        numerical_cols = data.select_dtypes(include=[np.number]).columns
        
        stats = {
            'numerical': {},
            'categorical': {},
            'timestamp': datetime.now().isoformat()
        }
        
        for col in numerical_cols:
            stats['numerical'][col] = {
                'mean': float(data[col].mean()),
                'std': float(data[col].std()),
                'min': float(data[col].min()),
                'max': float(data[col].max()),
                'q25': float(data[col].quantile(0.25)),
                'q50': float(data[col].quantile(0.50)),
                'q75': float(data[col].quantile(0.75))
            }
        
        categorical_cols = data.select_dtypes(include=['object', 'category']).columns
        for col in categorical_cols:
            stats['categorical'][col] = data[col].value_counts().to_dict()
        
        return stats
    
    def detect_data_drift(self, current_data: pd.DataFrame) -> Dict:
        """Detect drift between current and reference data"""
        if not self.reference_stats:
            logger.warning("No reference data available for drift detection")
            return {'drift_detected': False, 'drift_score': 0.0}
        
        drift_results = {
            'drift_detected': False,
            'drift_score': 0.0,
            'feature_drift': {},
            'overall_drift': 0.0
        }
        
        current_stats = self.calculate_data_statistics(current_data)
        drift_count = 0
        total_features = 0
        
        # Check numerical features
        for feature in self.reference_stats['numerical']:
            if feature in current_stats['numerical']:
                ref_mean = self.reference_stats['numerical'][feature]['mean']
                curr_mean = current_stats['numerical'][feature]['mean']
                
                # Calculate relative change
                if ref_mean != 0:
                    relative_change = abs((curr_mean - ref_mean) / ref_mean)
                else:
                    relative_change = abs(curr_mean - ref_mean)
                
                drift_detected = relative_change > self.drift_threshold
                drift_results['feature_drift'][feature] = {
                    'drift_detected': drift_detected,
                    'relative_change': relative_change,
                    'reference_mean': ref_mean,
                    'current_mean': curr_mean
                }
                
                if drift_detected:
                    drift_count += 1
                total_features += 1
        
        # Check categorical features
        for feature in self.reference_stats['categorical']:
            if feature in current_stats['categorical']:
                ref_dist = self.reference_stats['categorical'][feature]
                curr_dist = current_stats['categorical'][feature]
                
                # Calculate distribution difference (simplified)
                drift_score = self.calculate_distribution_drift(ref_dist, curr_dist)
                drift_detected = drift_score > self.drift_threshold
                
                drift_results['feature_drift'][feature] = {
                    'drift_detected': drift_detected,
                    'drift_score': drift_score,
                    'reference_distribution': ref_dist,
                    'current_distribution': curr_dist
                }
                
                if drift_detected:
                    drift_count += 1
                total_features += 1
        
        # Calculate overall drift
        if total_features > 0:
            drift_results['overall_drift'] = drift_count / total_features
            drift_results['drift_detected'] = drift_results['overall_drift'] > 0.2  # 20% features drifting
            drift_results['drift_score'] = drift_results['overall_drift']
        
        return drift_results
    
    def calculate_distribution_drift(self, ref_dist: Dict, curr_dist: Dict) -> float:
        """Calculate drift between two distributions"""
        # Simple implementation using total variation distance
        all_keys = set(ref_dist.keys()) | set(curr_dist.keys())
        
        ref_total = sum(ref_dist.values())
        curr_total = sum(curr_dist.values())
        
        if ref_total == 0 or curr_total == 0:
            return 1.0
        
        tv_distance = 0.0
        for key in all_keys:
            ref_prob = ref_dist.get(key, 0) / ref_total
            curr_prob = curr_dist.get(key, 0) / curr_total
            tv_distance += abs(ref_prob - curr_prob)
        
        return tv_distance / 2  # Total variation distance
    
    def monitor_performance(self, X_test: pd.DataFrame, y_true: np.ndarray,
                           model_name: str = "current_model") -> Dict:
        """Monitor model performance on new data"""
        # Make predictions
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)
        
        # Calculate metrics
        accuracy = accuracy_score(y_true, y_pred)
        precision, recall, f1, _ = precision_recall_fscore_support(
            y_true, y_pred, average='weighted'
        )
        
        # Calculate prediction confidence
        max_proba = np.max(y_pred_proba, axis=1)
        mean_confidence = np.mean(max_proba)
        low_confidence_ratio = np.mean(max_proba < 0.5)
        
        performance_metrics = {
            'timestamp': datetime.now().isoformat(),
            'model_name': model_name,
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'mean_confidence': mean_confidence,
            'low_confidence_ratio': low_confidence_ratio,
            'sample_size': len(X_test)
        }
        
        # Add to history
        self.performance_history.append(performance_metrics)
        
        # Check for performance degradation
        performance_drift = self.check_performance_drift()
        
        return {
            'current_performance': performance_metrics,
            'performance_drift': performance_drift,
            'historical_performance': self.performance_history[-10:]  # Last 10 records
        }
    
    def check_performance_drift(self, window_size: int = 5) -> Dict:
        """Check for performance degradation over time"""
        if len(self.performance_history) < window_size + 1:
            return {'drift_detected': False, 'drift_score': 0.0}
        
        recent = self.performance_history[-window_size:]
        baseline = self.performance_history[-(window_size + 1):-window_size]
        
        # Calculate average metrics
        recent_acc = np.mean([p['accuracy'] for p in recent])
        baseline_acc = np.mean([p['accuracy'] for p in baseline])
        
        recent_f1 = np.mean([p['f1_score'] for p in recent])
        baseline_f1 = np.mean([p['f1_score'] for p in baseline])
        
        # Calculate relative changes
        acc_change = (baseline_acc - recent_acc) / baseline_acc if baseline_acc > 0 else 0
        f1_change = (baseline_f1 - recent_f1) / baseline_f1 if baseline_f1 > 0 else 0
        
        drift_detected = (acc_change > 0.05) or (f1_change > 0.05)  # 5% degradation threshold
        
        return {
            'drift_detected': drift_detected,
            'drift_score': max(acc_change, f1_change),
            'accuracy_change': acc_change,
            'f1_change': f1_change,
            'recent_accuracy': recent_acc,
            'baseline_accuracy': baseline_acc,
            'recent_f1': recent_f1,
            'baseline_f1': baseline_f1
        }
    
    def generate_monitoring_report(self, current_data: pd.DataFrame,
                                 X_test: pd.DataFrame, y_test: np.ndarray,
                                 save_path: str = "monitoring_report.json") -> Dict:
        """Generate comprehensive monitoring report"""
        logger.info("Generating monitoring report...")
        
        # Data drift detection
        data_drift = self.detect_data_drift(current_data)
        
        # Performance monitoring
        performance_monitoring = self.monitor_performance(X_test, y_test)
        
        # Feature importance drift (if available)
        feature_drift = self.analyze_feature_importance_drift(current_data)
        
        # Compile report
        report = {
            'timestamp': datetime.now().isoformat(),
            'data_drift': data_drift,
            'performance_monitoring': performance_monitoring,
            'feature_importance_drift': feature_drift,
            'recommendations': self.generate_recommendations(data_drift, performance_monitoring)
        }
        
        # Save report
        with open(save_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Monitoring report saved to {save_path}")
        
        return report
    
    def analyze_feature_importance_drift(self, current_data: pd.DataFrame) -> Dict:
        """Analyze changes in feature importance patterns"""
        if not hasattr(self.model, 'feature_importances_'):
            return {'message': 'Model does not support feature importance analysis'}
        
        # This is a simplified implementation
        # In practice, you might want to retrain on current data and compare
        
        original_importance = self.model.feature_importances_
        
        # Create a simple proxy for feature importance change
        # (In practice, you would retrain or use SHAP values)
        feature_drift = {
            'original_importance_mean': np.mean(original_importance),
            'original_importance_std': np.std(original_importance),
            'top_features_original': len(original_importance[original_importance > np.mean(original_importance)])
        }
        
        return feature_drift
    
    def generate_recommendations(self, data_drift: Dict, 
                               performance_monitoring: Dict) -> List[str]:
        """Generate recommendations based on monitoring results"""
        recommendations = []
        
        # Data drift recommendations
        if data_drift.get('drift_detected', False):
            recommendations.append(
                "Data drift detected. Consider retraining the model with recent data."
            )
            recommendations.append(
                "Review data collection processes and feature engineering."
            )
        
        # Performance drift recommendations
        perf_drift = performance_monitoring.get('performance_drift', {})
        if perf_drift.get('drift_detected', False):
            recommendations.append(
                "Performance degradation detected. Model retraining recommended."
            )
            recommendations.append(
                f"Accuracy dropped by {perf_drift.get('accuracy_change', 0):.2%}"
            )
        
        # Low confidence recommendations
        current_perf = performance_monitoring.get('current_performance', {})
        if current_perf.get('low_confidence_ratio', 0) > 0.3:
            recommendations.append(
                "High ratio of low-confidence predictions. Review model calibration."
            )
        
        if not recommendations:
            recommendations.append("Model performance is stable. Continue regular monitoring.")
        
        return recommendations
    
    def plot_monitoring_dashboard(self, save_path: str = "monitoring_dashboard.png"):
        """Create monitoring dashboard visualization"""
        if len(self.performance_history) < 2:
            logger.warning("Insufficient data for monitoring dashboard")
            return
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        
        # Accuracy over time
        timestamps = [p['timestamp'] for p in self.performance_history]
        accuracies = [p['accuracy'] for p in self.performance_history]
        
        axes[0, 0].plot(range(len(accuracies)), accuracies, marker='o')
        axes[0, 0].set_title('Model Accuracy Over Time')
        axes[0, 0].set_ylabel('Accuracy')
        axes[0, 0].grid(True)
        
        # F1 Score over time
        f1_scores = [p['f1_score'] for p in self.performance_history]
        axes[0, 1].plot(range(len(f1_scores)), f1_scores, marker='o', color='orange')
        axes[0, 1].set_title('F1 Score Over Time')
        axes[0, 1].set_ylabel('F1 Score')
        axes[0, 1].grid(True)
        
        # Confidence over time
        confidences = [p['mean_confidence'] for p in self.performance_history]
        axes[1, 0].plot(range(len(confidences)), confidences, marker='o', color='green')
        axes[1, 0].set_title('Mean Prediction Confidence Over Time')
        axes[1, 0].set_ylabel('Confidence')
        axes[1, 0].grid(True)
        
        # Sample sizes
        sample_sizes = [p['sample_size'] for p in self.performance_history]
        axes[1, 1].bar(range(len(sample_sizes)), sample_sizes, color='purple')
        axes[1, 1].set_title('Sample Sizes Over Time')
        axes[1, 1].set_ylabel('Sample Size')
        axes[1, 1].grid(True)
        
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"Monitoring dashboard saved to {save_path}")


def main():
    """Example usage of ModelMonitor"""
    # This would be used in a production monitoring system
    pass


if __name__ == "__main__":
    main()
