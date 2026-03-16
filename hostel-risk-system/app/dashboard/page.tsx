import StatsCard from "@/components/dashboard/StatsCard"
import { Users, AlertTriangle, TrendingUp, CheckCircle, Home, Activity, MessageSquare, Shield } from "lucide-react"
import { getStudents } from "@/lib/services/student.service"
import { getIncidentStats } from "@/lib/services/incident.service"
import { getRiskOverview } from "@/lib/services/risk.service"
import { getComplaintStats } from "@/lib/services/complaint.service"
import { getWellbeingSurveys } from "@/lib/services/wellbeing.service"
import { getHostelsWithBlocks } from "@/lib/services/hostel.service"
import { getBehaviorLogs } from "@/lib/services/behavior.service"

export default async function DashboardPage() {
  const [
    studentsRes,
    incidentStats,
    riskOverview,
    complaintStats,
    wellbeingRes,
    hostelsRes,
    behaviorRes
  ] = await Promise.all([
    getStudents(),
    getIncidentStats(),
    getRiskOverview(),
    getComplaintStats(),
    getWellbeingSurveys(),
    getHostelsWithBlocks(),
    getBehaviorLogs()
  ])

  const students = studentsRes.data || []
  const wellbeingSurveys = wellbeingRes.data || []
  const hostels = hostelsRes.data || []
  const behaviorLogs = behaviorRes.data || []

  // Core metrics
  const totalStudents = students.length
  const totalIncidents = incidentStats?.total || 0
  const highRiskStudents = riskOverview?.highRiskStudents || 0
  const pendingComplaints = complaintStats?.byStatus?.pending || 0

  // Additional metrics
  const totalHostels = hostels.length
  const totalBlocks = hostels.reduce((acc, hostel) => acc + (hostel.block?.length || 0), 0)
  const totalWellbeingSurveys = wellbeingSurveys.length
  const averageStress = wellbeingSurveys.length > 0 
    ? (wellbeingSurveys.reduce((acc, s) => acc + s.stress_level, 0) / wellbeingSurveys.length).toFixed(1)
    : "0"
  const highStressCount = wellbeingSurveys.filter(s => s.stress_level >= 8).length
  const totalBehaviorLogs = behaviorLogs.length
  const criticalBehaviorLogs = behaviorLogs.filter(b => b.severity === 'high').length

  // Calculate response rates
  const wellbeingResponseRate = totalStudents > 0 
    ? ((totalWellbeingSurveys / totalStudents) * 100).toFixed(1)
    : "0"

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Monitor hostel safety, student wellbeing, and operational metrics</p>
        </div>
      </div>

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Students"
          value={totalStudents}
          subtitle="Total enrolled"
          icon={Users}
          iconColor="text-primary-600"
        />
        <StatsCard
          title="Active Incidents"
          value={totalIncidents}
          subtitle="Requiring attention"
          icon={AlertTriangle}
          iconColor="text-danger-600"
        />
        <StatsCard
          title="High Risk"
          value={highRiskStudents}
          subtitle="Students flagged"
          icon={TrendingUp}
          iconColor="text-warning-600"
        />
        <StatsCard
          title="Pending Complaints"
          value={pendingComplaints}
          subtitle="Awaiting resolution"
          icon={CheckCircle}
          iconColor="text-success-600"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card card-hover">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Hostels</p>
                <p className="text-2xl font-semibold tracking-tight text-foreground">{totalHostels}</p>
                <p className="text-xs text-muted mt-1">{totalBlocks} blocks</p>
              </div>
              <Home className="w-8 h-8 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="card card-hover">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Wellbeing Surveys</p>
                <p className="text-2xl font-semibold tracking-tight text-foreground">{totalWellbeingSurveys}</p>
                <p className="text-xs text-muted mt-1">{wellbeingResponseRate}% response rate</p>
              </div>
              <Activity className="w-8 h-8 text-success-500" />
            </div>
          </div>
        </div>

        <div className="card card-hover">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Avg Stress Level</p>
                <p className="text-2xl font-semibold tracking-tight text-foreground">{averageStress}</p>
                <p className="text-xs text-muted mt-1">{highStressCount} high stress</p>
              </div>
              <MessageSquare className="w-8 h-8 text-warning-500" />
            </div>
          </div>
        </div>

        <div className="card card-hover">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Behavior Logs</p>
                <p className="text-2xl font-semibold tracking-tight text-foreground">{totalBehaviorLogs}</p>
                <p className="text-xs text-muted mt-1">{criticalBehaviorLogs} critical</p>
              </div>
              <Shield className="w-8 h-8 text-danger-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-base font-semibold tracking-tight text-foreground">Risk Distribution</h3>
            <p className="text-sm text-muted mt-1">Student risk levels breakdown</p>
          </div>
          <div className="card-body">
            {riskOverview && (
              <div className="space-y-3">
                {Object.entries(riskOverview.riskDistribution).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between">
                    <span className="text-sm text-foreground capitalize">{level}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      level === 'critical' ? 'bg-danger-100 text-danger-700' :
                      level === 'high' ? 'bg-warning-100 text-warning-700' :
                      level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-success-100 text-success-700'
                    }`}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-base font-semibold tracking-tight text-foreground">Complaint Statistics</h3>
            <p className="text-sm text-muted mt-1">Complaints by severity and status</p>
          </div>
          <div className="card-body">
            {complaintStats && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Total Complaints</span>
                  <span className="font-semibold text-foreground">{complaintStats.total}</span>
                </div>
                {complaintStats.bySeverity && Object.entries(complaintStats.bySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex items-center justify-between">
                    <span className="text-sm text-foreground capitalize">{severity}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      severity === 'critical' ? 'bg-danger-100 text-danger-700' :
                      severity === 'high' ? 'bg-warning-100 text-warning-700' :
                      severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-success-100 text-success-700'
                    }`}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}