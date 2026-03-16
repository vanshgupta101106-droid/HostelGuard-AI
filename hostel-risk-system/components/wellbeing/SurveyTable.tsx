"use client"

import { useMemo, useState } from "react"
import { Database } from "@/lib/supabase/database"

type Survey = Database['public']['Tables']['wellbeing_survey']['Row'] & {
  student?: {
    full_name?: string | null
    roll_number?: string | null
  } | null
}

interface SurveyTableProps {
  surveys?: Survey[]
}

export default function SurveyTable({ surveys = [] }: SurveyTableProps) {
  const [query, setQuery] = useState("")
  const [mood, setMood] = useState<string>("")
  const [minStress, setMinStress] = useState<string>("")
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState<number>(1)

  const moods = useMemo(() => {
    const set = new Set<string>()
    surveys.forEach((s) => {
      if (s.mood) set.add(String(s.mood))
    })
    return Array.from(set).sort()
  }, [surveys])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const min = minStress ? Number(minStress) : null

    return surveys.filter((s) => {
      if (mood && String(s.mood) !== mood) return false
      if (min !== null && Number.isFinite(min) && s.stress_level < min) return false

      if (!q) return true

      const haystack = [
        String(s.survey_id ?? ""),
        String(s.submitted_week ?? ""),
        String(s.stress_level ?? ""),
        String(s.mood ?? ""),
        String(s.student?.full_name ?? ""),
        String(s.student?.roll_number ?? ""),
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [surveys, query, mood, minStress])

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
            <div className="lg:col-span-6">
              <label className="sr-only" htmlFor="survey-search">Search</label>
              <input
                id="survey-search"
                className="input"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  resetPage()
                }}
                placeholder="Search by student, mood, stress, week, ID..."
              />
            </div>

            <div className="lg:col-span-2">
              <select
                className="input"
                value={mood}
                onChange={(e) => {
                  setMood(e.target.value)
                  resetPage()
                }}
              >
                <option value="">All moods</option>
                {moods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <input
                className="input"
                value={minStress}
                onChange={(e) => {
                  setMinStress(e.target.value)
                  resetPage()
                }}
                placeholder="Min stress"
                inputMode="numeric"
              />
            </div>

            <div className="lg:col-span-2">
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
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Student</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Week</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Stress</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Mood</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Submitted</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted">
                  No surveys match the current filters.
                </td>
              </tr>
            ) : (
              paged.map((s) => (
                <tr key={s.survey_id} className="transition-colors hover:bg-primary-50/40">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{s.student?.full_name || "Unknown"}</div>
                    <div className="text-xs text-muted">{s.student?.roll_number || "N/A"}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-foreground">{s.submitted_week ?? "—"}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      s.stress_level >= 8
                        ? "text-danger-600 bg-danger-50"
                        : s.stress_level >= 5
                          ? "text-yellow-700 bg-yellow-50"
                          : "text-success-600 bg-success-50"
                    }`}>
                      {s.stress_level}/10
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-foreground capitalize">
                    {String(s.mood || "—").replace("-", " ")}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-foreground">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', {
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
