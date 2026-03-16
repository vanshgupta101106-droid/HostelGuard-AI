'use client'

import { Database } from '@/lib/supabase/database'
import Card from '@/components/ui/Card'

type RiskProfile = Database['public']['Tables']['individual_risk_profile']['Row'] & {
  student: {
    full_name: string
    roll_number: string
    department: string
    room?: {
      room_number: string
      floor: {
        block: {
          block_name: string
        }
      }
    }
  }
}

interface RiskProfileProps {
  data: RiskProfile[]
}

export default function RiskProfile({ data }: RiskProfileProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 50) return 'text-red-600'
    if (score >= 30) return 'text-orange-600'
    if (score >= 15) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Risk Profiles</h3>
        <div className="text-sm text-gray-500">
          Total: {data.length} students
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map(profile => (
          <Card key={profile.risk_profile_id} className={`p-4 border-2 ${getRiskColor(profile.risk_level)}`}>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{profile.student?.full_name}</h4>
                  <p className="text-sm text-gray-600">{profile.student?.roll_number}</p>
                  <p className="text-xs text-gray-500">{profile.student?.department}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(profile.risk_level)}`}>
                  {profile.risk_level.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Score:</span>
                <span className={`text-lg font-bold ${getScoreColor(profile.risk_score)}`}>
                  {profile.risk_score}
                </span>
              </div>
              
              {profile.student?.room && (
                <div className="text-xs text-gray-500">
                  Room: {profile.student.room.room_number} ({profile.student.room.floor.block.block_name})
                </div>
              )}
              
              <div className="text-xs text-gray-400">
                Last updated: {new Date(profile.last_updated).toLocaleDateString()}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
