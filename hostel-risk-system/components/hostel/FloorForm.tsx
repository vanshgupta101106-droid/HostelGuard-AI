'use client'

import { useState } from 'react'
import { Database } from '@/lib/supabase/database'
import Button from '@/components/ui/Button'

type Floor = Database['public']['Tables']['floor']['Insert']

interface FloorFormProps {
  onSubmit: (data: Floor) => void
  onCancel: () => void
  blocks: Database['public']['Tables']['block']['Row'][]
  initialData?: Floor
}

export default function FloorForm({ onSubmit, onCancel, blocks, initialData }: FloorFormProps) {
  const [formData, setFormData] = useState<Floor>({
    block_id: initialData?.block_id || 0,
    floor_number: initialData?.floor_number || 1
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Block</label>
        <select
          value={formData.block_id}
          onChange={(e) => setFormData({ ...formData, block_id: Number(e.target.value) })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Block</option>
          {blocks.map(block => (
            <option key={block.block_id} value={block.block_id}>
              {block.block_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Floor Number</label>
        <input
          type="number"
          min="1"
          value={formData.floor_number}
          onChange={(e) => setFormData({ ...formData, floor_number: Number(e.target.value) })}
          className="w-full p-2 border rounded"
          placeholder="e.g., 1, 2, 3"
          required
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          {initialData ? 'Update Floor' : 'Create Floor'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
