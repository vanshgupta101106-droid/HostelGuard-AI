import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase/server"
import { getBlockById, getFloorById, getRooms } from "@/lib/services/hostel.service"
import { getFloorLevelData, getRoomLevelData } from "@/lib/services/comprehensive-risk.service"
import { Database } from "@/lib/supabase/database"

type FloorWithBlock = Database['public']['Tables']['floor']['Row'] & {
  block?: {
    block_name: string
    hostel?: { hostel_name: string } | null
  } | null
}

type RoomRow = Database['public']['Tables']['room']['Row'] & {
  students?: { student_id: number; full_name: string; roll_number: string }[] | null
}

type BlockWithHostel = Database['public']['Tables']['block']['Row'] & {
  hostel?: { hostel_name: string } | null
}

export default async function FloorRoomsPage({
  params,
}: {
  params: Promise<{ blockId: string; floorId: string }>
}) {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { blockId, floorId } = await params
  const blockIdNum = Number(blockId)
  const floorIdNum = Number(floorId)

  if (!Number.isInteger(blockIdNum) || blockIdNum <= 0 || !Number.isInteger(floorIdNum) || floorIdNum <= 0) {
    redirect("/dashboard/hostel")
  }

  const [blockRes, floorRes, roomsRes] = await Promise.all([
    getBlockById(blockIdNum),
    getFloorById(floorIdNum),
    getRooms(floorIdNum),
  ])

  // Fetch risk data for the floor and rooms
  let floorRiskData = null
  let roomsWithRisk = []

  try {
    floorRiskData = await getFloorLevelData(floorIdNum)
    
    // Fetch risk data for each room
    if (roomsRes.data) {
      roomsWithRisk = await Promise.all(
        roomsRes.data.map(async (room: any) => {
          const roomRisk = await getRoomLevelData(room.room_id)
          const riskScore = Math.min((roomRisk.room_total_incidents_last_30_days / 10 + 
                                   roomRisk.room_severe_behavior_count / 5 + 
                                   (roomRisk.room_flagged_recently_binary_14_day_window ? 0.3 : 0)) / 2, 1)
          
          return {
            ...room,
            riskData: roomRisk,
            riskScore
          }
        })
      )
    }
  } catch (error) {
    console.error("Error fetching risk data:", error)
  }

  if (blockRes.error || floorRes.error || roomsRes.error) {
    const message = blockRes.error?.message || floorRes.error?.message || roomsRes.error?.message || "Failed to load"

    return (
      <div className="space-y-6">
        <div className="page-header">
          <div className="min-w-0">
            <h1 className="page-title">Rooms</h1>
            <p className="page-subtitle">Unable to load floor rooms</p>
          </div>
        </div>

        <div className="rounded-xl border border-danger-600/20 bg-danger-50 text-danger-600 px-4 py-3 text-sm">
          {message}
        </div>
      </div>
    )
  }

  const block = blockRes.data as BlockWithHostel
  const floor = floorRes.data as FloorWithBlock
  const rooms = roomsWithRisk // Use the enhanced rooms data with risk information

  // Helper function to get risk level and color
  const getRiskDisplay = (score: number) => {
    if (score >= 0.8) return { level: "Critical", color: "text-red-600 bg-red-50 border-red-200" }
    if (score >= 0.6) return { level: "High", color: "text-orange-600 bg-orange-50 border-orange-200" }
    if (score >= 0.4) return { level: "Medium", color: "text-yellow-600 bg-yellow-50 border-yellow-200" }
    return { level: "Low", color: "text-green-600 bg-green-50 border-green-200" }
  }

  // Calculate floor risk score
  const floorRiskScore = floorRiskData ? 
    Math.min((floorRiskData.floor_weighted_incidents_per_100_students / 10 + 
              floorRiskData.average_stress_in_floor / 10 + 
              floorRiskData.floor_severe_behavior_density) / 3, 1) : 0

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Link href="/dashboard/hostel" className="hover:text-foreground transition-colors">
              Hostel Structure
            </Link>
            <span>/</span>
            <Link
              href={`/dashboard/hostel/block/${block.block_id}`}
              className="hover:text-foreground transition-colors truncate max-w-[240px]"
            >
              {block.block_name}
            </Link>
            <span>/</span>
            <span className="text-foreground/80">Floor {floor.floor_number}</span>
          </div>
          <h1 className="page-title">Rooms</h1>
          <p className="page-subtitle">
            {floor.block?.hostel?.hostel_name ? `${floor.block.hostel.hostel_name} · ` : ""}
            {floor.block?.block_name ? `${floor.block.block_name} · ` : ""}
            Floor {floor.floor_number}
          </p>
        </div>

        <div className="card">
          <div className="card-body py-3">
            <div className="text-xs text-muted">Total rooms</div>
            <div className="text-sm font-semibold text-foreground">{rooms.length}</div>
          </div>
        </div>
      </div>

      {/* Floor Risk Overview */}
      {floorRiskData && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Floor Risk Analysis</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {(floorRiskScore * 100).toFixed(1)}%
              </div>
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getRiskDisplay(floorRiskScore).color}`}>
                {getRiskDisplay(floorRiskScore).level} Risk
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Weighted Incidents</div>
              <div className="text-lg font-semibold">{floorRiskData.floor_weighted_incidents_per_100_students.toFixed(1)}/100</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Avg Stress Level</div>
              <div className="text-lg font-semibold">{floorRiskData.average_stress_in_floor.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Severe Behavior Density</div>
              <div className="text-lg font-semibold">{floorRiskData.floor_severe_behavior_density.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="card-header">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Room List</h2>
            <div className="text-sm text-muted">Sorted by room number</div>
          </div>
        </div>

        <div className="card-body">
          {rooms.length === 0 ? (
            <div className="text-sm text-muted">No rooms found for this floor.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((r: any) => {
                const occupants = r.students?.length || 0
                const riskDisplay = getRiskDisplay(r.riskScore)

                return (
                  <div
                    key={r.room_id}
                    className="rounded-xl border border-border bg-background px-4 py-3 transition-[background-color,box-shadow] hover:bg-primary-50/30 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-semibold text-foreground">{r.room_number}</div>
                          {r.riskData && (
                            <div className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium border ${riskDisplay.color}`}>
                              {riskDisplay.level}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          Room ID: {r.room_id} · Capacity: {r.capacity ?? "—"} · Occupied: {occupants}
                        </div>
                        {r.riskData && (
                          <div className="text-xs text-gray-600 mt-1">
                            Risk: {(r.riskScore * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>

                    {r.riskData && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-gray-500">Incidents</div>
                            <div className="font-semibold">{r.riskData.room_total_incidents_last_30_days}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500">Severe</div>
                            <div className="font-semibold">{r.riskData.room_severe_behavior_count}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500">Flagged</div>
                            <div className="font-semibold">{r.riskData.room_flagged_recently_binary_14_day_window ? 'Yes' : 'No'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
