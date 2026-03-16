"use client"

import React, { useState } from "react"
import { Database } from "@/lib/supabase/database"
import { supabase } from "@/lib/supabase/client"
import Button from "@/components/ui/Button"

type StudentInsert = Database['public']['Tables']['student']['Insert']

interface StudentFormProps {
  onSuccess?: () => void
  rooms?: Database['public']['Tables']['room']['Row'][]
  initialData?: Partial<StudentInsert>
}

const departments = [
  "Computer Science",
  "Information Technology",
  "Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Other"
]

const statuses = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" }
]

export default function StudentForm({ onSuccess, rooms = [], initialData }: StudentFormProps) {
  const [formData, setFormData] = useState<Partial<StudentInsert>>({
    roll_number: "",
    full_name: "",
    department: "",
    year: 1,
    parent_contact: "",
    room_id: null,
    status: "active",
    ...initialData
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase
        .from("student")
        .insert({
          roll_number: formData.roll_number!,
          full_name: formData.full_name!,
          department: formData.department!,
          year: formData.year!,
          parent_contact: formData.parent_contact!,
          room_id: formData.room_id || null,
          status: formData.status!
        })

      if (error) throw error

      setFormData({
        roll_number: "",
        full_name: "",
        department: "",
        year: 1,
        parent_contact: "",
        room_id: null,
        status: "active"
      })

      onSuccess?.()
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Failed to create student")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Roll Number
          </label>
          <input
            type="text"
            required
            value={formData.roll_number || ""}
            onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter roll number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            required
            value={formData.full_name || ""}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter full name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <select
            required
            value={formData.department || ""}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select department</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <select
            required
            value={formData.year || 1}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={1}>1st Year</option>
            <option value={2}>2nd Year</option>
            <option value={3}>3rd Year</option>
            <option value={4}>4th Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent Contact
          </label>
          <input
            type="text"
            required
            value={formData.parent_contact || ""}
            onChange={(e) => setFormData({ ...formData, parent_contact: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter parent contact number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room
          </label>
          <select
            value={formData.room_id || ""}
            onChange={(e) => setFormData({ ...formData, room_id: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">No room assigned</option>
            {rooms.map((room) => (
              <option key={room.room_id} value={room.room_id}>
                {room.room_number} (Capacity: {room.capacity})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <div className="grid grid-cols-3 gap-2">
          {statuses.map((status) => (
            <label
              key={status.value}
              className={`
                cursor-pointer px-3 py-2 rounded-lg border-2 text-center text-sm font-medium transition-colors
                ${formData.status === status.value
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <input
                type="radio"
                name="status"
                value={status.value}
                checked={formData.status === status.value}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="sr-only"
              />
              {status.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Student"}
        </Button>
        
        {onSuccess && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}