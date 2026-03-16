import { NextRequest, NextResponse } from 'next/server'
import { storeRiskPrediction, createRiskTicket } from '@/lib/services/risk-store.server.service'
import { getRiskLevelFromScore } from '@/lib/services/xgboost-risk.service'
import { getStudentIdFromRollNumber } from '@/lib/services/helper.service'

// Python backend URL
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'

// GET /api/risk/predict?roll_number=2023CS001
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rollNumber = searchParams.get('roll_number')
    
    if (!rollNumber) {
      return NextResponse.json(
        { error: 'roll_number parameter is required' },
        { status: 400 }
      )
    }
    const studentId = await getStudentIdFromRollNumber(rollNumber)
    
    // Call Python backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: studentId,
        roll_number: rollNumber,
        features: {} // Let Python backend fetch features from database
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.error || 'Prediction failed' },
        { status: response.status }
      )
    }
    
    const prediction = await response.json()
    console.log("Python backend response:", prediction)
    
    console.log("Retrieved student_id:", studentId, "for roll_number:", rollNumber)
    
    if (!studentId) {
      console.error("No student found for roll_number:", rollNumber)
      return NextResponse.json({
        ...prediction,
        storage_success: false,
        storage_error: `No student found for roll_number: ${rollNumber}`,
        timestamp: new Date().toISOString()
      })
    }
    
    // Extract risk score from prediction object
    const riskScore = prediction.prediction?.risk_score || prediction.risk_score
    console.log("Extracted risk_score:", riskScore, "from prediction:", prediction)
    
    if (!riskScore) {
      console.error("No risk_score found in prediction response")
      return NextResponse.json({
        ...prediction,
        storage_success: false,
        storage_error: "No risk_score found in prediction response",
        timestamp: new Date().toISOString()
      })
    }
    
    // Convert risk score to integer for database storage
    const roundedRiskScore = Math.round(riskScore)
    console.log("Rounded risk_score:", roundedRiskScore, "from original:", riskScore)
    
    // Store prediction in database
    const riskLevel = getRiskLevelFromScore(riskScore)
    console.log("Calculated risk level:", riskLevel, "for score:", riskScore)
    
    const storageResult = await storeRiskPrediction({
      student_id: studentId,
      roll_number: rollNumber,
      risk_score: roundedRiskScore,
      risk_level: riskLevel.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
      prediction_date: new Date().toISOString(),
      model_version: prediction.model_version
    })
    
    console.log("Storage result:", storageResult)
    
    // Create risk ticket for high/critical risk students
    if (riskLevel === 'High' || riskLevel === 'Critical') {
      console.log("Creating risk ticket for high-risk student")
      await createRiskTicket(
        studentId,
        riskScore,
        `Risk level: ${riskLevel} - ${riskScore} points`
      )
    }
    
    return NextResponse.json({
      ...prediction,
      student_id: studentId,
      storage_success: storageResult.success,
      storage_error: storageResult.error,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in risk prediction API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/risk/predict
// Body: { roll_number: "2023CS001", features: {...} }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.roll_number) {
      return NextResponse.json(
        { error: 'roll_number is required' },
        { status: 400 }
      )
    }
    const studentId = await getStudentIdFromRollNumber(body.roll_number)
    // Single prediction with custom features
    const response = await fetch(`${PYTHON_BACKEND_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: studentId,
        roll_number: body.roll_number,
        features: body.features || {}
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.error || 'Prediction failed' },
        { status: response.status }
      )
    }
    
    const prediction = await response.json()
    
    // Extract risk score from prediction object
    const riskScore = prediction.prediction?.risk_score || prediction.risk_score
    console.log("Extracted risk_score:", riskScore, "from prediction:", prediction)
    
    if (!riskScore) {
      console.error("No risk_score found in prediction response")
      return NextResponse.json({
        ...prediction,
        storage_success: false,
        storage_error: "No risk_score found in prediction response",
        timestamp: new Date().toISOString()
      })
    }
    
    // Convert risk score to integer for database storage
    const roundedRiskScore = Math.round(riskScore)
    console.log("Rounded risk_score:", roundedRiskScore, "from original:", riskScore)
    
    // Store prediction in database
    const riskLevel = getRiskLevelFromScore(riskScore)
    const storageResult = await storeRiskPrediction({
      student_id: studentId,
      roll_number: body.roll_number,
      risk_score: roundedRiskScore,
      risk_level: riskLevel.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
      prediction_date: new Date().toISOString(),
      model_version: prediction.model_version
    })
    
    // Create risk ticket for high/critical risk students
    if (riskLevel === 'High' || riskLevel === 'Critical') {
      await createRiskTicket(
        studentId,
        riskScore,
        `Risk level: ${riskLevel} - ${riskScore} points`
      )
    }
    
    return NextResponse.json({
      ...prediction,
      student_id: studentId,
      storage_success: storageResult.success,
      storage_error: storageResult.error,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error in risk prediction API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
