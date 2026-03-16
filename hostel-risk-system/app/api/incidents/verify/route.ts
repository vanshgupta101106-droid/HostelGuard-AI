import { NextRequest, NextResponse } from 'next/server'
import { verifyIncident } from '@/lib/services/incident.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { incidentId, wardenId } = body

    if (!incidentId || !wardenId) {
      return NextResponse.json(
        { error: 'Missing required fields: incidentId and wardenId' },
        { status: 400 }
      )
    }

    const result = await verifyIncident(Number(incidentId), Number(wardenId))

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || 'Failed to verify incident' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Incident verified successfully',
      data: result.data 
    })
  } catch (error: any) {
    console.error('Error verifying incident:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
