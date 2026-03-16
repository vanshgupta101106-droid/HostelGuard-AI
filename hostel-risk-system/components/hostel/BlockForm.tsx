"use client"

import React, { useState } from "react"
import { Database } from "@/lib/supabase/database"
import { supabase } from "@/lib/supabase/client"
import Button from "@/components/ui/Button"

type BlockInsert = Database['public']['Tables']['block']['Insert']

interface BlockFormProps {
  onSuccess?: () => void
  hostels?: Database['public']['Tables']['hostel']['Row'][]
  initialData?: Partial<BlockInsert>
}

export default function BlockForm({ onSuccess, hostels = [], initialData }: BlockFormProps) {
  const [formData, setFormData] = useState<Partial<BlockInsert>>({
    hostel_id: 0,
    block_name: "",
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
        .from("block")
        .insert({
          hostel_id: formData.hostel_id!,
          block_name: formData.block_name!
        })

      if (error) throw error

      setFormData({
        hostel_id: 0,
        block_name: ""
      })

      onSuccess?.()
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Failed to create block")
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
            Hostel
          </label>
          <select
            required
            value={formData.hostel_id || ""}
            onChange={(e) => setFormData({ ...formData, hostel_id: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select hostel</option>
            {hostels.map((hostel) => (
              <option key={hostel.hostel_id} value={hostel.hostel_id}>
                {hostel.hostel_name} ({hostel.gender_type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Block Name
          </label>
          <input
            type="text"
            required
            value={formData.block_name || ""}
            onChange={(e) => setFormData({ ...formData, block_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter block name"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Block"}
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