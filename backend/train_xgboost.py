import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from xgboost import XGBClassifier

# Load labeled data
df = pd.read_csv("student_features_with_labels.csv")

# Convert risk_level to numeric
mapping = {"Low": 0, "Medium": 1, "High": 2}
df["risk_level"] = df["risk_level"].map(mapping)

# Separate features and target
X = df.drop(["student_id", "risk_level", "risk_score"], axis=1)
y = df["risk_level"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# Create model
model = XGBClassifier(
    objective="multi:softprob",
    num_class=3,
    max_depth=6,
    learning_rate=0.05,
    n_estimators=300,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric="mlogloss",
    use_label_encoder=False
)

# Train
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))

# Save model
joblib.dump(model, "xgboost_model.pkl")

print("Model trained and saved successfully.")
df_test = X_test.copy()
df_test["actual"] = y_test
df_test["predicted"] = y_pred

print(df_test.head(10))
print(df.loc[408])
