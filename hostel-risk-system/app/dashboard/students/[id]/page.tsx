import { getStudentById } from "@/lib/services/student.service"
import { notFound } from "next/navigation"

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: student, error } = await getStudentById(id)

  if (error || !student) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{student.full_name}</h1>
        <p className="page-subtitle">{student.roll_number} • {student.department}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Student Info Card */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Student Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted">Roll Number</span>
              <span className="font-medium">{student.roll_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Department</span>
              <span className="font-medium">{student.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Year</span>
              <span className="font-medium">Year {student.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                student.status === 'active'
                  ? 'text-success-600 bg-success-50'
                  : student.status === 'suspended'
                    ? 'text-danger-600 bg-danger-50'
                    : 'text-muted bg-primary-50/60'
              }`}>
                {student.status || 'unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Parent Contact</span>
              <span className="font-medium">{student.parent_contact}</span>
            </div>
          </div>
        </div>

        {/* Room Info Card */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Room Information</h2>
          {student.room ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted">Room Number</span>
                <span className="font-medium">{student.room.room_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Capacity</span>
                <span className="font-medium">{student.room.capacity}</span>
              </div>
              {student.room.floor && (
                <div className="flex justify-between">
                  <span className="text-muted">Floor</span>
                  <span className="font-medium">Floor {student.room.floor.floor_number}</span>
                </div>
              )}
              {student.room.floor?.block && (
                <div className="flex justify-between">
                  <span className="text-muted">Block</span>
                  <span className="font-medium">{student.room.floor.block.block_name}</span>
                </div>
              )}
              {student.room.floor?.block?.hostel && (
                <div className="flex justify-between">
                  <span className="text-muted">Hostel</span>
                  <span className="font-medium">{student.room.floor.block.hostel.hostel_name}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted">No room assigned</p>
          )}
        </div>

        {/* Risk Profile Card */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Risk Profile</h2>
          {student.individual_risk_profile ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted">Risk Score</span>
                <span className="font-medium">{student.individual_risk_profile.risk_score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Risk Level</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  student.individual_risk_profile.risk_level === 'critical' ? 'bg-danger-100 text-danger-700' :
                  student.individual_risk_profile.risk_level === 'high' ? 'bg-warning-100 text-warning-700' :
                  student.individual_risk_profile.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-success-100 text-success-700'
                }`}>
                  {student.individual_risk_profile.risk_level}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-muted">No risk profile available</p>
          )}
        </div>
      </div>
    </div>
  )
}
