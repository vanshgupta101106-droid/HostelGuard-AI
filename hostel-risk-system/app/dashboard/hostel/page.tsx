import { redirect } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase/server"
import { getHostelsWithBlocks } from "@/lib/services/hostel.service"
import Link from "next/link"

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
      <h1 className="page-title">Hostel Structure</h1>
      <p className="page-subtitle">Browse hostels and blocks</p>
     </div>
    </div>

    <div className="card">
     <div className="card-body">
      <div className="text-sm text-muted">No hostels found</div>
     </div>
    </div>
   </div>
  )
 }

 return (
  <div className="space-y-6">
   <div className="page-header">
    <div className="min-w-0">
     <h1 className="page-title">Hostel Structure</h1>
     <p className="page-subtitle">Browse hostels, capacity, and blocks</p>
    </div>
   </div>

   <div className="grid gap-6 lg:grid-cols-2">
    {(data as HostelWithBlocksRow[]).map((h) => (
     <div key={h.hostel_id} className="card overflow-hidden">
      <div className="card-header">
       <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
         <h2 className="text-base font-semibold tracking-tight text-foreground truncate">{h.hostel_name}</h2>
         <div className="mt-1 flex flex-wrap items-center gap-2">
          {h.gender_type && (
           <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
            {h.gender_type}
           </span>
          )}
          {typeof h.total_capacity === 'number' && (
           <span className="px-2 py-1 rounded-full text-xs font-medium bg-card border border-border text-foreground/80">
            Capacity: {h.total_capacity}
           </span>
          )}
         </div>
        </div>

        <div className="text-right">
         <div className="text-xs text-muted">Blocks</div>
         <div className="text-sm font-semibold text-foreground">
          {h.block?.length || 0}
         </div>
        </div>
       </div>
      </div>

      <div className="card-body">
       {!h.block || h.block.length === 0 ? (
        <div className="text-sm text-muted">No blocks</div>
       ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
         {h.block.map((b: BlockRow) => (
          <Link
           key={b.block_id}
           href={`/dashboard/hostel/block/${b.block_id}`}
           className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 transition-[background-color,box-shadow] hover:bg-primary-50/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
           <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{b.block_name}</div>
            <div className="text-xs text-muted">Block ID: {b.block_id}</div>
           </div>
           <div className="text-xs text-muted group-hover:text-foreground/70 transition-colors">
            View floors
           </div>
          </Link>
         ))}
        </div>
       )}
      </div>
     </div>
    ))}
   </div>
  </div>
 )
}
