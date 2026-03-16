import { getStudents } from "@/lib/services/student.service"
import { getComplaints } from "@/lib/services/complaint.service"
import StatsCard from "@/components/dashboard/StatsCard"
import ComplaintTable from "@/components/complaints/ComplaintTable"
import ComplaintForm from "@/components/complaints/ComplaintForm"

export default async function ComplaintsPage() {
  const [studentsRes, complaintsRes] = await Promise.all([getStudents(), getComplaints()])

  const students = studentsRes.data || []
  const complaints = complaintsRes.data || []

  const totalComplaints = complaints.length
  const pendingComplaints = complaints.filter((c: any) => c.status === "pending").length
  const resolvedComplaints = complaints.filter((c: any) => c.status === "resolved").length
  const criticalComplaints = complaints.filter((c: any) => c.severity === "critical").length

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Complaints</h1>
          <p className="page-subtitle">Track, triage, and resolve complaints at scale</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total"
          value={totalComplaints}
          subtitle="All complaints"
        />
        <StatsCard
          title="Pending"
          value={pendingComplaints}
          subtitle="Needs action"
        />
        <StatsCard
          title="Resolved"
          value={resolvedComplaints}
          subtitle="Closed"
        />
        <StatsCard
          title="Critical"
          value={criticalComplaints}
          subtitle="Urgent"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
          <ComplaintTable complaints={complaints as any} />
        </div>

        <div className="xl:col-span-4">
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold tracking-tight text-foreground">Create complaint</h2>
              <p className="text-sm text-muted mt-1">Log a new complaint for a student</p>
            </div>
            <div className="card-body">
              <ComplaintForm students={students as any} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
