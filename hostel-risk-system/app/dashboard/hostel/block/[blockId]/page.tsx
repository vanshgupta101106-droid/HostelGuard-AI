import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase/server"
import { getBlockById, getFloors } from "@/lib/services/hostel.service"
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
  const floors = (floorsRes.data || []) as FloorRow[]

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
              {floors.map((f) => (
                <Link
                  key={f.floor_id}
                  href={`/dashboard/hostel/block/${block.block_id}/floor/${f.floor_id}`}
                  className="group rounded-xl border border-border bg-background px-4 py-3 transition-[background-color,box-shadow] hover:bg-primary-50/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">Floor {f.floor_number}</div>
                      <div className="text-xs text-muted mt-0.5">Floor ID: {f.floor_id}</div>
                    </div>
                    <div className="text-xs text-muted group-hover:text-foreground/70 transition-colors">View rooms</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
