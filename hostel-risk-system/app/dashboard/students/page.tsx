import { getStudents } from "@/lib/services/student.service"
import StudentTable from "@/components/students/StudentTable"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function StudentsPage() {
  // Fetch students using the same working method as dashboard
  const result = await getStudents()
  
  if (!result.data) {
    console.error('Failed to fetch students:', result.error)
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Students</h1>
        </div>
        <div className="card p-6">
          <p className="text-danger-600">Error loading students: {result.error?.message || 'Unknown error'}</p>
        </div>
      </div>
    )
  }
  
  console.log('Loaded students:', result.data.length)
  
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage student records and assignments with advanced filtering</p>
        </div>

        <Link
          href="/dashboard/students/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-[0.5px] bg-primary-600 text-white shadow-sm hover:bg-primary-700 h-10 px-4 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </Link>
      </div>

      <StudentTable initialStudents={result.data || []} />
    </div>
  )
}