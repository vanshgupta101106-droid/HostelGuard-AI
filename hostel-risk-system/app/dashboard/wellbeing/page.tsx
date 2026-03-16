import { getWellbeingSurveys, getWellbeingStats } from '@/lib/services/wellbeing.service'
import { getStudents } from '@/lib/services/student.service'
import { createWellbeingSurvey } from '@/lib/services/wellbeing.service'
import { Database } from '@/lib/supabase/database'
import StatsCard from '@/components/dashboard/StatsCard'
import SurveyForm from '@/components/wellbeing/SurveyForm'
import SurveyTable from '@/components/wellbeing/SurveyTable'

async function submitSurvey(data: Database['public']['Tables']['wellbeing_survey']['Insert']) {
  'use server'
  try {
    await createWellbeingSurvey(data)
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to submit survey' }
  }
}

export default async function WellbeingPage() {
  const [surveys, stats, students] = await Promise.all([
    getWellbeingSurveys(),
    getWellbeingStats(),
    getStudents()
  ])

  const surveysData = surveys
  const statsData = stats
  const studentsData = students

  const surveyList = surveysData.data || []
  const wellbeingStats = statsData || { totalResponses: 0, avgStressLevel: 0, moodDistribution: {}, stressLevels: { low: 0, medium: 0, high: 0 } }

  const totalSurveys = wellbeingStats.totalResponses
  const averageStress = wellbeingStats.avgStressLevel
  const highStressCount = wellbeingStats.stressLevels?.high || 0
  const responseRate = studentsData.data ? ((totalSurveys / studentsData.data.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Wellbeing Dashboard</h1>
          <p className="page-subtitle">Monitor student mental health and wellbeing</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Surveys"
          value={totalSurveys}
          subtitle="All responses"
        />
        <StatsCard
          title="Average Stress"
          value={averageStress.toFixed(1)}
          subtitle="Out of 10"
          trendUp={false}
        />
        <StatsCard
          title="High Stress"
          value={highStressCount}
          subtitle="8+ stress level"
          trendUp={false}
        />
        <StatsCard
          title="Response Rate"
          value={`${responseRate.toFixed(1)}%`}
          subtitle="Student participation"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
          <SurveyTable surveys={surveyList} />
        </div>

        <div className="xl:col-span-4">
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold tracking-tight text-foreground">Submit Survey</h2>
              <p className="text-sm text-muted mt-1">Record student wellbeing data</p>
            </div>
            <div className="card-body">
              <SurveyForm
                action={submitSurvey}
                students={studentsData.data || []}
              />
            </div>
          </div>

          {Object.entries(wellbeingStats.moodDistribution || {}).length > 0 && (
            <div className="card mt-6">
              <div className="card-header">
                <h2 className="text-base font-semibold tracking-tight text-foreground">Mood Distribution</h2>
                <p className="text-sm text-muted mt-1">Current mood breakdown</p>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  {Object.entries(wellbeingStats.moodDistribution).map(([mood, count]) => (
                    <div key={mood} className="flex justify-between items-center">
                      <span className="capitalize text-sm text-foreground">{mood.replace('-', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(count / totalSurveys) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
