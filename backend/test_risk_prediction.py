#!/usr/bin/env python3
"""
Test script for XGBoost risk prediction server
"""

import requests
import json
import time

# Base URL for the API
BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_features():
    """Test features endpoint"""
    print("\nTesting features endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/features")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Available features: {len(data['features'])}")
        print("Features:", data['features'])
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_single_prediction():
    """Test single prediction"""
    print("\nTesting single prediction...")
    
    # Sample student features (using your trained model's feature set)
    student_data = {
        "student_id": "S_1000",
        "features": {
            "year": 2,
            "days_in_hostel": 677,
            "past_escalation_count": 0,
            "behavior_count_7d": 1,
            "behavior_count_30d": 1,
            "severe_behavior_count_30d": 0,
            "behavior_weighted_score_30d": 0.078,
            "days_since_last_behavior": 61,
            "incident_count_30d": 0,
            "severe_incident_count_30d": 0,
            "incident_trend_slope": -0.603,
            "complaint_count_30d": 0.857,
            "high_severity_complaint_count_30d": 0,
            "complaint_growth_rate": 0.87,
            "avg_stress_4weeks": 0.156,
            "stress_trend_slope": -0.093,
            "mood_instability_score": 2.4,
            "missed_survey_count": 4,
            "block_risk_score": 0.812,
            "floor_risk_score": 1.9,
            "room_risk_score": 0.767,
            "roommate_avg_risk_score": 3.95
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/predict",
            json=student_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_batch_prediction():
    """Test batch prediction"""
    print("\nTesting batch prediction...")
    
    # Sample data for multiple students
    batch_data = {
        "students": [
            {
                "student_id": "S_1000",
                "features": {
                    "year": 2,
                    "days_in_hostel": 677,
                    "past_escalation_count": 0,
                    "behavior_count_7d": 1,
                    "behavior_count_30d": 1,
                    "severe_behavior_count_30d": 0,
                    "behavior_weighted_score_30d": 0.078,
                    "days_since_last_behavior": 61,
                    "incident_count_30d": 0,
                    "severe_incident_count_30d": 0,
                    "incident_trend_slope": -0.603,
                    "complaint_count_30d": 0.857,
                    "high_severity_complaint_count_30d": 0,
                    "complaint_growth_rate": 0.87,
                    "avg_stress_4weeks": 0.156,
                    "stress_trend_slope": -0.093,
                    "mood_instability_score": 2.4,
                    "missed_survey_count": 4,
                    "block_risk_score": 0.812,
                    "floor_risk_score": 1.9,
                    "room_risk_score": 0.767,
                    "roommate_avg_risk_score": 3.95
                }
            },
            {
                "student_id": "S_1001",
                "features": {
                    "year": 4,
                    "days_in_hostel": 134,
                    "past_escalation_count": 0,
                    "behavior_count_7d": 0,
                    "behavior_count_30d": 2,
                    "severe_behavior_count_30d": 0,
                    "behavior_weighted_score_30d": 0.227,
                    "days_since_last_behavior": 70,
                    "incident_count_30d": 0.333,
                    "severe_incident_count_30d": 0,
                    "incident_trend_slope": -0.473,
                    "complaint_count_30d": 0,
                    "high_severity_complaint_count_30d": 0,
                    "complaint_growth_rate": 0.19,
                    "avg_stress_4weeks": 0.656,
                    "stress_trend_slope": 0.424,
                    "mood_instability_score": 9.4,
                    "missed_survey_count": 2,
                    "block_risk_score": 0.487,
                    "floor_risk_score": 1.05,
                    "room_risk_score": 0.137,
                    "roommate_avg_risk_score": 4.54
                }
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/batch_predict",
            json=batch_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    """Run all tests"""
    print("Starting XGBoost Risk Prediction API Tests")
    print("=" * 50)
    
    # Wait a moment for server to start
    time.sleep(2)
    
    tests = [
        ("Health Check", test_health),
        ("Features", test_features),
        ("Single Prediction", test_single_prediction),
        ("Batch Prediction", test_batch_prediction)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        result = test_func()
        results.append((test_name, result))
        print(f"Result: {'✅ PASSED' if result else '❌ FAILED'}")
    
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    for test_name, result in results:
        print(f"{test_name}: {'✅ PASSED' if result else '❌ FAILED'}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    print(f"\nOverall: {passed}/{total} tests passed")

if __name__ == "__main__":
    main()
