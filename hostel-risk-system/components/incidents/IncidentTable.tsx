"use client"

import { useMemo, useState } from "react"
import { Database } from "@/lib/supabase/database"
import { supabase } from "@/lib/supabase/client"

type Incident = Database['public']['Tables']['incident']['Row'] & {
  student?: Database['public']['Tables']['student']['Row']
  warden?: Database['public']['Tables']['warden']['Row']
}

interface IncidentTableProps {
  incidents?: Incident[]
  onRefresh?: () => void
}

const severityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800", 
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
}

export default function IncidentTable({ incidents = [], onRefresh }: IncidentTableProps) {
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [severity, setSeverity] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  const [verified, setVerified] = useState<string>("")
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState<number>(1)

  const handleVerify = async (incidentId: number) => {
    setLoading(true)
    try {
      // For now, we'll use a default warden ID (1) since we don't have authentication
      // In a real app, this should come from the logged-in warden's session
      const response = await fetch('/api/incidents/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incidentId,
          wardenId: 1 // Default warden ID - should come from auth session
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to verify incident')
      }

      onRefresh?.()
    } catch (err: any) {
      console.error("Failed to verify incident:", err)
    } finally {
      setLoading(false)
    }
  }

  const categories = useMemo(() => {
    const set = new Set<string>()
    incidents.forEach((i) => {
      if (i.category) set.add(String(i.category))
    })
    return Array.from(set).sort()
  }, [incidents])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return incidents.filter((i) => {
      if (severity && String(i.severity) !== severity) return false
      if (category && String(i.category) !== category) return false
      if (verified === "verified" && !i.verified_by) return false
      if (verified === "unverified" && !!i.verified_by) return false

      if (!q) return true

      const haystack = [
        String(i.incident_id ?? ""),
        String(i.category ?? ""),
        String(i.severity ?? ""),
        String(i.description ?? ""),
        String(i.student?.full_name ?? ""),
        String(i.student?.roll_number ?? ""),
        String(i.warden?.name ?? ""),
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [incidents, query, severity, category, verified])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  const resetPage = () => setPage(1)

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border bg-background/70">
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-5">
              <label className="sr-only" htmlFor="incident-search">Search</label>
              <input
                id="incident-search"
                className="input"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  resetPage()
                }}
                placeholder="Search by student, category, severity, description, ID..."
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

            <div className="lg:col-span-2">
              <select
                className="input"
                value={verified}
                onChange={(e) => {
                  setVerified(e.target.value)
                  resetPage()
                }}
              >
                <option value="">All</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
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
              <div className="text-muted">
                Page {currentPage} / {totalPages}
              </div>
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
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Verified</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted">
                  No incidents match the current filters.
                </td>
              </tr>
            ) : (
              paged.map((incident) => (
                <tr key={incident.incident_id} className="transition-colors hover:bg-primary-50/40">
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-foreground">#{incident.incident_id}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{incident.student?.full_name || "Unknown"}</div>
                    <div className="text-xs text-muted">{incident.student?.roll_number || "N/A"}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-foreground">
                    <span className="capitalize">{incident.category}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${severityColors[incident.severity]}`}>
                      {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-foreground">
                    {new Date(incident.incident_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      timeZone: 'UTC'
                    })}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {incident.verified_by ? (
                      <div className="text-sm text-foreground">{incident.warden?.name || "Verified"}</div>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary-50 text-foreground/80">
                        Not Verified
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      {!incident.verified_by && (
                        <button
                          onClick={() => handleVerify(incident.incident_id)}
                          disabled={loading}
                          className="text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
                        >
                          Verify
                        </button>
                      )}
                      <button className="text-foreground/70 hover:text-foreground transition-colors">
                        View
                      </button>
                    </div>
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
