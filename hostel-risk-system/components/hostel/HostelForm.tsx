"use client"

import React, { useState } from "react"
import { Database } from "@/lib/supabase/database"
import { supabase } from "@/lib/supabase/client"
import Button from "@/components/ui/Button"

type HostelInsert = Database['public']['Tables']['hostel']['Insert']

interface HostelFormProps {
  onSuccess?: () => void
  initialData?: Partial<HostelInsert>
}

const genderTypes = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "mixed", label: "Mixed" }
]

export default function HostelForm({ onSuccess, initialData }: HostelFormProps) {
  const [formData, setFormData] = useState<Partial<HostelInsert>>({
    hostel_name: "",
    gender_type: "male",
    total_capacity: 0,
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
        .from("hostel")
        .insert({
          hostel_name: formData.hostel_name!,
          gender_type: formData.gender_type!,
          total_capacity: formData.total_capacity!
        })

      if (error) throw error

      setFormData({
        hostel_name: "",
        gender_type: "male",
        total_capacity: 0
      })

      onSuccess?.()
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Failed to create hostel")
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hostel Name
        </label>
        <input
          type="text"
          required
          value={formData.hostel_name || ""}
          onChange={(e) => setFormData({ ...formData, hostel_name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Enter hostel name"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender Type
          </label>
          <select
            required
            value={formData.gender_type || ""}
            onChange={(e) => setFormData({ ...formData, gender_type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select gender type</option>
            {genderTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Capacity
          </label>
          <input
            type="number"
            required
            min="1"
            value={formData.total_capacity || ""}
            onChange={(e) => setFormData({ ...formData, total_capacity: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter total capacity"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Hostel"}
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