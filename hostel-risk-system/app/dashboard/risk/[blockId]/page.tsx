import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase/server"
import { getBlockById, getFloors } from "@/lib/services/hostel.service"
import { getBlockLevelData, getFloorLevelData, getRoomLevelData } from "@/lib/services/comprehensive-risk.service"
import { Database } from "@/lib/supabase/database"

type FloorRow = Database['public']['Tables']['floor']['Row']

type BlockWithHostel = Database['public']['Tables']['block']['Row'] & {
  hostel?: { hostel_name: string } | null
  warden?: Database['public']['Tables']['warden']['Row'] | null
}

export default async function BlockPage({
  params,
}: {
  params: Promise<{ blockId: string }>
}) {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { blockId } = await params
  const blockIdNum = Number(blockId)

  if (!Number.isInteger(blockIdNum) || blockIdNum <= 0) {
    redirect("/dashboard/hostel")
  }

  const [blockRes, floorsRes] = await Promise.all([
    getBlockById(blockIdNum),
    getFloors(blockIdNum),
  ])

  // Fetch risk data for the block
  let blockRiskData = null
  let floorsRiskData = []

  try {
    blockRiskData = await getBlockLevelData(blockIdNum)
    
    // Fetch risk data for each floor
    if (floorsRes.data) {
      floorsRiskData = await Promise.all(
        floorsRes.data.map(async (floor) => {
          const floorRisk = await getFloorLevelData(floor.floor_id)
          return {
            ...floor,
            riskData: floorRisk
          }
        })
      )
    }
  } catch (error) {
    console.error("Error fetching risk data:", error)
  }

  if (blockRes.error) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <div className="min-w-0">
            <h1 className="page-title">Block</h1>
            <p className="page-subtitle">Unable to load block</p>
          </div>
        </div>

        <div className="rounded-xl border border-danger-600/20 bg-danger-50 text-danger-600 px-4 py-3 text-sm">
          {blockRes.error.message}
        </div>
      </div>
    )
  }

  const block = blockRes.data as BlockWithHostel
  const floors = floorsRiskData // Use the enhanced floors data with risk information

  // Helper function to get risk level and color
  const getRiskDisplay = (score: number) => {
    if (score >= 0.8) return { level: "Critical", color: "text-red-600 bg-red-50 border-red-200" }
    if (score >= 0.6) return { level: "High", color: "text-orange-600 bg-orange-50 border-orange-200" }
    if (score >= 0.4) return { level: "Medium", color: "text-yellow-600 bg-yellow-50 border-yellow-200" }
    return { level: "Low", color: "text-green-600 bg-green-50 border-green-200" }
  }

  // Calculate block risk score (simplified version)
  const blockRiskScore = blockRiskData ? 
    Math.min((blockRiskData.weighted_incidents_per_100_students / 10 + 
              blockRiskData.average_stress_in_block / 10 + 
              blockRiskData.severe_behavior_density) / 3, 1) : 0

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Link href="/dashboard/hostel" className="hover:text-foreground transition-colors">
              Hostel Structure
            </Link>
            <span>/</span>
            <span className="text-foreground/80">Block</span>
          </div>
          <h1 className="page-title">{block.block_name}</h1>
          <p className="page-subtitle">
            {block.hostel?.hostel_name ? `${block.hostel.hostel_name} · ` : ""}Block ID: {block.block_id}
          </p>
        </div>

        {block.warden && (
          <div className="card">
            <div className="card-body py-3">
              <div className="text-xs text-muted">Assigned warden</div>
              <div className="text-sm font-medium text-foreground truncate max-w-[240px]">
                {block.warden.name}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Block Risk Overview */}
      {blockRiskData && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Block Risk Analysis</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {(blockRiskScore * 100).toFixed(1)}%
              </div>
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getRiskDisplay(blockRiskScore).color}`}>
                {getRiskDisplay(blockRiskScore).level} Risk
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Weighted Incidents</div>
              <div className="text-lg font-semibold">{blockRiskData.weighted_incidents_per_100_students.toFixed(1)}/100</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Avg Stress Level</div>
              <div className="text-lg font-semibold">{blockRiskData.average_stress_in_block.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Severe Behavior Density</div>
              <div className="text-lg font-semibold">{blockRiskData.severe_behavior_density.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="card-header">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Floors</h2>
            <div className="text-sm text-muted">Total: {floors.length}</div>
          </div>
        </div>

        <div className="card-body">
          {floors.length === 0 ? (
            <div className="text-sm text-muted">No floors found for this block.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {floors.map((f: any) => {
                // Calculate floor risk score
                const floorRiskScore = f.riskData ? 
                  Math.min((f.riskData.floor_weighted_incidents_per_100_students / 10 + 
                            f.riskData.average_stress_in_floor / 10 + 
                            f.riskData.floor_severe_behavior_density) / 3, 1) : 0
                const floorRiskDisplay = getRiskDisplay(floorRiskScore)
                
                return (
                  <Link
                    key={f.floor_id}
                    href={`/dashboard/risk/${block.block_id}/floor/${f.floor_id}`}
                    className="group rounded-xl border border-border bg-background px-4 py-3 transition-[background-color,box-shadow] hover:bg-primary-50/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-semibold text-foreground">Floor {f.floor_number}</div>
                          {f.riskData && (
                            <div className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium border ${floorRiskDisplay.color}`}>
                              {floorRiskDisplay.level}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted mt-0.5">Floor ID: {f.floor_id}</div>
                        {f.riskData && (
                          <div className="text-xs text-muted mt-1">
                            Risk: {(floorRiskScore * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted group-hover:text-foreground/70 transition-colors">View rooms</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
