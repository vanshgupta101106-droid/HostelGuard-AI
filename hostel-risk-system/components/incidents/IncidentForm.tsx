"use client"

import { useState } from "react"
import { Database } from "@/lib/supabase/database"
import { supabase } from "@/lib/supabase/client"
import Button from "@/components/ui/Button"

type IncidentInsert = Database['public']['Tables']['incident']['Insert']

interface IncidentFormProps {
  onSuccess?: () => void
  initialData?: Partial<IncidentInsert>
  students: Database['public']['Tables']['student']['Row'][]
}

const categories = [
  "medical",
  "disciplinary", 
  "academic",
  "social",
  "security",
  "facility",
  "other"
]

const severities = [
  { value: "low", label: "Low", color: "bg-blue-100 text-blue-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "critical", label: "Critical", color: "bg-red-100 text-red-800" }
]

export default function IncidentForm({ onSuccess, initialData, students }: IncidentFormProps) {
  const [formData, setFormData] = useState<Partial<IncidentInsert>>({
    student_id: initialData?.student_id || "",
    roll_number: "",
    category: initialData?.category || "",
    severity: initialData?.severity || "medium",
    incident_date: initialData?.incident_date || new Date().toISOString().split('T')[0],
    description: initialData?.description || "",
    ...initialData
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Get student_id from roll_number
      const { data: student } = await supabase
        .from("student")
        .select("student_id")
        .eq("roll_number", formData.roll_number!)
        .single()
      
      if (!student) {
        throw new Error("Student not found with this roll number")
      }

      const { error } = await supabase
        .from("incident")
        .insert({
          student_id: student.student_id,
          category: formData.category!,
          severity: formData.severity!,
          incident_date: formData.incident_date!,
          description: formData.description
        })

      if (error) throw error

      setFormData({
        student_id: "",
        roll_number: "",
        category: "",
        severity: "medium",
        incident_date: new Date().toISOString().split('T')[0],
        description: ""
      })

      onSuccess?.()
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Failed to create incident")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-danger-600/20 bg-danger-50 text-danger-600 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Student Roll Number</label>
          <input
            type="text"
            required
            value={formData.roll_number || ""}
            onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
            className="input"
            placeholder="Enter student roll number (e.g., 2023CS001)"
          />
        </div>

        <div>
          <label className="label">Incident Date</label>
          <input
            type="date"
            required
            value={formData.incident_date || ""}
            onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">Category</label>
        <select
          required
          value={formData.category || ""}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="input"
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Severity</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {severities.map((severity) => (
            <label
              key={severity.value}
              className={`
                cursor-pointer px-3 py-2 rounded-lg border text-center text-sm font-medium transition-[background-color,border-color,color,box-shadow]
                ${formData.severity === severity.value
                  ? "border-ring bg-primary-50 text-primary-700 shadow-sm"
                  : "border-border hover:bg-primary-50/60"
                }
              `}
            >
              <input
                type="radio"
                name="severity"
                value={severity.value}
                checked={formData.severity === severity.value}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                className="sr-only"
              />
              {severity.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          rows={4}
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input"
          placeholder="Describe the incident details..."
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="submit" disabled={loading} className="sm:min-w-[170px]">
          {loading ? "Creating..." : "Create Incident"}
        </Button>
        
        {onSuccess && (
          <Button type="button" variant="outline" onClick={() => onSuccess()}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}