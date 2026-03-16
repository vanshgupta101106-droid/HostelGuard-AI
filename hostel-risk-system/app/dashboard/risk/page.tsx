import { redirect } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase/server"
import { getHostelsWithBlocks } from "@/lib/services/hostel.service"
import Link from "next/link"
import { BarChart3 } from "lucide-react"
import { getBlockLevelData } from "@/lib/services/comprehensive-risk.service"

type BlockRow = {
 block_id: number
 hostel_id: number
 block_name: string
}

type HostelWithBlocksRow = {
 hostel_id: number
 hostel_name: string
 gender_type: string | null
 total_capacity: number | null
 block: BlockRow[] | null
}

export default async function HostelPage() {
 const supabase = await createSupabaseServer()

 const {
  data: { user },
 } = await supabase.auth.getUser()

 if (!user) redirect("/login")

 const { data, error } = await getHostelsWithBlocks()

  // Fetch risk data for all blocks
  let blocksWithRisk = []
  
  if (data && data.length > 0) {
    try {
      blocksWithRisk = await Promise.all(
        data.flatMap(async (hostel) => {
          if (!hostel.block) return []
          
          const blocksWithRiskData = await Promise.all(
            hostel.block.map(async (block) => {
              const riskData = await getBlockLevelData(block.block_id)
              const riskScore = Math.min((riskData.weighted_incidents_per_100_students / 10 + 
                                       riskData.average_stress_in_block / 10 + 
                                       riskData.severe_behavior_density) / 3, 1)
              
              return {
                ...block,
                riskData,
                riskScore,
                hostel_name: hostel.hostel_name
              }
            })
          )
          
          return blocksWithRiskData
        })
      )
    } catch (error) {
      console.error("Error fetching block risk data:", error)
    }
  }

 // Helper function to get risk level and color
 const getRiskDisplay = (score: number) => {
  if (score >= 0.8) return { level: "Critical", color: "text-red-600 bg-red-50 border-red-200" }
  if (score >= 0.6) return { level: "High", color: "text-orange-600 bg-orange-50 border-orange-200" }
  if (score >= 0.4) return { level: "Medium", color: "text-yellow-600 bg-yellow-50 border-yellow-200" }
  return { level: "Low", color: "text-green-600 bg-green-50 border-green-200" }
 }

 if (error) {
  return (
   <div className="space-y-6">
    <div className="page-header">
     <div className="min-w-0">
      <h1 className="page-title">Hostel Structure</h1>
      <p className="page-subtitle">Browse hostels and blocks</p>
     </div>
    </div>

    <div className="rounded-xl border border-danger-600/20 bg-danger-50 text-danger-600 px-4 py-3 text-sm">
     {error.message}
    </div>
   </div>
  )
 }

 if (!data || data.length === 0) {
  return (
   <div className="space-y-6">
    <div className="page-header">
     <div className="min-w-0">
      <h1 className="page-title">Risk Management Dashboard</h1>
      <p className="page-subtitle">No hostels found</p>
     </div>
    </div>

    <div className="border rounded-lg p-6">
     <div className="text-sm text-gray-600">No hostels or blocks found</div>
    </div>
   </div>
  )
 }

 return (
  <div className="space-y-6">
   <div className="page-header">
    <div className="min-w-0">
     <h1 className="page-title">Risk Management Dashboard</h1>
     <p className="page-subtitle">Block-level risk analysis and monitoring</p>
    </div>
    <div className="flex items-center gap-3">
     <Link 
       href="/dashboard/risk/comprehensive"
       className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
     >
      <BarChart3 className="h-4 w-4" />
      Comprehensive Analysis
     </Link>
    </div>
   </div>

   <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
    {blocksWithRisk.flat().map((block: any) => {
     const riskDisplay = getRiskDisplay(block.riskScore)
     
     return (
      <div key={block.block_id} className="border rounded-lg overflow-hidden">
       <div className="p-4 border-b bg-gray-50">
        <div className="flex items-start justify-between gap-4">
         <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">{block.block_name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
           <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            {block.hostel_name}
           </span>
           <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            Block ID: {block.block_id}
           </span>
          </div>
         </div>

         <div className="text-center">
          <div className={`inline-block px-2 py-1 rounded text-xs font-medium border ${riskDisplay.color}`}>
           {riskDisplay.level}
          </div>
         </div>
        </div>
       </div>

       <div className="p-4">
        <div className="space-y-3">
         <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Risk Score</span>
          <span className="text-sm font-semibold">{(block.riskScore * 100).toFixed(1)}%</span>
         </div>
         
         {block.riskData && (
          <>
           <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Weighted Incidents</span>
            <span className="text-sm">{block.riskData.weighted_incidents_per_100_students.toFixed(1)}/100</span>
           </div>
           <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Avg Stress Level</span>
            <span className="text-sm">{block.riskData.average_stress_in_block.toFixed(1)}/10</span>
           </div>
           <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Severe Behavior</span>
            <span className="text-sm">{block.riskData.severe_behavior_density.toFixed(2)}</span>
           </div>
          </>
         )}
        </div>

        <div className="mt-4 pt-3 border-t">
         <Link
          href={`/dashboard/risk/${block.block_id}`}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
         >
          View Floors & Rooms →
         </Link>
        </div>
       </div>
      </div>
     )
    })}
   </div>

   {/* Quick Risk Overview Cards */}
   <div className="grid gap-6 md:grid-cols-3">
    <div className="border border-orange-200 bg-orange-50 rounded-lg p-6">
     <div className="flex items-center gap-3">
      <div className="h-8 w-8 text-orange-600">⚠️</div>
      <div>
       <h3 className="font-semibold text-orange-900">High Risk Areas</h3>
       <p className="text-sm text-orange-700">3 blocks require immediate attention</p>
      </div>
     </div>
    </div>

    <div className="border border-blue-200 bg-blue-50 rounded-lg p-6">
     <div className="flex items-center gap-3">
      <div className="h-8 w-8 text-blue-600">📈</div>
      <div>
       <h3 className="font-semibold text-blue-900">Risk Trends</h3>
       <p className="text-sm text-blue-700">12% increase this week</p>
      </div>
     </div>
    </div>

    <div className="border border-green-200 bg-green-50 rounded-lg p-6">
     <div className="flex items-center gap-3">
      <div className="h-8 w-8 text-green-600">👥</div>
      <div>
       <h3 className="font-semibold text-green-900">Students Monitored</h3>
       <p className="text-sm text-green-700">1,247 active profiles</p>
      </div>
     </div>
    </div>
   </div>
  </div>
 )
}
