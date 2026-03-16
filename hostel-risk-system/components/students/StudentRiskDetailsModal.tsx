'use client'

import Modal from "@/components/ui/Modal"
import { Database } from "@/lib/supabase/database"
import { AlertTriangle, CheckCircle, AlertCircle, XCircle, User, Phone, MapPin, BookOpen, Calendar } from "lucide-react"

type Student = Database['public']['Tables']['student']['Row'] & {
  room?: {
    room_number: string
    capacity?: number
    floor?: {
      floor_number: number
      block?: {
        block_name: string
        hostel?: {
          hostel_name: string
        }
      }
    }
  }
  individual_risk_profile?: {
    risk_score: number
    risk_level: 'low' | 'medium' | 'high' | 'critical'
  }
}

interface StudentRiskDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  student: Student | null
}

export default function StudentRiskDetailsModal({ isOpen, onClose, student }: StudentRiskDetailsModalProps) {
  if (!student) return null

  const getRiskLevelConfig = (level: string) => {
    switch (level) {
      case 'critical':
        return {
          color: 'bg-danger-500',
          bgColor: 'bg-danger-50',
          textColor: 'text-danger-700',
          borderColor: 'border-danger-200',
          icon: XCircle,
          description: 'Immediate attention required. Student shows high-risk indicators that need urgent intervention.',
          action: 'Urgent intervention needed'
        }
      case 'high':
        return {
          color: 'bg-warning-500',
          bgColor: 'bg-warning-50',
          textColor: 'text-warning-700',
          borderColor: 'border-warning-200',
          icon: AlertTriangle,
          description: 'Close monitoring recommended. Student exhibits concerning behavioral patterns.',
          action: 'Increase monitoring'
        }
      case 'medium':
        return {
          color: 'bg-yellow-500',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          icon: AlertCircle,
          description: 'Regular monitoring advised. Student shows some risk indicators.',
          action: 'Continue observation'
        }
      case 'low':
        return {
          color: 'bg-success-500',
          bgColor: 'bg-success-50',
          textColor: 'text-success-700',
          borderColor: 'border-success-200',
          icon: CheckCircle,
          description: 'Normal risk level. Student shows minimal concerning indicators.',
          action: 'Maintain current status'
        }
      default:
        return {
          color: 'bg-gray-500',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          icon: AlertCircle,
          description: 'No risk assessment data available.',
          action: 'Assessment needed'
        }
    }
  }

  const riskConfig = student.individual_risk_profile ? getRiskLevelConfig(student.individual_risk_profile.risk_level) : getRiskLevelConfig('')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student Risk Profile">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Student Header Card */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-3 border border-primary-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary-900 text-sm">{student.full_name}</h3>
              <p className="text-xs text-primary-600">{student.roll_number}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  student.status === 'active'
                    ? 'text-success-600 bg-success-50'
                    : student.status === 'suspended'
                      ? 'text-danger-600 bg-danger-50'
                      : 'text-muted bg-primary-50/60'
                }`}>
                  {student.status || 'unknown'}
                </span>
                <span className="text-xs text-primary-500">•</span>
                <span className="text-xs text-primary-600">{student.department}</span>
                <span className="text-xs text-primary-500">•</span>
                <span className="text-xs text-primary-600">Y{student.year}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Assessment Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-gray-600" />
            Risk Assessment
          </h3>
          
          {student.individual_risk_profile ? (
            <div className="space-y-3">
              {/* Risk Score Card */}
              <div className={`${riskConfig.bgColor} rounded-lg p-4 border ${riskConfig.borderColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Risk Score</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-bold ${riskConfig.textColor}`}>
                        {student.individual_risk_profile.risk_score}
                      </span>
                      <span className="text-xs text-gray-500">/100</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 ${riskConfig.bgColor} rounded-full flex items-center justify-center`}>
                    <riskConfig.icon className={`w-6 h-6 ${riskConfig.color}`} />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-700">Level: <span className={`font-bold uppercase ${riskConfig.textColor}`}>{student.individual_risk_profile.risk_level}</span></span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ease-out ${riskConfig.color}`}
                      style={{ width: `${student.individual_risk_profile.risk_score}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Risk Description */}
              <div className={`rounded-lg p-3 border ${riskConfig.borderColor} ${riskConfig.bgColor}`}>
                <div className="flex items-start gap-2">
                  <riskConfig.icon className={`w-4 h-4 ${riskConfig.color} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1">
                    <p className={`text-xs ${riskConfig.textColor} leading-relaxed`}>
                      {riskConfig.description}
                    </p>
                    <p className={`text-xs font-semibold ${riskConfig.textColor} mt-2`}>
                      Action: {riskConfig.action}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium text-sm">No Risk Assessment Data</p>
              <p className="text-xs text-gray-500">Risk assessment has not been completed for this student.</p>
            </div>
          )}
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Academic Info */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1 text-xs">
              <BookOpen className="w-3 h-3 text-gray-600" />
              Academic
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Dept:</span>
                <span className="font-medium text-gray-900 truncate max-w-[80px]">{student.department}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Year:</span>
                <span className="font-medium text-gray-900">{student.year}</span>
              </div>
            </div>
          </div>

          {/* Location Info */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1 text-xs">
              <MapPin className="w-3 h-3 text-gray-600" />
              Location
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Room:</span>
                <span className="font-medium text-gray-900">{student.room ? student.room.room_number : 'N/A'}</span>
              </div>
              {student.room?.floor?.block && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Block:</span>
                  <span className="font-medium text-gray-900 truncate max-w-[80px]">{student.room.floor.block.block_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1 text-xs">
            <Phone className="w-3 h-3 text-gray-600" />
            Contact
          </h4>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Parent:</span>
            <span className="font-medium text-gray-900">{student.parent_contact || 'N/A'}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
