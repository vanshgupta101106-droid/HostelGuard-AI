import { Suspense } from "react"
import { getIncidents, getIncidentStats } from "@/lib/services/incident.service"
import { getStudents } from "@/lib/services/student.service"
import IncidentTable from "@/components/incidents/IncidentTable"
import IncidentForm from "@/components/incidents/IncidentForm"
import { Database } from "@/lib/supabase/database"

type Incident = Database['public']['Tables']['incident']['Row'] & {
  student?: Database['public']['Tables']['student']['Row']
  warden?: Database['public']['Tables']['warden']['Row']
}

export default async function IncidentsPage() {
  const incidentsResult = await getIncidents()
  const stats = await getIncidentStats()
  const studentsResult = await getStudents()

  const incidents = incidentsResult.data || []
  const students = studentsResult.data || []

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Incidents</h1>
          <p className="page-subtitle">Review, verify, and investigate incidents at scale</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card card-hover">
            <div className="card-body">
              <div className="text-sm text-muted">Total incidents</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{stats.total}</div>
            </div>
          </div>
          <div className="card card-hover">
            <div className="card-body">
              <div className="text-sm text-muted">Verified</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{stats.verified}</div>
            </div>
          </div>
          <div className="card card-hover">
            <div className="card-body">
              <div className="text-sm text-muted">Pending verification</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{stats.unverified}</div>
            </div>
          </div>
          <div className="card card-hover">
            <div className="card-body">
              <div className="text-sm text-muted">Critical</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{stats.bySeverity?.critical || 0}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
          <Suspense fallback={<div>Loading incidents...</div>}>
            <IncidentTable incidents={incidents as Incident[]} />
          </Suspense>
        </div>

        <div className="xl:col-span-4">
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold tracking-tight text-foreground">Report incident</h2>
              <p className="text-sm text-muted mt-1">Create a new incident record</p>
            </div>
            <div className="card-body">
              <Suspense fallback={<div>Loading form...</div>}>
                <IncidentForm students={students} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
