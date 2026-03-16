import { NextRequest, NextResponse } from "next/server"
import { calculateComprehensiveRoomRisk, getBlockLevelData, getFloorLevelData, getRoomLevelData, getRoommateBehaviorData } from "@/lib/services/comprehensive-risk.service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const blockId = searchParams.get('blockId')
    const floorId = searchParams.get('floorId')

    if (roomId) {
      // Calculate comprehensive risk for a specific room
      const riskScores = await calculateComprehensiveRoomRisk(parseInt(roomId))
      return NextResponse.json(riskScores)
    }

    if (blockId) {
      // Get block level data only
      const blockData = await getBlockLevelData(parseInt(blockId))
      return NextResponse.json({ blockData })
    }

    if (floorId) {
      // Get floor level data only
      const floorData = await getFloorLevelData(parseInt(floorId))
      return NextResponse.json({ floorData })
    }

    return NextResponse.json(
      { error: "Please provide roomId, blockId, or floorId parameter" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error calculating comprehensive risk:", error)
    return NextResponse.json(
      { error: "Failed to calculate risk scores" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, customWeights } = body

    if (!roomId) {
      return NextResponse.json(
        { error: "roomId is required" },
        { status: 400 }
      )
    }

    // Calculate comprehensive risk with custom weights if provided
    const riskScores = await calculateComprehensiveRoomRisk(
      parseInt(roomId),
      customWeights
    )

    return NextResponse.json(riskScores)
  } catch (error) {
    console.error("Error calculating comprehensive risk with custom weights:", error)
    return NextResponse.json(
      { error: "Failed to calculate risk scores" },
      { status: 500 }
    )
  }
}
