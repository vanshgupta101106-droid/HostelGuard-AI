import { getBehaviorLogs, getBehaviorStats } from '@/lib/services/behavior.service'
import { getStudents } from '@/lib/services/student.service'
import { getWardens } from '@/lib/services/warden.service'
import StatsCard from '@/components/dashboard/StatsCard'
import BehaviorFormWrapper from '@/components/behavior/BehaviorFormWrapper'
import BehaviorTable from '@/components/behavior/BehaviorTable'

export default async function BehaviorPage() {
  const [behaviorLogs, behaviorStats, students, wardens] = await Promise.all([
    getBehaviorLogs(),
    getBehaviorStats(),
    getStudents(),
    getWardens()
  ])

  const logsData = await behaviorLogs
  const statsData = behaviorStats
  const studentsData = await students
  const wardensData = await wardens

  const behaviors = logsData.data || []
  const stats = statsData || { total: 0, bySeverity: {}, byType: {} }

  const totalBehaviors = stats.total
  const highSeverityBehaviors = stats.bySeverity?.high || 0
  const mediumSeverityBehaviors = stats.bySeverity?.medium || 0
  const recentBehaviors = behaviors.filter((b: any) => {
    const occurredDate = new Date(b.occurred_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return occurredDate >= weekAgo
  }).length

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Behavior Logs</h1>
          <p className="page-subtitle">Track and manage student behavior incidents</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total"
          value={totalBehaviors}
          subtitle="All behavior logs"
        />
        <StatsCard
          title="High Severity"
          value={highSeverityBehaviors}
          subtitle="Critical incidents"
          trendUp={false}
        />
        <StatsCard
          title="Medium Severity"
          value={mediumSeverityBehaviors}
          subtitle="Moderate incidents"
        />
        <StatsCard
          title="This Week"
          value={recentBehaviors}
          subtitle="Recent activity"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
          <BehaviorTable data={behaviors} />
        </div>

        <div className="xl:col-span-4">
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold tracking-tight text-foreground">Log Behavior</h2>
              <p className="text-sm text-muted mt-1">Record a new behavior incident</p>
            </div>
            <div className="card-body">
              <BehaviorFormWrapper
                students={studentsData.data || []}
                wardens={wardensData.data || []}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
