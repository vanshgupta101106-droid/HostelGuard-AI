import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase/server"
import { getBlockById, getFloorById, getRooms } from "@/lib/services/hostel.service"
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
  const rooms = (roomsRes.data || []) as RoomRow[]

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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {rooms.map((r) => {
                const occupants = r.students?.length || 0

                return (
                  <div
                    key={r.room_id}
                    className="rounded-xl border border-border bg-background px-4 py-3 transition-[background-color,box-shadow] hover:bg-primary-50/30 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-foreground">{r.room_number}</div>
                      <div className="text-xs text-muted">#{r.room_id}</div>
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      Capacity: {r.capacity ?? "—"} · Occupied: {occupants}
                    </div>
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
