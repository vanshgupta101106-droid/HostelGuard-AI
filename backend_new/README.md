# HostelGuard AI - Student Risk Prediction Backend

A comprehensive machine learning backend for predicting student risk levels in hostel environments using XGBoost.

## Features

- **Advanced Feature Engineering**: Creates interaction features, polynomial features, and temporal trends
- **Hyperparameter Optimization**: Uses Optuna for automated hyperparameter tuning
- **Comprehensive Evaluation**: Detailed metrics, visualizations, and model analysis
- **Synthetic Data Generation**: Realistic data generation for testing and development
- **Model Monitoring**: Built-in drift detection and performance tracking
- **Scalable Architecture**: Modular design for easy extension and maintenance

## Project Structure

```
backend_new/
├── config/
│   └── config.yaml          # Configuration file
├── data/                    # Data storage
├── models/                  # Trained models
├── src/
│   ├── data/
│   │   └── data_generator.py    # Synthetic data generation
│   ├── features/
│   │   └── feature_engineering.py  # Feature processing
│   ├── models/
│   │   └── train_model.py     # Model training pipeline
│   ├── evaluation/
│   │   └── evaluate_model.py  # Model evaluation
│   └── monitoring/
│       └── model_monitor.py   # Model monitoring
├── notebooks/               # Jupyter notebooks
├── train.py                 # Training script
├── evaluate.py              # Evaluation script
├── requirements.txt         # Dependencies
└── README.md               # This file
```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Training the Model

```bash
python train.py
```

This will:
- Generate synthetic training data
- Perform feature engineering
- Optimize hyperparameters using Optuna
- Train the XGBoost model
- Save model artifacts to `models/` directory

### Evaluating the Model

```bash
python evaluate.py
```

This will:
- Load the trained model
- Generate test data
- Perform comprehensive evaluation
- Create visualizations and save results to `evaluation_results/`

### Feature Set

The model uses 22 features covering:

**Academic & Demographic:**
- `year`: Student year (1-4)
- `days_in_hostel`: Days in hostel

**Behavioral:**
- `behavior_count_7d`, `behavior_count_30d`: Behavior incidents
- `severe_behavior_count_30d`: Severe incidents
- `behavior_weighted_score_30d`: Weighted behavior score
- `days_since_last_behavior`: Time since last incident

**Incident History:**
- `incident_count_30d`, `severe_incident_count_30d`
- `incident_trend_slope`: Trend analysis
- `past_escalation_count`: Historical escalations

**Complaints:**
- `complaint_count_30d`, `high_severity_complaint_count_30d`
- `complaint_growth_rate`: Growth analysis

**Mental Health & Wellbeing:**
- `avg_stress_4weeks`: Average stress level (1-10)
- `stress_trend_slope`: Stress trend
- `mood_instability_score`: Mood variability
- `missed_survey_count`: Survey engagement

**Environmental Risk:**
- `block_risk_score`, `floor_risk_score`, `room_risk_score`
- `roommate_avg_risk_score`: Peer risk factors

## Risk Levels

The model predicts three risk levels:
- **Low**: Minimal risk, normal monitoring
- **Medium**: Elevated risk, increased attention
- **High**: Critical risk, immediate intervention

## Configuration

Edit `config/config.yaml` to modify:
- Model parameters
- Training settings
- Evaluation metrics
- File paths

## Model Performance

The trained model typically achieves:
- **Accuracy**: >90%
- **F1 Score**: >0.85 (weighted)
- **ROC AUC**: >0.95

Performance varies based on data quality and class distribution.

## Advanced Features

### Feature Engineering
- Interaction features between behavioral and incident metrics
- Temporal trend analysis
- Environmental risk aggregation
- Stress-behavior interactions

### Hyperparameter Optimization
- Automated tuning with Optuna
- Cross-validation for robustness
- Early stopping to prevent overfitting

### Model Evaluation
- Comprehensive metrics (accuracy, precision, recall, F1)
- ROC AUC analysis
- Feature importance analysis
- Prediction confidence assessment
- Visual evaluation reports

## API Integration

The trained model can be integrated with the existing Flask API in the main backend directory. Use the saved model files:
- `models/xgboost_risk_model.pkl`: Trained XGBoost model
- `models/scaler.pkl`: Feature scaler
- `models/feature_importance.json`: Feature importance data

## Monitoring

The system includes model monitoring capabilities:
- Performance drift detection
- Feature distribution monitoring
- Prediction confidence tracking

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Use the provided configuration system

## License

This project is part of the HostelGuard AI system.
