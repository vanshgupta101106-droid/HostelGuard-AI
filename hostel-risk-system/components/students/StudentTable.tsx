'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from "@/lib/supabase/database"
import Table from "@/components/ui/Table"
import StudentFilters from "./StudentFilters"
import StudentRiskDetailsModal from "./StudentRiskDetailsModal"
import NotifyModal from "./NotifyModal"
import Button from "@/components/ui/Button"
import { StudentFilters as StudentFiltersType } from "@/lib/services/student.service"

type StudentRow = Database['public']['Tables']['student']['Row'] & {
  room?: {
    room_number: string
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

interface StudentTableProps {
  initialStudents?: StudentRow[]
}

export default function StudentTable({ initialStudents = [] }: StudentTableProps) {
  const router = useRouter()
  const [filters, setFilters] = useState<StudentFiltersType>({})
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false)
  const [studentToNotify, setStudentToNotify] = useState<StudentRow | null>(null)

  // Use useMemo to prevent infinite re-renders
  const filteredStudents = useMemo(() => {
    let result = initialStudents

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(student => 
        student.full_name.toLowerCase().includes(searchLower) ||
        student.roll_number.toLowerCase().includes(searchLower) ||
        student.department.toLowerCase().includes(searchLower)
      )
    }

    // Apply hostel filter
    if (filters.hostel_id) {
      result = result.filter(student => {
        if (!student.room?.floor?.block?.hostel?.hostel_name) return false
        const hostelName = student.room.floor.block.hostel.hostel_name.toLowerCase()
        const isBoysHostel = hostelName.includes('boys')
        return filters.hostel_id === (isBoysHostel ? 1 : 2)
      })
    }

    // Apply department filter
    if (filters.department) {
      result = result.filter(student => student.department === filters.department)
    }

    // Apply year filter
    if (filters.year) {
      result = result.filter(student => student.year === filters.year)
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter(student => student.status === filters.status)
    }

    // Apply risk level filter
    if (filters.risk_level) {
      result = result.filter(student => 
        student.individual_risk_profile?.risk_level === filters.risk_level
      )
    }

    return result
  }, [filters, initialStudents])

  const columns = [
    { key: 'full_name', label: 'Student' },
    { key: 'roll_number', label: 'Roll Number' },
    { key: 'room_info', label: 'Room' },
    { key: 'department', label: 'Department' },
    { key: 'year', label: 'Year' },
    { key: 'risk_level', label: 'Risk Level' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ]

  const rows = useMemo(() => filteredStudents.map((student) => ({
    ...student,
    room_info: student.room ? (
      <div className="text-sm">
        <div className="font-medium">{student.room.room_number}</div>
        {student.room.floor?.block && (
          <div className="text-xs text-muted">
            {student.room.floor.block.block_name}
            {student.room.floor.block.hostel && (
              <span> • {student.room.floor.block.hostel.hostel_name}</span>
            )}
          </div>
        )}
      </div>
    ) : (
      <span className="text-muted">—</span>
    ),
    year: student.year ? `Year ${student.year}` : '—',
    risk_level: student.individual_risk_profile ? (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        student.individual_risk_profile.risk_level === 'critical' ? 'bg-danger-100 text-danger-700' :
        student.individual_risk_profile.risk_level === 'high' ? 'bg-warning-100 text-warning-700' :
        student.individual_risk_profile.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
        'bg-success-100 text-success-700'
      }`}>
        {student.individual_risk_profile.risk_level}
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Unknown
      </span>
    ),
    status: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        student.status === 'active'
          ? 'text-success-600 bg-success-50'
          : student.status === 'suspended'
            ? 'text-danger-600 bg-danger-50'
            : 'text-muted bg-primary-50/60'
      }`}>
        {student.status || 'unknown'}
      </span>
    ),
    actions: (
      <div className="flex gap-2">
        {student.individual_risk_profile?.risk_level === 'critical' && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setStudentToNotify(student)
              setIsNotifyModalOpen(true)
            }}
          >
            Notify Parent
          </Button>
        )}
      </div>
    ),
  })), [filteredStudents])

  const handleFiltersChange = (newFilters: StudentFiltersType) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  const handleRowClick = (row: any, index: number) => {
    const student = filteredStudents[index]
    if (student) {
      router.push(`/dashboard/students/${student.student_id}`)
    }
  }

  const handleCloseNotifyModal = () => {
    setIsNotifyModalOpen(false)
    setStudentToNotify(null)
  }

  return (
    <div className="space-y-4">
      <StudentFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />
      
      <div className="card h-224 overflow-y-auto">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted">
              Showing {filteredStudents.length} students
              {Object.values(filters).some(value => value !== undefined && value !== '') && (
                <span className="ml-2 text-primary-600">
                  (filtered)
                </span>
              )}
            </div>
            
            {/* Quick stats */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success-500"></div>
                <span className="text-muted">Active: {filteredStudents.filter(s => s.status === 'active').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning-500"></div>
                <span className="text-muted">High Risk: {filteredStudents.filter(s => s.individual_risk_profile?.risk_level === 'high' || s.individual_risk_profile?.risk_level === 'critical').length}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table columns={columns} data={rows} onRowClick={handleRowClick} />
        </div>
      </div>

      
      <NotifyModal
        isOpen={isNotifyModalOpen}
        onClose={handleCloseNotifyModal}
        student={studentToNotify}
      />
    </div>
  )
}
