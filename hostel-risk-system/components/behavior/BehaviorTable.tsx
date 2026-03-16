"use client"

import { useMemo, useState } from "react"
import { Database } from "@/lib/supabase/database"

type BehaviorLog = Database['public']['Tables']['behavior_log']['Row'] & {
  student?: {
    full_name?: string | null
    roll_number?: string | null
    room?: {
      room_number?: string | null
      floor?: {
        block?: {
          block_name?: string | null
        } | null
      } | null
    } | null
  } | null
  warden?: {
    warden_id?: number
    name?: string | null
  } | null
}

interface BehaviorTableProps {
  data?: BehaviorLog[]
}

export default function BehaviorTable({ data = [] }: BehaviorTableProps) {
  const [query, setQuery] = useState("")
  const [severity, setSeverity] = useState<string>("")
  const [behaviorType, setBehaviorType] = useState<string>("")
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState<number>(1)

  const behaviorTypes = useMemo(() => {
    const set = new Set<string>()
    data.forEach((b) => {
      if (b.behavior_type) set.add(String(b.behavior_type))
    })
    return Array.from(set).sort()
  }, [data])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return data.filter((b) => {
      if (severity && String(b.severity) !== severity) return false
      if (behaviorType && String(b.behavior_type) !== behaviorType) return false

      if (!q) return true

      const haystack = [
        String(b.behavior_id ?? ""),
        String(b.behavior_type ?? ""),
        String(b.severity ?? ""),
        String(b.remarks ?? ""),
        String(b.student?.full_name ?? ""),
        String(b.student?.roll_number ?? ""),
        String(b.student?.room?.room_number ?? ""),
        String(b.student?.room?.floor?.block?.block_name ?? ""),
        String(b.warden?.name ?? ""),
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [data, query, severity, behaviorType])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  const resetPage = () => setPage(1)

  const severityPill = (sev?: string | null) => {
    switch (sev) {
      case "high":
        return "text-danger-600 bg-danger-50"
      case "medium":
        return "text-yellow-700 bg-yellow-50"
      case "low":
        return "text-success-600 bg-success-50"
      default:
        return "text-muted bg-primary-50/60"
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border bg-background/70">
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-6">
              <label className="sr-only" htmlFor="behavior-search">Search</label>
              <input
                id="behavior-search"
                className="input"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  resetPage()
                }}
                placeholder="Search by student, behavior type, severity, remarks, warden..."
              />
            </div>

            <div className="lg:col-span-2">
              <select
                className="input"
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value)
                  resetPage()
                }}
              >
                <option value="">All severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <select
                className="input"
                value={behaviorType}
                onChange={(e) => {
                  setBehaviorType(e.target.value)
                  resetPage()
                }}
              >
                <option value="">All behavior types</option>
                {behaviorTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
              <select
                className="input"
                value={String(pageSize)}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
            <div className="text-muted">Showing {paged.length} of {filtered.length}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 h-9 text-sm text-foreground/80 hover:bg-primary-50 transition-colors disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                Prev
              </button>
              <div className="text-muted">Page {currentPage} / {totalPages}</div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 h-9 text-sm text-foreground/80 hover:bg-primary-50 transition-colors disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-background">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">ID</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Student</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Behavior</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Severity</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Reported By</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted">
                  No behavior logs match the current filters.
                </td>
              </tr>
            ) : (
              paged.map((b) => (
                <tr key={b.behavior_id} className="transition-colors hover:bg-primary-50/40">
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-foreground">#{b.behavior_id}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{b.student?.full_name || "Unknown"}</div>
                    <div className="text-xs text-muted">
                      {b.student?.roll_number || "N/A"}
                      {b.student?.room?.room_number ? ` · Room ${b.student.room.room_number}` : ""}
                      {b.student?.room?.floor?.block?.block_name ? ` · ${b.student.room.floor.block.block_name}` : ""}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground capitalize">{String(b.behavior_type || "—")}</div>
                    <div className="text-xs text-muted truncate max-w-xs">
                      {b.remarks || "No remarks"}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityPill(String(b.severity || ""))}`}>
                      {String(b.severity || "unknown")}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-foreground">
                    {b.warden?.name || "Unknown"}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-foreground">
                    {b.occurred_at ? new Date(b.occurred_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      timeZone: 'UTC'
                    }) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
