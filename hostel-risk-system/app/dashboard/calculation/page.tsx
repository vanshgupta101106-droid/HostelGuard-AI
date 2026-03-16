'use client'

import { useState } from 'react'
import React from 'react'
import {Card ,CardHeader ,CardTitle ,CardDescription ,CardContent} from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import Badge from '@/components/ui/Badge'
import Alert from '@/components/ui/Alert'
import { AlertDescription } from '@/components/ui/AlertDescription'
import { Loader2, AlertTriangle, CheckCircle, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'

interface RiskPrediction {
  risk_level: 'Low' | 'Medium' | 'High'
  risk_score: number
  probabilities: {
    Low: number
    Medium: number
    High: number
  }
}

interface PredictionResult {
  roll_number: string
  prediction: RiskPrediction
  timestamp: string
}

export default function RiskCalculationPage() {
  const [rollNumber, setRollNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [batchMode, setBatchMode] = useState(false)
  const [batchRollNumbers, setBatchRollNumbers] = useState('')
  const [batchResults, setBatchResults] = useState<Record<string, RiskPrediction>>({})

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'High': return <AlertTriangle className="h-4 w-4" />
      case 'Medium': return <TrendingUp className="h-4 w-4" />
      case 'Low': return <CheckCircle className="h-4 w-4" />
      default: return null
    }
  }

  const fetchStudentFeatures = async (rollNumber: string) => {
    try {
      // Import the service function dynamically to avoid SSR issues
      const { getStudentFeatures } = await import('@/lib/services/xgboost-risk.service')
      const features = await getStudentFeatures(rollNumber)
      
      if (!features) {
        throw new Error('Student not found or no features available')
      }
      
      // Convert features to the format expected by the Python backend
      const featureData = {
        year: Math.max(1, Math.min(4, Math.round(features.year))),
        days_in_hostel: Math.max(1, Math.round(features.days_in_hostel)),
        past_escalation_count: Math.max(0, Math.round(features.past_escalation_count)),
        behavior_count_7d: Math.max(0, Math.round(features.behavior_count_7d)),
        behavior_count_30d: Math.max(0, Math.round(features.behavior_count_30d)),
        severe_behavior_count_30d: Math.max(0, Math.round(features.severe_behavior_count_30d)),
        behavior_weighted_score_30d: Math.max(0, Number(features.behavior_weighted_score_30d)),
        days_since_last_behavior: Math.max(0, Math.round(features.days_since_last_behavior)),
        incident_count_30d: Math.max(0, Math.round(features.incident_count_30d)),
        severe_incident_count_30d: Math.max(0, Math.round(features.severe_incident_count_30d)),
        incident_trend_slope: Number(features.incident_trend_slope),
        complaint_count_30d: Math.max(0, Math.round(features.complaint_count_30d)),
        high_severity_complaint_count_30d: Math.max(0, Math.round(features.high_severity_complaint_count_30d)),
        complaint_growth_rate: Number(features.complaint_growth_rate),
        avg_stress_4weeks: Math.max(1, Math.min(10, Number(features.avg_stress_4weeks))),
        stress_trend_slope: Number(features.stress_trend_slope),
        mood_instability_score: Math.max(0, Number(features.mood_instability_score)),
        missed_survey_count: Math.max(0, Math.round(features.missed_survey_count)),
        block_risk_score: Math.max(1, Math.min(10, Number(features.block_risk_score))),
        floor_risk_score: Math.max(1, Math.min(10, Number(features.floor_risk_score))),
        room_risk_score: Math.max(1, Math.min(10, Number(features.room_risk_score))),
        roommate_avg_risk_score: Math.max(1, Math.min(10, Number(features.roommate_avg_risk_score)))
      }
      
      return featureData
    } catch (error) {
      console.error('Error fetching student features:', error)
      return null
    }
  }

  const handleSinglePrediction = async () => {
    if (!rollNumber.trim()) {
      setError('Please enter a roll number')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const featureData = await fetchStudentFeatures(rollNumber.trim())
      
      const response = await fetch('/api/risk/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roll_number: rollNumber.trim(),
          features: featureData
        })
      })
      // console.log(featureData);
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Prediction failed')
      }

      const data = await response.json()
      console.log(data);
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchPrediction = async () => {
    const rollNumbers = batchRollNumbers
      .split('\n')
      .map((roll: string) => roll.trim())
      .filter((roll: string) => roll.length > 0)

    if (rollNumbers.length === 0) {
      setError('Please enter at least one roll number')
      return
    }

    setLoading(true)
    setError(null)
    setBatchResults({})

    try {
      // Fetch features for all roll numbers
      const studentRequests = []
      for (const rollNumber of rollNumbers) {
        try {
          const features = await fetchStudentFeatures(rollNumber)
          if (features && Object.keys(features).length > 0) {
            studentRequests.push({
              student_id: rollNumber,
              features: features
            })
          } else {
            console.warn(`No features found for roll number: ${rollNumber}`)
          }
        } catch (error) {
          console.error(`Error fetching features for ${rollNumber}:`, error)
        }
      }

      if (studentRequests.length === 0) {
        throw new Error('No valid students found with features')
      }

      // Call batch predict endpoint
      const response = await fetch('http://localhost:8000/batch_predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          students: studentRequests
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Batch prediction failed')
      }

      const data = await response.json()
      
      // Transform the response to match expected format
      const transformedResults: Record<string, RiskPrediction> = {}
      Object.entries(data.predictions).forEach(([studentId, prediction]: [string, any]) => {
        transformedResults[studentId] = {
          risk_level: prediction.risk_level,
          risk_score: prediction.risk_score,
          probabilities: prediction.probabilities
        }
      })
      
      setBatchResults(transformedResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Risk Calculation</h1>
          <p className="text-muted-foreground">
            Calculate student risk levels using XGBoost model
          </p>
        </div>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Prediction Mode</CardTitle>
          <CardDescription>
            Choose between single student or batch prediction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={!batchMode ? 'default' : 'outline'}
              onClick={() => setBatchMode(false)}
            >
              Single Student
            </Button>
            <Button
              variant={batchMode ? 'default' : 'outline'}
              onClick={() => setBatchMode(true)}
            >
              Batch Prediction
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Single Prediction Form */}
      {!batchMode && (
        <Card>
          <CardHeader>
            <CardTitle>Single Student Risk Prediction</CardTitle>
            <CardDescription>
              Enter a roll number to calculate their risk level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roll-number">Roll Number</Label>
              <input
                id="roll-number"
                type="text"
                placeholder="e.g., 2023CS001"
                value={rollNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRollNumber(e.target.value)}
                maxLength={20}
                className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>


            <Button 
              onClick={handleSinglePrediction} 
              disabled={loading || !rollNumber.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                'Calculate Risk'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Batch Prediction Form */}
      {batchMode && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Risk Prediction</CardTitle>
            <CardDescription>
              Enter multiple roll numbers (one per line) to calculate risk levels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch-roll-numbers">Roll Numbers (one per line)</Label>
              <textarea
                id="batch-roll-numbers"
                className="w-full h-32 p-3 border rounded-md resize-none"
                placeholder="2023CS001&#10;2023CS002&#10;2023CS003"
                value={batchRollNumbers}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBatchRollNumbers(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleBatchPrediction} 
              disabled={loading || !batchRollNumbers.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                'Calculate Batch Risk'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Single Result Display */}
      {result && !batchMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Risk Prediction for {result.roll_number}
              <Badge className={getRiskColor(result.prediction.risk_level)}>
                {getRiskIcon(result.prediction.risk_level)}
                <span className="ml-1">{result.prediction.risk_level}</span>
              </Badge>
            </CardTitle>
            <CardDescription>
              Calculated on {new Date(result.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Risk Score */}
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {result.prediction.risk_score.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Risk Score (0-100)</div>
            </div>

            {/* Probabilities */}
            <div className="space-y-3">
              <h4 className="font-semibold">Probabilities</h4>
              <div className="space-y-2">
                {Object.entries(result.prediction.probabilities).map(([level, prob]) => (
                  <div key={level} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {getRiskIcon(level)}
                      {level} Risk
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            level === 'High' ? 'bg-red-500' :
                            level === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(prob as number)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {(prob as number).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch Results Display */}
      {Object.keys(batchResults).length > 0 && batchMode && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Prediction Results</CardTitle>
            <CardDescription>
              Risk levels for {Object.keys(batchResults).length} students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(batchResults).map(([rollNumber, prediction]) => (
                <div
                  key={rollNumber}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{rollNumber}</span>
                    <Badge className={getRiskColor(prediction.risk_level)}>
                      {getRiskIcon(prediction.risk_level)}
                      <span className="ml-1">{prediction.risk_level}</span>
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{prediction.risk_score.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">score</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p>
              <strong>XGBoost Model:</strong> This system uses your trained XGBoost model 
              with 23 features to predict student risk levels.
            </p>
            <p>
              <strong>Risk Levels:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><span className="text-green-600">Low Risk:</span> Score &lt; 40</li>
              <li><span className="text-yellow-600">Medium Risk:</span> Score 40-70</li>
              <li><span className="text-red-600">High Risk:</span> Score ≥ 70</li>
            </ul>
            <p>
              <strong>Features:</strong> The model analyzes behavior patterns, incidents, 
              complaints, stress levels, and environmental factors to calculate risk.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}