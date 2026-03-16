
"use client"

import { useMemo, useState } from "react"
import { Database } from "@/lib/supabase/database"

type Complaint = Database['public']['Tables']['complaint_log']['Row'] & {
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
}

interface ComplaintTableProps {
  complaints?: Complaint[]
}

export default function ComplaintTable({ complaints = [] }: ComplaintTableProps) {
  const [query, setQuery] = useState("")
  const [severity, setSeverity] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState<number>(1)

  const categories = useMemo(() => {
    const set = new Set<string>()
    complaints.forEach((c) => {
      if (c.category) set.add(String(c.category))
    })
    return Array.from(set).sort()
  }, [complaints])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return complaints.filter((c) => {
      if (severity && String(c.severity) !== severity) return false
      if (status && String(c.status) !== status) return false
      if (category && String(c.category) !== category) return false

      if (!q) return true

      const haystack = [
        String(c.complaint_id ?? ""),
        String(c.category ?? ""),
        String(c.severity ?? ""),
        String(c.status ?? ""),
        String(c.description ?? ""),
        String(c.student?.full_name ?? ""),
        String(c.student?.roll_number ?? ""),
        String(c.student?.room?.room_number ?? ""),
        String(c.student?.room?.floor?.block?.block_name ?? ""),
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [complaints, query, severity, status, category])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  const resetPage = () => setPage(1)

  const severityPill = (sev?: string | null) => {
    switch (sev) {
      case "critical":
        return "text-danger-600 bg-danger-50"
      case "high":
        return "text-orange-700 bg-orange-50"
      case "medium":
        return "text-yellow-700 bg-yellow-50"
      case "low":
        return "text-success-600 bg-success-50"
      default:
        return "text-muted bg-primary-50/60"
    }
  }

  const statusPill = (st?: string | null) => {
    switch (st) {
      case "resolved":
        return "text-success-600 bg-success-50"
      case "dismissed":
        return "text-foreground/70 bg-primary-50/60"
      case "pending":
      default:
        return "text-yellow-700 bg-yellow-50"
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border bg-background/70">
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-5">
              <label className="sr-only" htmlFor="complaint-search">Search</label>
              <input
                id="complaint-search"
                className="input"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  resetPage()
                }}
                placeholder="Search by student, category, severity, status, description, ID..."
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
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                className="input"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  resetPage()
                }}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                className="input"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  resetPage()
                }}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
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
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Category</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Severity</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted">
                  No complaints match the current filters.
                </td>
              </tr>
            ) : (
              paged.map((c) => (
                <tr key={c.complaint_id} className="transition-colors hover:bg-primary-50/40">
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-foreground">#{c.complaint_id}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{c.student?.full_name || "Unknown"}</div>
                    <div className="text-xs text-muted">
                      {c.student?.roll_number || "N/A"}
                      {c.student?.room?.room_number ? ` · Room ${c.student.room.room_number}` : ""}
                      {c.student?.room?.floor?.block?.block_name ? ` · ${c.student.room.floor.block.block_name}` : ""}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-foreground">
                    <span className="capitalize">{String(c.category || "—")}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityPill(String(c.severity || ""))}`}>
                      {String(c.severity || "unknown")}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusPill(String(c.status || "pending"))}`}>
                      {String(c.status || "pending")}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-foreground">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', {
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
